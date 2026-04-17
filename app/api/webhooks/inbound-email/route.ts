/**
 * POST /api/webhooks/inbound-email
 *
 * Endpoint Make.com : reçoit un email entrant (brief client), crée le prospect
 * en base, analyse le brief avec Claude, et retourne un JSON structuré que
 * Make utilise pour envoyer la notification Gmail.
 *
 * Sécurité : header x-webhook-secret doit correspondre à WEBHOOK_SECRET (.env)
 *
 * Corps attendu depuis Make.com (module HTTP) :
 * {
 *   "from_name":  "{{1.from.name}}",
 *   "from_email": "{{1.from.email}}",
 *   "subject":    "{{1.subject}}",
 *   "body":       "{{1.body.text}}"
 * }
 */

import { NextRequest, NextResponse } from 'next/server'
import { generateObject } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const RequestSchema = z.object({
  from_name:  z.string().min(1),
  from_email: z.string().email(),
  subject:    z.string().default(''),
  body:       z.string().min(10),
})

const BriefAnalysisSchema = z.object({
  project_type:   z.string(),
  probable_stack: z.array(z.string()),
  complexity:     z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]),
  unclear_points: z.array(z.string()),
  budget_signals: z.array(z.string()),
  estimated_days: z.number().int().positive(),
  summary:        z.string(),
})

const SYSTEM_PROMPT = `Tu es un développeur freelance senior avec 8 ans d'expérience.
Tu analyses des briefs clients (mails, messages LinkedIn, notes d'appel) pour en extraire les informations clés.
TJM de référence : 350€/jour.
Sois pragmatique et honnête dans tes estimations. Mieux vaut surestimer légèrement que sous-estimer.
Complexité : 1=landing page, 2=site vitrine, 3=webapp CRUD, 4=logique métier complexe, 5=architecture distribuée/IA.`

export async function POST(req: NextRequest) {
  // Auth
  const secret = req.headers.get('x-webhook-secret')
  if (process.env.WEBHOOK_SECRET && secret !== process.env.WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const raw = await req.json().catch(() => null)
  const parsed = RequestSchema.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Champs manquants', details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const { from_name, from_email, subject, body } = parsed.data
  const supabase = await createClient()

  // Crée ou retrouve le prospect par email
  let prospectId: string

  const { data: existing } = await supabase
    .from('prospects')
    .select('id, name')
    .eq('email', from_email)
    .maybeSingle()

  if (existing) {
    prospectId = existing.id
  } else {
    const { data: created, error: createErr } = await supabase
      .from('prospects')
      .insert({
        name:   from_name,
        email:  from_email,
        source: 'email',
        status: 'brief_received',
      })
      .select('id')
      .single()

    if (createErr || !created) {
      return NextResponse.json({ error: 'Impossible de créer le prospect' }, { status: 500 })
    }
    prospectId = created.id
  }

  // Analyse Claude
  const briefText = subject ? `Objet : ${subject}\n\n${body}` : body
  const { object: analysis } = await generateObject({
    model:  anthropic('claude-sonnet-4-5'),
    schema: BriefAnalysisSchema,
    system: SYSTEM_PROMPT,
    prompt: `Analyse ce brief client :\n\n${briefText}`,
  })

  // Sauvegarde brief + analyse
  await supabase.from('briefs').insert({
    prospect_id: prospectId,
    raw_text:    briefText,
    analysis:    analysis as unknown as import('@/lib/supabase/types').Json,
  })

  // Réponse Make.com — chaque champ est accessible via {{2.champ}} dans Make
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://agent-freelance.vercel.app'

  return NextResponse.json({
    prospect_id:    prospectId,
    prospect_name:  from_name,
    prospect_url:   `${appUrl}/prospects/${prospectId}`,
    is_new_prospect: !existing,

    // Analyse — accessible via {{2.analysis.summary}}, {{2.analysis.complexity}}, etc.
    analysis: {
      summary:        analysis.summary,
      project_type:   analysis.project_type,
      complexity:     analysis.complexity,
      estimated_days: analysis.estimated_days,
      estimated_ht:   analysis.estimated_days * 350,
      probable_stack: analysis.probable_stack.join(', '),
      unclear_points: analysis.unclear_points.join('\n• '),
      budget_signals: analysis.budget_signals.join('\n• '),
    },

    // Bloc texte prêt à coller dans le mail de notif Make.com ({{2.summary_block}})
    summary_block: [
      `📋 ${analysis.project_type.toUpperCase()} — Complexité ${analysis.complexity}/5`,
      `⏱  Estimation : ${analysis.estimated_days}j · ${analysis.estimated_days * 350}€ HT`,
      `🔧 Stack : ${analysis.probable_stack.join(', ')}`,
      '',
      analysis.summary,
      '',
      analysis.unclear_points.length
        ? `❓ Points à clarifier :\n• ${analysis.unclear_points.join('\n• ')}`
        : '',
      analysis.budget_signals.length
        ? `💰 Signaux budget :\n• ${analysis.budget_signals.join('\n• ')}`
        : '',
      '',
      `→ Voir la fiche : ${appUrl}/prospects/${prospectId}`,
    ].filter(Boolean).join('\n'),
  })
}
