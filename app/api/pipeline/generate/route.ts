import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { url } = await req.json()
  if (!url || typeof url !== 'string') {
    return NextResponse.json({ error: 'URL requise' }, { status: 400 })
  }

  const webhookUrl = process.env.SITE_GENERATOR_WEBHOOK_URL
  if (!webhookUrl) {
    return NextResponse.json({ error: 'SITE_GENERATOR_WEBHOOK_URL non configuré' }, { status: 503 })
  }

  const res = await fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-webhook-secret': process.env.WEBHOOK_SECRET ?? '',
    },
    body: JSON.stringify({ url }),
  })

  if (!res.ok) {
    return NextResponse.json({ error: 'Erreur site-generator' }, { status: 502 })
  }

  const data = await res.json().catch(() => ({}))
  return NextResponse.json(data)
}
