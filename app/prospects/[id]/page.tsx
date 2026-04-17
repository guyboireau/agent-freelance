import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import BriefAnalyzer from '@/components/BriefAnalyzer'
import QuoteGenerator from '@/components/QuoteGenerator'
import ProspectStatusSelect from '@/components/ProspectStatusSelect'
import type { BriefAnalysis, QuoteLine } from '@/lib/supabase/types'

export default async function ProspectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: prospect }, { data: briefs }, { data: quotes }] = await Promise.all([
    supabase.from('prospects').select('*').eq('id', id).single(),
    supabase.from('briefs').select('*').eq('prospect_id', id).order('created_at', { ascending: false }),
    supabase.from('quotes').select('*').eq('prospect_id', id).order('created_at', { ascending: false }),
  ])

  if (!prospect) notFound()

  const latestBrief = briefs?.[0] ?? null
  const latestQuote = quotes?.[0] ?? null
  const briefAnalysis = latestBrief?.analysis as unknown as BriefAnalysis | null
  const quoteState = latestQuote
    ? {
        lines: (latestQuote.lines as unknown as QuoteLine[]) ?? [],
        total_ht: latestQuote.total_ht ?? 0,
        duration_days: latestQuote.duration_days ?? 0,
        conditions: latestQuote.conditions ?? '',
        notes: latestQuote.notes ?? '',
      }
    : null

  return (
    <div className="p-8 max-w-4xl space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">{prospect.name}</h1>
          {prospect.company && <p className="text-zinc-500">{prospect.company}</p>}
          {prospect.email && <p className="text-zinc-400 text-sm">{prospect.email}</p>}
        </div>
        <ProspectStatusSelect prospectId={id} currentStatus={prospect.status} />
      </div>

      <section>
        <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wide mb-3">Brief</h2>
        <BriefAnalyzer prospectId={id} existingBrief={latestBrief} />
      </section>

      {briefAnalysis && latestBrief && (
        <section>
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wide mb-3">Devis</h2>
          <QuoteGenerator
            prospectId={id}
            briefId={latestBrief.id}
            briefAnalysis={briefAnalysis}
            rawBrief={latestBrief.raw_text}
            existingQuote={quoteState}
            prospectName={prospect.name}
            company={prospect.company}
          />
        </section>
      )}
    </div>
  )
}
