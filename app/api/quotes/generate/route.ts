import { NextRequest, NextResponse } from 'next/server'
import { generateObject } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { findSimilarProjects } from '@/lib/rag/search'
import type { BriefAnalysis, PastProject } from '@/lib/supabase/types'
import { getClientIp, rateLimit } from '@/lib/rate-limit'

const RequestSchema = z.object({
  brief_analysis: z.object({
    project_type: z.string(),
    probable_stack: z.array(z.string()),
    complexity: z.number(),
    unclear_points: z.array(z.string()),
    budget_signals: z.array(z.string()),
    estimated_days: z.number(),
    summary: z.string(),
  }),
  raw_brief: z.string(),
  prospect_id: z.string().uuid().optional(),
  brief_id: z.string().uuid().optional(),
})

const QuoteSchema = z.object({
  lines: z.array(z.object({
    label: z.string(),
    days: z.number(),
    unit_price: z.number(),
    total: z.number(),
  })),
  total_ht: z.number(),
  duration_days: z.number().int(),
  conditions: z.string().describe('Conditions de paiement et de livraison'),
  notes: z.string().describe('Notes ou réserves importantes sur ce devis'),
  similar_projects_used: z.array(z.string()).describe('Noms des projets similaires qui ont orienté l\'estimation'),
})

function buildQuotePrompt(analysis: BriefAnalysis, similarProjects: PastProject[], rawBrief: string): string {
  const projectsCtx = similarProjects.length > 0
    ? similarProjects.map(p =>
        `- ${p.name} (${p.client}) : ${p.type}, ${p.duration_days}j à ${p.daily_rate}€/j = ${p.total_ht}€ HT. Stack : ${p.stack.join(', ')}`
      ).join('\n')
    : 'Aucun projet similaire trouvé.'

  return `Génère un devis structuré pour ce projet.

BRIEF CLIENT :
${rawBrief}

ANALYSE DU BRIEF :
- Type : ${analysis.project_type}
- Complexité : ${analysis.complexity}/5
- Stack probable : ${analysis.probable_stack.join(', ')}
- Estimation initiale : ${analysis.estimated_days} jours
- Résumé : ${analysis.summary}

PROJETS SIMILAIRES LIVRÉS (référence pour calibrer) :
${projectsCtx}

RÈGLES :
- TJM : 350€/jour
- Décomposer en lignes logiques (setup, développement, intégration, tests, déploiement)
- Ajouter 15% de marge sur l'estimation initiale
- Conditions standard : 30% à la commande, 70% à la livraison, délai de paiement 30j
- Mentionner les projets similaires dans les notes pour rassurer le client`
}

export async function POST(req: NextRequest) {
  const rl = await rateLimit(`quotes-generate:${getClientIp(req)}`, { limit: 20, windowMs: 60_000 })
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Trop de requêtes' }, { status: 429 })
  }

  const body = await req.json().catch(() => null)
  const parsed = RequestSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Données invalides' }, { status: 400 })
  }

  try {
    const { brief_analysis, raw_brief, prospect_id, brief_id } = parsed.data

    const similarProjects = await findSimilarProjects(
      `${brief_analysis.project_type} ${brief_analysis.summary}`,
      3
    ).catch(() => [])

    const { object: quoteRaw } = await generateObject({
      model: anthropic('claude-sonnet-4-5'),
      schema: QuoteSchema,
      system: 'Tu es un freelance tech expert qui rédige des devis professionnels précis et transparents.',
      prompt: buildQuotePrompt(brief_analysis as BriefAnalysis, similarProjects, raw_brief),
    })
    const quote = quoteRaw as { lines: unknown; total_ht: number; duration_days: number; conditions: string; notes: string }

    if (prospect_id) {
      const supabase = await createClient()
      await supabase.from('quotes').insert({
        prospect_id,
        brief_id: brief_id ?? null,
        lines: quote.lines as unknown as import('@/lib/supabase/types').Json,
        total_ht: quote.total_ht,
        duration_days: quote.duration_days,
        conditions: quote.conditions,
        notes: quote.notes,
        status: 'draft',
      })
    }

    return NextResponse.json({ ...quote, similar_projects: similarProjects })
  } catch {
    return NextResponse.json({ error: 'Erreur pendant la génération du devis' }, { status: 500 })
  }
}
