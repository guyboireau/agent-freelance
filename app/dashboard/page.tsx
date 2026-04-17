import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import type { ProspectStatus } from '@/lib/supabase/types'
import NewProspectForm from '@/components/NewProspectForm'

const STATUS_LABELS: Record<ProspectStatus, string> = {
  brief_received: 'Brief reçu',
  quote_sent: 'Devis envoyé',
  followup_1: 'Relance 1',
  followup_2: 'Relance 2',
  won: 'Gagné',
  lost: 'Perdu',
  archived: 'Archivé',
}

const STATUS_COLORS: Record<ProspectStatus, string> = {
  brief_received: 'bg-blue-100 text-blue-700',
  quote_sent: 'bg-yellow-100 text-yellow-700',
  followup_1: 'bg-orange-100 text-orange-700',
  followup_2: 'bg-red-100 text-red-700',
  won: 'bg-green-100 text-green-700',
  lost: 'bg-zinc-100 text-zinc-500',
  archived: 'bg-zinc-100 text-zinc-400',
}

export default async function Dashboard() {
  const supabase = await createClient()
  const [{ data: prospects }, { data: quotes }] = await Promise.all([
    supabase.from('prospects').select('*').not('status', 'in', '("archived")').order('updated_at', { ascending: false }),
    supabase.from('quotes').select('total_ht, status'),
  ])

  const active = prospects ?? []
  const wonCount = active.filter((p) => p.status === 'won').length
  const pendingCount = active.filter((p) =>
    ['brief_received', 'quote_sent', 'followup_1', 'followup_2'].includes(p.status)
  ).length
  const lostCount = active.filter((p) => p.status === 'lost').length
  const total = active.length
  const conversionRate = total > 0 ? Math.round((wonCount / total) * 100) : 0

  const acceptedQuotes = (quotes ?? []).filter((q) => q.status === 'accepted')
  const totalRevenue = acceptedQuotes.reduce((s, q) => s + (q.total_ht ?? 0), 0)

  const stats = [
    { label: 'Prospects', value: total },
    { label: 'En cours', value: pendingCount },
    { label: 'Gagnés', value: wonCount },
    { label: 'Conversion', value: `${conversionRate}%` },
    { label: 'CA signé', value: totalRevenue > 0 ? `${totalRevenue.toLocaleString('fr-FR')}€` : '—' },
  ]

  return (
    <div className="p-8 max-w-4xl">
      {/* Stats */}
      <div className="grid grid-cols-5 gap-4 mb-10">
        {stats.map((s) => (
          <div key={s.label} className="bg-white border border-zinc-200 rounded-xl px-4 py-4">
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-xs text-zinc-400 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">Prospects</h1>
        <NewProspectForm />
      </div>

      {active.length === 0 ? (
        <div className="text-zinc-400 text-sm py-12 text-center">
          Aucun prospect pour l&apos;instant — commence par en créer un.
        </div>
      ) : (
        <div className="space-y-2">
          {active.map((p) => (
            <Link
              key={p.id}
              href={`/prospects/${p.id}`}
              className="flex items-center justify-between px-4 py-3 bg-white border border-zinc-200 rounded-lg hover:border-zinc-300 transition"
            >
              <div>
                <span className="font-medium text-sm">{p.name}</span>
                {p.company && <span className="text-zinc-400 text-sm ml-2">· {p.company}</span>}
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-zinc-400">
                  {new Date(p.updated_at).toLocaleDateString('fr-FR')}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[p.status as ProspectStatus]}`}>
                  {STATUS_LABELS[p.status as ProspectStatus]}
                </span>
              </div>
            </Link>
          ))}
          {lostCount > 0 && (
            <p className="text-xs text-zinc-400 text-center pt-2">
              {lostCount} prospect{lostCount > 1 ? 's' : ''} perdu{lostCount > 1 ? 's' : ''} non affiché{lostCount > 1 ? 's' : ''}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
