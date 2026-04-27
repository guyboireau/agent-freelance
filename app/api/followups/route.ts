import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { needsFollowup } from '@/lib/followups'

// Returns prospects that need a followup based on status + elapsed days
export async function GET() {
  const supabase = await createClient()

  const { data: prospects } = await supabase
    .from('prospects')
    .select('*')
    .in('status', ['quote_sent', 'followup_1'])
    .order('updated_at', { ascending: true })

  const toFollowUp = (prospects ?? []).filter((p) => needsFollowup(p))

  return NextResponse.json(toFollowUp)
}
