import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Returns prospects that need a followup based on status + elapsed days
export async function GET() {
  const supabase = await createClient()
  const now = new Date()

  const { data: prospects } = await supabase
    .from('prospects')
    .select('*')
    .in('status', ['quote_sent', 'followup_1'])
    .order('updated_at', { ascending: true })

  const toFollowUp = (prospects ?? []).filter((p) => {
    const daysSince = Math.floor(
      (now.getTime() - new Date(p.updated_at).getTime()) / 86400000
    )
    if (p.status === 'quote_sent' && daysSince >= 7) return true
    if (p.status === 'followup_1' && daysSince >= 10) return true
    return false
  })

  return NextResponse.json(toFollowUp)
}
