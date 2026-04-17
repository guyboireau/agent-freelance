import { NextRequest } from 'next/server'
import { streamText, tool } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { findSimilarProjects } from '@/lib/rag/search'

const SYSTEM_PROMPT = `Tu es Jarvis, l'assistant commercial de Guy Boireau, développeur freelance (TJM 350€/jour).
Tu aides à gérer les prospects : analyser les briefs, estimer les projets, générer des devis, rédiger des relances.

Tes outils disponibles :
- search_similar_projects : trouver des projets similaires dans l'historique
- create_prospect : créer un nouveau prospect en base
- list_prospects : lister les prospects actifs
- suggest_followup : rédiger un mail de relance

Réponds toujours en français. Sois direct et professionnel.
Quand on te colle un brief, analyse-le et propose une estimation claire.`

type Message = { role: 'user' | 'assistant'; content: string }

export async function POST(req: NextRequest) {
  const { messages, prospect_id }: { messages: Message[]; prospect_id?: string } = await req.json()
  const supabase = await createClient()

  const result = streamText({
    model: anthropic('claude-sonnet-4-5'),
    system: SYSTEM_PROMPT,
    messages,
    maxSteps: 5,
    tools: {
      search_similar_projects: tool({
        description: "Chercher des projets similaires dans l'historique pour calibrer une estimation",
        parameters: z.object({ query: z.string() }),
        execute: async ({ query }) => findSimilarProjects(query, 3),
      }),

      create_prospect: tool({
        description: 'Créer un nouveau prospect en base de données',
        parameters: z.object({
          name: z.string(),
          company: z.string().optional(),
          email: z.string().optional(),
          source: z.string().optional(),
        }),
        execute: async ({ name, company, email, source }) => {
          const { data, error } = await supabase
            .from('prospects')
            .insert({ name, company, email, source, status: 'brief_received' })
            .select()
            .single()
          if (error) throw error
          return data
        },
      }),

      list_prospects: tool({
        description: 'Lister les prospects actifs avec leur statut',
        parameters: z.object({
          status: z.string().optional(),
        }),
        execute: async ({ status }) => {
          let query = supabase.from('prospects').select('*').order('created_at', { ascending: false })
          if (status) query = query.eq('status', status)
          const { data } = await query.limit(20)
          return data ?? []
        },
      }),

      suggest_followup: tool({
        description: 'Rédiger un mail de relance pour un prospect',
        parameters: z.object({
          prospect_name: z.string(),
          company: z.string().optional(),
          context: z.string(),
        }),
        execute: async ({ prospect_name, company, context }) => {
          const { generateText } = await import('ai')
          const { text } = await generateText({
            model: anthropic('claude-haiku-4-5-20251001'),
            prompt: `Rédige un mail de relance professionnel et chaleureux pour ${prospect_name}${company ? ` (${company})` : ''}.
Contexte : ${context}
Ton : direct, humain, sans pression. 3-4 paragraphes max. Signature : Guy Boireau — Développeur freelance.`,
          })
          return { draft: text }
        },
      }),
    },

    onFinish: async ({ text }) => {
      if (prospect_id && text) {
        const lastUser = messages.at(-1)
        if (lastUser) {
          await supabase.from('messages').insert([
            { prospect_id, role: 'user', content: lastUser.content },
            { prospect_id, role: 'assistant', content: text },
          ])
        }
      }
    },
  })

  return result.toDataStreamResponse()
}
