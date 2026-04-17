import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()

  const [{ data: prospects }, { data: quotes }] = await Promise.all([
    supabase.from('prospects').select('status, created_at'),
    supabase.from('quotes').select('total_ht, status, created_at'),
  ])

  const all = prospects ?? []
  const total = all.length
  const won = all.filter((p) => p.status === 'won').length
  const lost = all.filter((p) => p.status === 'lost').length
  const active = all.filter((p) =>
    ['brief_received', 'quote_sent', 'followup_1', 'followup_2'].includes(p.status)
  ).length

  const conversionRate = total > 0 ? Math.round((won / total) * 100) : 0

  const acceptedQuotes = (quotes ?? []).filter((q) => q.status === 'accepted')
  const totalRevenue = acceptedQuotes.reduce((sum, q) => sum + (q.total_ht ?? 0), 0)
  const avgQuote =
    acceptedQuotes.length > 0
      ? Math.round(totalRevenue / acceptedQuotes.length)
      : 0

  return NextResponse.json({
    total,
    won,
    lost,
    active,
    conversion_rate: conversionRate,
    total_revenue: totalRevenue,
    avg_quote: avgQuote,
    quotes_count: (quotes ?? []).length,
  })
}
