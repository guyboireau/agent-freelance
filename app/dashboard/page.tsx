import { createClient } from '@/lib/supabase/server'
import NewProspectForm from '@/components/NewProspectForm'
import ProspectList from '@/components/ProspectList'
import LeadOmeter from '@/components/LeadOmeter'

export default async function Dashboard() {
  const supabase = await createClient()
  const [{ data: prospects }, { data: quotes }] = await Promise.all([
    supabase.from('prospects').select('*').not('status', 'in', '("postponed")').order('updated_at', { ascending: false }),
    supabase.from('quotes').select('total_ht, status'),
  ])

  const active = prospects ?? []
  const wonCount = active.filter((p) => p.status === 'won').length
  const pendingCount = active.filter((p) =>
    ['lead_identified', 'demo_generated', 'r1_done', 'followup_r2'].includes(p.status)
  ).length
  const total = active.length
  const conversionRate = total > 0 ? Math.round((wonCount / total) * 100) : 0
  const totalRevenue = (quotes ?? []).filter((q) => q.status === 'accepted').reduce((s, q) => s + (q.total_ht ?? 0), 0)
  const forecastRevenue = (quotes ?? []).filter((q) => ['draft', 'sent'].includes(q.status)).reduce((s, q) => s + (q.total_ht ?? 0), 0)

  const stats = [
    { label: 'Prospects', value: String(total), accent: '#6366f1' },
    { label: 'En cours', value: String(pendingCount), accent: '#f59e0b' },
    { label: 'Gagnés', value: String(wonCount), accent: '#10b981' },
    { label: 'Conversion', value: `${conversionRate}%`, accent: '#8b5cf6' },
    { label: 'CA signé', value: totalRevenue > 0 ? `${totalRevenue.toLocaleString('fr-FR')}€` : '—', accent: '#0ea5e9' },
    { label: 'CA prévisionnel', value: forecastRevenue > 0 ? `${forecastRevenue.toLocaleString('fr-FR')}€` : '—', accent: '#f97316' },
  ]

  return (
    <div className="p-8 max-w-5xl">
      {/* Stats */}
      <div className="grid grid-cols-6 gap-4 mb-10">
        {stats.map((s, i) => (
          <div
            key={s.label}
            className={`animate-fade-in-up stagger-${i + 1} rounded-2xl p-5`}
            style={{ background: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,.04)' }}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="w-2 h-2 rounded-full mt-1.5" style={{ background: s.accent }} />
            </div>
            <p className="text-3xl font-bold tracking-tight" style={{ color: '#0f172a' }}>{s.value}</p>
            <p className="text-xs font-medium mt-1" style={{ color: '#94a3b8' }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold" style={{ color: '#0f172a' }}>Prospects</h1>
        <NewProspectForm />
      </div>

      {/* List */}
      <ProspectList prospects={active} />

      {/* Lead-O-Meter */}
      <div className="mt-10 max-w-sm">
        <LeadOmeter />
      </div>
    </div>
  )
}
