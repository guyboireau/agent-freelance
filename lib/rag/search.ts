import { generateObject } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import type { PastProject } from '@/lib/supabase/types'

// Claude-powered semantic search — no embedding model needed.
// With only ~10 past projects, including them all in the prompt is fast and cheap.
export async function findSimilarProjects(query: string, limit = 3): Promise<PastProject[]> {
  const supabase = await createClient()
  const { data: projects } = await supabase.from('past_projects').select('*')
  if (!projects?.length) return []

  const projectList = projects
    .map((p) => `ID: ${p.id} | ${p.name} (${p.client}) — ${p.type} — ${p.description} — Stack: ${p.stack.join(', ')}`)
    .join('\n')

  const { object } = await generateObject({
    model: anthropic('claude-haiku-4-5-20251001'),
    schema: z.object({
      similar_ids: z.array(z.string()).max(limit).describe('IDs des projets les plus similaires, du plus au moins pertinent'),
    }),
    prompt: `Tu dois identifier les ${limit} projets passés les plus similaires à ce brief/requête.

REQUÊTE : ${query}

PROJETS DISPONIBLES :
${projectList}

Retourne les IDs des projets les plus pertinents.`,
  })

  const ranked = object.similar_ids
    .map((id) => projects.find((p) => p.id === id))
    .filter((p): p is PastProject => p !== undefined)

  return ranked
}
