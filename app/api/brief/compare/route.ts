import { NextRequest, NextResponse } from 'next/server'
import { generateObject } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'
import { openai } from '@ai-sdk/openai'
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

  const [claudeResult, gptResult] = await Promise.allSettled([
    generateObject({
      model: anthropic('claude-sonnet-4-5'),
      schema: BriefAnalysisSchema,
      system: SYSTEM_PROMPT,
      prompt,
    }),
    generateObject({
      model: openai('gpt-4o'),
      schema: BriefAnalysisSchema,
      system: SYSTEM_PROMPT,
      prompt,
    }),
  ])

  const totalMs = Date.now() - start

  return NextResponse.json({
    claude: claudeResult.status === 'fulfilled'
      ? { success: true, analysis: claudeResult.value.object, usage: claudeResult.value.usage }
      : { success: false, error: String(claudeResult.reason) },
    gpt4o: gptResult.status === 'fulfilled'
      ? { success: true, analysis: gptResult.value.object, usage: gptResult.value.usage }
      : { success: false, error: String(gptResult.reason) },
    elapsed_ms: totalMs,
  })
}
