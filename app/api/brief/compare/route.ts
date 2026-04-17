import { NextRequest, NextResponse } from 'next/server'
import { generateObject } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'
import { z } from 'zod'

const RequestSchema = z.object({
  raw_text: z.string().min(20),
})

const BriefAnalysisSchema = z.object({
  project_type: z.string(),
  probable_stack: z.array(z.string()),
  complexity: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]),
  unclear_points: z.array(z.string()),
  budget_signals: z.array(z.string()),
  estimated_days: z.number().int().positive(),
  summary: z.string(),
})

const SYSTEM_PROMPT = `Tu es un développeur freelance senior avec 8 ans d'expérience.
Tu analyses des briefs clients pour en extraire les informations clés.
TJM de référence : 350€/jour.
Pour la complexité : 1=landing page simple, 2=site vitrine, 3=webapp CRUD, 4=app avec logique métier complexe, 5=architecture distribuée/temps réel/IA.`

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  const parsed = RequestSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Texte du brief manquant (min 20 caractères)' }, { status: 400 })
  }

  const { raw_text } = parsed.data
  const prompt = `Analyse ce brief client :\n\n${raw_text}`
  const start = Date.now()

  const [sonnetResult, haikuResult] = await Promise.allSettled([
    generateObject({
      model: anthropic('claude-sonnet-4-5'),
      schema: BriefAnalysisSchema,
      system: SYSTEM_PROMPT,
      prompt,
    }),
    generateObject({
      model: anthropic('claude-haiku-4-5-20251001'),
      schema: BriefAnalysisSchema,
      system: SYSTEM_PROMPT,
      prompt,
    }),
  ])

  return NextResponse.json({
    sonnet: sonnetResult.status === 'fulfilled'
      ? { success: true, analysis: sonnetResult.value.object, usage: sonnetResult.value.usage }
      : { success: false, error: String(sonnetResult.reason) },
    haiku: haikuResult.status === 'fulfilled'
      ? { success: true, analysis: haikuResult.value.object, usage: haikuResult.value.usage }
      : { success: false, error: String(haikuResult.reason) },
    elapsed_ms: Date.now() - start,
  })
}
