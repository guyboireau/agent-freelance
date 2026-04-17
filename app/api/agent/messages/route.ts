import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const thread_id = req.nextUrl.searchParams.get('thread_id')
  if (!thread_id) return NextResponse.json({ messages: [] })

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
}
