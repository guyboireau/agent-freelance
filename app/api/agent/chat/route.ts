import { NextRequest, NextResponse } from 'next/server'
import { streamText, tool } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { findSimilarProjects } from '@/lib/rag/search'
import { FREELANCER, ACTIVE_PROJECTS } from '@/lib/freelancer'
import { getClientIp, rateLimit } from '@/lib/rate-limit'

const SYSTEM_PROMPT = `Tu es Jarvis, l'assistant commercial de ${FREELANCER.name}, développeur freelance (TJM ${FREELANCER.tjm}€/jour).

## Contexte métier
- Stack principale : TypeScript · React / Next.js · React Native (Expo) · Supabase · Tailwind
- Estimation React Native : multiplier ×1.3 (tests device, cycles App Store)
- Conditions standard : ${FREELANCER.deposit_percent}% à la commande, ${100 - FREELANCER.deposit_percent}% à la livraison, ${FREELANCER.payment_terms}

## Projets actifs en cours
${ACTIVE_PROJECTS.map((p) => `- **${p.name}** (${p.client}) — ${p.type} · ${p.stack}`).join('\n')}

## Tes capacités
- Analyser des briefs clients et estimer en jours/€
- Générer des devis structurés avec items détaillés
- Rédiger des relances email et mails d'envoi de devis
- Suggérer des actions commerciales
- Consulter et créer des prospects en base
- Trouver des projets similaires pour calibrer les estimations

Réponds toujours en français. Sois direct, professionnel et précis dans les estimations.
Quand tu analyses un brief, donne toujours : type de projet, complexité /5, estimation en jours et €, points à clarifier.`

type Message = { role: 'user' | 'assistant'; content: string }

const BodySchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string().min(1).max(12000),
      })
    )
    .min(1)
    .max(50),
  prospect_id: z.string().uuid().optional(),
  thread_id: z
    .string()
    .min(10)
    .max(120)
    .regex(/^thread_[a-zA-Z0-9_]+$/)
    .optional(),
})

export async function POST(req: NextRequest) {
  const rl = rateLimit(`agent-chat:${getClientIp(req)}`, { limit: 30, windowMs: 60_000 })
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Trop de requêtes' }, { status: 429 })
  }

  const body = await req.json().catch(() => null)
  const parsed = BodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Payload invalide' }, { status: 400 })
  }

  const { messages, prospect_id, thread_id } = parsed.data as {
    messages: Message[]
    prospect_id?: string
    thread_id?: string
  }

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
          let query = supabase.from('prospects').select('*').order('updated_at', { ascending: false })
          if (status) query = query.eq('status', status)
          const { data } = await query.limit(20)
          return data ?? []
        },
      }),

      get_prospect_details: tool({
        description: 'Obtenir les détails complets d\'un prospect (brief, devis, historique)',
        parameters: z.object({
          prospect_id: z.string().describe('UUID du prospect'),
        }),
        execute: async ({ prospect_id: pid }) => {
          const [{ data: prospect }, { data: briefs }, { data: quotes }] = await Promise.all([
            supabase.from('prospects').select('*').eq('id', pid).single(),
            supabase.from('briefs').select('*').eq('prospect_id', pid).order('created_at', { ascending: false }).limit(1),
            supabase.from('quotes').select('*').eq('prospect_id', pid).order('created_at', { ascending: false }).limit(1),
          ])
          return { prospect, brief: briefs?.[0] ?? null, quote: quotes?.[0] ?? null }
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
Ton : direct, humain, sans pression. 3-4 paragraphes max. Signature : ${FREELANCER.name} — ${FREELANCER.title}.`,
          })
          return { draft: text }
        },
      }),
    },

    onFinish: async ({ text }) => {
      if (text && (thread_id || prospect_id)) {
        const lastUser = messages.at(-1)
        if (lastUser) {
          await supabase.from('messages').insert([
            { prospect_id: prospect_id ?? null, thread_id: thread_id ?? null, role: 'user', content: lastUser.content },
            { prospect_id: prospect_id ?? null, thread_id: thread_id ?? null, role: 'assistant', content: text },
          ])
        }
      }
    },
  })

  return result.toDataStreamResponse()
}
