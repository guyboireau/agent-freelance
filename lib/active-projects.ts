/**
 * Projets en cours, cités dans le prompt du chat agent (app/api/agent/chat).
 *
 * Ce sont des données internes (noms de clients) : jamais versionnées (dépôt
 * public) ni envoyées au navigateur. Elles viennent de la variable serveur
 * FREELANCER_ACTIVE_PROJECTS : sans préfixe NEXT_PUBLIC_, Next ne l'inline dans
 * aucun bundle client. Format, un tableau JSON sur une ligne :
 * [{"name":"Projet","client":"Client","stack":"Next.js · Supabase","type":"SaaS"}]
 */

import { z } from 'zod'

const ActiveProjectSchema = z.object({
  name: z.string().min(1),
  client: z.string().min(1),
  stack: z.string().min(1),
  type: z.string().min(1),
})

export type ActiveProject = z.infer<typeof ActiveProjectSchema>

/**
 * Variable absente ou vide : liste vide. Variable invalide : liste vide et
 * avertissement, sans jamais journaliser son contenu.
 */
export function parseActiveProjects(raw: string | undefined): ActiveProject[] {
  if (!raw?.trim()) return []

  let json: unknown
  try {
    json = JSON.parse(raw)
  } catch {
    console.warn('FREELANCER_ACTIVE_PROJECTS ignorée : JSON invalide')
    return []
  }

  const parsed = z.array(ActiveProjectSchema).safeParse(json)
  if (!parsed.success) {
    console.warn('FREELANCER_ACTIVE_PROJECTS ignorée : format attendu [{ name, client, stack, type }]')
    return []
  }
  return parsed.data
}

export const ACTIVE_PROJECTS: ActiveProject[] = parseActiveProjects(process.env.FREELANCER_ACTIVE_PROJECTS)
