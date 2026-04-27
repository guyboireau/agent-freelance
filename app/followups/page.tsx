import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { daysSinceUpdated, needsFollowup } from '@/lib/followups'

export default async function FollowupsPage() {
  const supabase = await createClient()
  const now = new Date()

  const { data: prospects } = await supabase
    .from('prospects')
    .select('*')
    .in('status', ['quote_sent', 'followup_1'])
    .order('updated_at', { ascending: true })

  const toFollowUp = (prospects ?? []).filter((p) => needsFollowup(p, now))

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8 animate-fade-in-up">
        <h1 className="text-2xl font-bold" style={{ color: '#0f172a' }}>À relancer</h1>
        <p className="text-sm mt-1" style={{ color: '#94a3b8' }}>
          Devis sans réponse depuis 7j · Relance 1 sans réponse depuis 10j
        </p>
      </div>

      {toFollowUp.length === 0 ? (
        <div className="animate-scale-in rounded-2xl p-12 text-center"
          style={{ background: '#ffffff', border: '1px solid #e2e8f0' }}>
          <p className="text-2xl mb-2">✓</p>
          <p className="text-sm font-medium" style={{ color: '#0f172a' }}>Rien à relancer aujourd&apos;hui</p>
          <p className="text-xs mt-1" style={{ color: '#94a3b8' }}>Tous tes prospects sont à jour</p>
        </div>
      ) : (
        <div className="space-y-3">
          {toFollowUp.map((p, i) => {
            const daysSince = daysSinceUpdated(p.updated_at, now)
            const isUrgent = daysSince >= 14
            return (
              <div key={p.id}
                className={`animate-fade-in-up stagger-${Math.min(i + 1, 5)} rounded-xl p-5 flex items-center justify-between`}
                style={{ background: '#ffffff', border: `1px solid ${isUrgent ? '#fecaca' : '#e2e8f0'}` }}>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center font-semibold text-sm"
                    style={{ background: isUrgent ? '#fef2f2' : '#f1f5f9', color: isUrgent ? '#b91c1c' : '#475569' }}>
                    {p.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <Link href={`/prospects/${p.id}`} className="text-sm font-semibold hover:underline"
                      style={{ color: '#0f172a' }}>
                      {p.name}
                    </Link>
                    {p.company && <p className="text-xs" style={{ color: '#94a3b8' }}>{p.company}</p>}
                    <p className="text-xs mt-0.5 font-medium"
                      style={{ color: isUrgent ? '#b91c1c' : '#f59e0b' }}>
                      {p.status === 'quote_sent' ? 'Devis envoyé' : 'Relance 1'} · {daysSince} jours sans réponse
                    </p>
                  </div>
                </div>
                <Link href={`/chat?prospect=${p.id}`}
                  className="text-xs px-3 py-1.5 rounded-lg font-medium transition-all"
                  style={{ background: '#0f172a', color: '#ffffff' }}>
                  Rédiger relance
                </Link>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
