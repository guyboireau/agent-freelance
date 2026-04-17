import { NextRequest, NextResponse } from 'next/server'
import { Octokit } from '@octokit/rest'
import { generateObject } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'
import { z } from 'zod'

function parseGitHubUrl(url: string): { owner: string; repo: string } | null {
  try {
    const normalized = url.startsWith('http') ? url : `https://${url}`
    const { hostname, pathname } = new URL(normalized)
    if (hostname !== 'github.com') return null
    const parts = pathname.replace(/^\//, '').replace(/\.git$/, '').split('/')
    if (parts.length < 2 || !parts[0] || !parts[1]) return null
    return { owner: parts[0], repo: parts[1] }
  } catch {
    return null
  }
}

const PostsSchema = z.object({
  posts: z.tuple([
    z.object({ tone: z.literal('narrative'), label: z.literal('Narratif'), content: z.string(), hook: z.string() }),
    z.object({ tone: z.literal('technical'), label: z.literal('Technique'), content: z.string(), hook: z.string() }),
    z.object({ tone: z.literal('rex'), label: z.literal("Retour d'expérience"), content: z.string(), hook: z.string() }),
  ]),
})

const SYSTEM_PROMPT = `Tu es un expert en personal branding pour développeurs sur LinkedIn.
Tu génères des posts percutants à partir d'informations sur un projet GitHub.

Règles absolues :
- Longueur : 1200 à 1800 caractères par post (espaces inclus)
- Pas d'emojis sauf 1-2 maximum si vraiment pertinents
- Pas de hashtags génériques (#innovation, #tech) — 2-3 hashtags ciblés max en fin de post
- Pas de formules creuses ("Dans un monde où...", "La tech évolue vite...")
- Commencer par une accroche forte qui donne envie de cliquer "voir plus"
- Écrire à la première personne, ton naturel et direct
- Terminer par une question ou un call to action concret

Ton NARRATIF : raconte l'histoire du projet — pourquoi, comment, ce qui était dur, ce que ça a changé.
Ton TECHNIQUE : explique un choix technique précis, une architecture, un problème résolu — pour les devs.
Ton REX : bilan honnête — ce qui a marché, ce qui n'a pas marché, ce que tu referais différemment.`

export async function POST(req: NextRequest) {
  const { url } = await req.json().catch(() => ({ url: null }))
  if (!url) return NextResponse.json({ error: 'URL manquante' }, { status: 400 })

  const coords = parseGitHubUrl(url)
  if (!coords) return NextResponse.json({ error: 'URL GitHub invalide' }, { status: 400 })

  const octokit = new Octokit()
  const { owner, repo } = coords

  let repoMeta
  try {
    const { data } = await octokit.rest.repos.get({ owner, repo })
    repoMeta = data
  } catch (err: unknown) {
    const e = err as { status?: number }
    if (e.status === 404) return NextResponse.json({ error: 'Repo introuvable ou privé' }, { status: 404 })
    if (e.status === 403) return NextResponse.json({ error: 'Rate limit GitHub atteint' }, { status: 429 })
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }

  const [commitsResult, languagesResult, readmeResult] = await Promise.allSettled([
    octokit.rest.repos.listCommits({ owner, repo, per_page: 10 }),
    octokit.rest.repos.listLanguages({ owner, repo }),
    octokit.rest.repos.getReadme({ owner, repo }),
  ])

  const languages = languagesResult.status === 'fulfilled' ? Object.keys(languagesResult.value.data) : []
  const commits = commitsResult.status === 'fulfilled'
    ? commitsResult.value.data.map((c) => ({ message: c.commit.message.split('\n')[0], author: c.commit.author?.name }))
    : []
  const readme = readmeResult.status === 'fulfilled'
    ? Buffer.from(readmeResult.value.data.content, 'base64').toString('utf-8').slice(0, 2000)
    : ''

  let depList = ''
  if (languages.some((l) => ['TypeScript', 'JavaScript'].includes(l))) {
    try {
      const { data } = await octokit.rest.repos.getContent({ owner, repo, path: 'package.json' })
      if ('content' in data) {
        const pkg = JSON.parse(Buffer.from(data.content, 'base64').toString('utf-8'))
        depList = Object.keys(pkg.dependencies ?? {}).slice(0, 15).join(', ')
      }
    } catch { /* no package.json */ }
  }

  const context = [
    `# ${repoMeta.full_name}`,
    `Description : ${repoMeta.description ?? 'aucune'}`,
    `Stars : ${repoMeta.stargazers_count} | Forks : ${repoMeta.forks_count}`,
    `Topics : ${(repoMeta.topics ?? []).join(', ') || 'aucun'}`,
    `Langages : ${languages.join(', ') || 'non détectés'}`,
    depList ? `Dépendances : ${depList}` : '',
    commits.length ? `\n## Commits récents\n${commits.map((c) => `- ${c.message}`).join('\n')}` : '',
    readme ? `\n## README\n${readme}` : '',
  ].filter(Boolean).join('\n')

  const { object } = await generateObject({
    model: anthropic('claude-sonnet-4-5'),
    schema: PostsSchema,
    system: SYSTEM_PROMPT,
    prompt: `Génère 3 posts LinkedIn pour ce projet GitHub :\n\n${context}`,
  })

  return NextResponse.json({ repoName: repoMeta.full_name, posts: object.posts })
}
