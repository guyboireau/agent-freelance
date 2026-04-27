import { NextRequest, NextResponse } from 'next/server'
import { generateObject } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { getClientIp, rateLimit } from '@/lib/rate-limit'

const RequestSchema = z.object({
  raw_text: z.string().min(20),
  prospect_id: z.string().uuid().optional(),
})

const BriefAnalysisSchema = z.object({
  project_type: z.string().describe('Type de projet : webapp, site-vitrine, mobile, api, refacto, etc.'),
  probable_stack: z.array(z.string()).describe('Stack technique probable déduite du brief'),
  complexity: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)])
    .describe('Complexité de 1 (très simple) à 5 (très complexe)'),
  unclear_points: z.array(z.string()).describe('Points flous à clarifier avec le client'),
  budget_signals: z.array(z.string()).describe('Indices sur le budget : mots clés, comparaisons mentionnées, urgence'),
  estimated_days: z.number().int().positive().describe('Estimation de jours de travail (TJM 350€)'),
  summary: z.string().describe('Résumé du projet en 2-3 phrases, ton professionnel'),
})

const SYSTEM_PROMPT = `Tu es un développeur freelance senior avec 8 ans d'expérience.
Tu analyses des briefs clients (mails, messages LinkedIn, notes d'appel) pour en extraire les informations clés.
TJM de référence : 350€/jour.
Sois pragmatique et honnête dans tes estimations. Mieux vaut surestimer légèrement que sous-estimer.
Pour la complexité : 1=landing page simple, 2=site vitrine, 3=webapp CRUD, 4=app avec logique métier complexe, 5=architecture distribuée/temps réel/IA.`

export async function POST(req: NextRequest) {
  const rl = rateLimit(`brief-analyze:${getClientIp(req)}`, { limit: 20, windowMs: 60_000 })
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Trop de requêtes' }, { status: 429 })
  }

  const body = await req.json().catch(() => null)
  const parsed = RequestSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Texte du brief manquant (min 20 caractères)' }, { status: 400 })
  }

  try {
    const { raw_text, prospect_id } = parsed.data

    const { object: analysis } = await generateObject({
      model: anthropic('claude-sonnet-4-5'),
      schema: BriefAnalysisSchema,
      system: SYSTEM_PROMPT,
      prompt: `Analyse ce brief client :\n\n${raw_text}`,
    })

    if (prospect_id) {
      const supabase = await createClient()
      await supabase.from('briefs').insert({ prospect_id, raw_text, analysis: analysis as unknown as import('@/lib/supabase/types').Json })
    }

    return NextResponse.json(analysis)
  } catch {
    return NextResponse.json({ error: 'Erreur pendant l\'analyse du brief' }, { status: 500 })
  }
}
