import { NextRequest, NextResponse } from 'next/server'
import { Octokit } from '@octokit/rest'
import { generateObject } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'
import { z } from 'zod'
import { getClientIp, rateLimit } from '@/lib/rate-limit'

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
  posts: z.array(
    z.object({
      tone: z.enum(['narrative', 'technical', 'rex', 'promo']),
      label: z.string(),
      content: z.string(),
      hook: z.string(),
    })
  ).min(3).max(4),
})

const SYSTEM_PROMPT = `Tu es un expert en personal branding pour développeurs et indépendants sur LinkedIn.
Tu génères des posts percutants et authentiques.

Règles absolues :
- Longueur : 1200 à 1800 caractères par post (espaces inclus)
- Pas d'emojis sauf 1-2 maximum si vraiment pertinents
- Pas de hashtags génériques (#innovation, #tech) — 2-3 hashtags ciblés max en fin de post
- Pas de formules creuses ("Dans un monde où...", "La tech évolue vite...")
- Commencer par une accroche forte qui donne envie de cliquer "voir plus"
- Écrire à la première personne, ton naturel et direct
- Terminer par une question ou un call to action concret

Ton NARRATIF : raconte l'histoire — pourquoi, comment, ce qui était dur, ce que ça a changé.
Ton TECHNIQUE : explique un choix technique précis, une architecture, un problème résolu — pour les devs.
Ton REX : bilan honnête — ce qui a marché, ce qui n'a pas marché, ce que tu referais différemment.
Ton PROMO : post de visibilité/acquisition — met en avant ton expertise ou une offre de service. Doit convertir sans être racoleur.`

export async function POST(req: NextRequest) {
  const rl = rateLimit(`linkedin:${getClientIp(req)}`, { limit: 12, windowMs: 60_000 })
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Trop de requêtes' }, { status: 429 })
  }

  const body = await req.json().catch(() => ({}))
  const { url, topic, context: topicContext, mode = 'github' } = body

  // Mode sujet libre
  if (mode === 'topic') {
    if (!topic?.trim()) return NextResponse.json({ error: 'Sujet manquant' }, { status: 400 })

    const contextBlock = topicContext?.trim()
      ? `\n\n## Contexte additionnel\n${topicContext}`
      : ''

    try {
      const { object: result } = await generateObject({
        model: anthropic('claude-sonnet-4-5'),
        schema: PostsSchema,
        system: SYSTEM_PROMPT,
        prompt: `Génère 4 posts LinkedIn sur ce sujet :\n\n**${topic}**${contextBlock}\n\nInclus les 4 tons : Narratif, Technique, REX, et Promotionnel.`,
      })

      return NextResponse.json({ repoName: topic, posts: (result as { posts: unknown }).posts, mode: 'topic' })
    } catch {
      return NextResponse.json({ error: 'Erreur pendant la génération des posts' }, { status: 500 })
    }
  }

  // Mode GitHub (existant)
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

  const githubContext = [
    `# ${repoMeta.full_name}`,
    `Description : ${repoMeta.description ?? 'aucune'}`,
    `Stars : ${repoMeta.stargazers_count} | Forks : ${repoMeta.forks_count}`,
    `Topics : ${(repoMeta.topics ?? []).join(', ') || 'aucun'}`,
    `Langages : ${languages.join(', ') || 'non détectés'}`,
    depList ? `Dépendances : ${depList}` : '',
    commits.length ? `\n## Commits récents\n${commits.map((c) => `- ${c.message}`).join('\n')}` : '',
    readme ? `\n## README\n${readme}` : '',
  ].filter(Boolean).join('\n')

  try {
    const { object: result } = await generateObject({
      model: anthropic('claude-sonnet-4-5'),
      schema: PostsSchema,
      system: SYSTEM_PROMPT,
      prompt: `Génère 3 posts LinkedIn (Narratif, Technique, REX) pour ce projet GitHub :\n\n${githubContext}`,
    })

    return NextResponse.json({ repoName: repoMeta.full_name, posts: (result as { posts: unknown }).posts, mode: 'github' })
  } catch {
    return NextResponse.json({ error: 'Erreur pendant la génération des posts' }, { status: 500 })
  }
}
