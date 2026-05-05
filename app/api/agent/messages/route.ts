import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { getClientIp, rateLimit } from '@/lib/rate-limit'

const ThreadSchema = z
  .string()
  .min(10)
  .max(120)
  .regex(/^thread_[a-zA-Z0-9_]+$/)

export async function GET(req: NextRequest) {
  const rl = await rateLimit(`agent-messages:${getClientIp(req)}`, { limit: 120, windowMs: 60_000 })
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Trop de requêtes' }, { status: 429 })
  }

  const threadIdRaw = req.nextUrl.searchParams.get('thread_id')
  if (!threadIdRaw) return NextResponse.json({ messages: [] })

  const threadParsed = ThreadSchema.safeParse(threadIdRaw)
  if (!threadParsed.success) {
    return NextResponse.json({ messages: [] })
  }

  const thread_id = threadParsed.data

  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('messages')
      .select('id, role, content, created_at')
      .eq('thread_id', thread_id)
      .order('created_at', { ascending: true })
      .limit(100)

    const messages = (data ?? []).map((m) => ({
      id: m.id,
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }))

    return NextResponse.json({ messages })
  } catch {
    return NextResponse.json({ messages: [] }, { status: 200 })
  }
}
