import { NextRequest, NextResponse } from 'next/server'
import { generateText } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'
import { FREELANCER } from '@/lib/freelancer'
import { getClientIp, rateLimit } from '@/lib/rate-limit'

export type EmailType = 'send_quote' | 'followup' | 'thanks' | 'decline' | 'proposal'

const EMAIL_PROMPTS: Record<EmailType, (ctx: EmailContext) => string> = {
  send_quote: (ctx) => `Rédige un email d'envoi de devis pour ${ctx.prospectName}${ctx.company ? ` (${ctx.company})` : ''}.
Montant du devis : ${ctx.quoteAmount ? `${ctx.quoteAmount}€ HT` : 'à préciser'}.
Projet : ${ctx.projectSummary ?? 'développement web/mobile'}.
Ton : professionnel mais chaleureux. Explique brièvement ce que comprend le devis, invite à poser des questions.
3-4 paragraphes max. Objet du mail inclus en première ligne avec le préfixe "Objet : ".`,

  followup: (ctx) => `Rédige un email de relance pour ${ctx.prospectName}${ctx.company ? ` (${ctx.company})` : ''}.
Contexte : ${ctx.context ?? 'devis envoyé il y a quelques jours, pas de réponse'}.
Ton : direct, humain, sans pression. Rappelle discrètement la proposition, propose un créneau d'appel.
3 paragraphes max. Objet inclus en première ligne avec le préfixe "Objet : ".`,

  thanks: (ctx) => `Rédige un email de remerciement pour ${ctx.prospectName}${ctx.company ? ` (${ctx.company})` : ''} qui vient de signer.
Contexte : ${ctx.context ?? 'contrat signé, projet qui démarre'}.
Ton : enthousiaste et professionnel. Confirme les prochaines étapes, donne de la visibilité sur le démarrage.
3 paragraphes max. Objet inclus en première ligne avec le préfixe "Objet : ".`,

  decline: (ctx) => `Rédige un email de refus poli pour ${ctx.prospectName}${ctx.company ? ` (${ctx.company})` : ''}.
Contexte : ${ctx.context ?? 'projet ne correspond pas à mes critères ou planning chargé'}.
Ton : respectueux, laisse la porte ouverte pour une collaboration future. Pas de justification excessive.
2-3 paragraphes max. Objet inclus en première ligne avec le préfixe "Objet : ".`,

  proposal: (ctx) => `Rédige un email de proposition commerciale proactive pour ${ctx.prospectName}${ctx.company ? ` (${ctx.company})` : ''}.
Contexte : ${ctx.context ?? 'opportunité identifiée, prise de contact initiale'}.
Projet envisagé : ${ctx.projectSummary ?? 'à préciser'}.
Ton : confiant, valeur ajoutée claire, appel à l'action concret. Propose un appel découverte de 30 min.
3-4 paragraphes max. Objet inclus en première ligne avec le préfixe "Objet : ".`,
}

interface EmailContext {
  prospectName: string
  company?: string
  quoteAmount?: number
  projectSummary?: string
  context?: string
}

export async function POST(req: NextRequest) {
  const rl = rateLimit(`email-generate:${getClientIp(req)}`, { limit: 30, windowMs: 60_000 })
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Trop de requêtes' }, { status: 429 })
  }

  const body = await req.json().catch(() => null)
  if (!body?.type || !body?.prospectName) {
    return NextResponse.json({ error: 'type et prospectName requis' }, { status: 400 })
  }

  const { type, ...ctx }: { type: EmailType } & EmailContext = body
  const promptFn = EMAIL_PROMPTS[type]
  if (!promptFn) return NextResponse.json({ error: 'Type inconnu' }, { status: 400 })

  try {
    const { text } = await generateText({
      model: anthropic('claude-haiku-4-5-20251001'),
      system: `Tu es l'assistant de ${FREELANCER.name}, ${FREELANCER.title} (TJM ${FREELANCER.tjm}€/j).
Rédige des emails professionnels en français, concis et efficaces.
Signature à la fin : ${FREELANCER.name} — ${FREELANCER.title}
${FREELANCER.email} · ${FREELANCER.website}`,
      prompt: promptFn(ctx),
    })

    const lines = text.trim().split('\n')
    const subjectLine = lines.find((l) => l.startsWith('Objet :'))
    const subject = subjectLine ? subjectLine.replace('Objet :', '').trim() : ''
    const body_text = lines.filter((l) => !l.startsWith('Objet :')).join('\n').trim()

    return NextResponse.json({ subject, body: body_text })
  } catch {
    return NextResponse.json({ error: 'Erreur pendant la génération de l\'email' }, { status: 500 })
  }
}
