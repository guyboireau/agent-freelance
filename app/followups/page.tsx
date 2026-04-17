import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function FollowupsPage() {
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

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-bold mb-2">À relancer</h1>
      <p className="text-zinc-500 text-sm mb-8">
        Devis sans réponse depuis 7j · Relance 1 sans réponse depuis 10j
      </p>

      {toFollowUp.length === 0 ? (
        <p className="text-zinc-400 text-sm py-12 text-center">Rien à relancer aujourd&apos;hui.</p>
      ) : (
        <div className="space-y-3">
          {toFollowUp.map((p) => {
            const daysSince = Math.floor(
              (now.getTime() - new Date(p.updated_at).getTime()) / 86400000
            )
            return (
              <div key={p.id} className="bg-white border border-zinc-200 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <Link href={`/prospects/${p.id}`} className="font-medium hover:underline">
                    {p.name}
                  </Link>
                  {p.company && <span className="text-zinc-400 text-sm ml-2">· {p.company}</span>}
                  <p className="text-xs text-orange-600 mt-0.5">
                    {p.status === 'quote_sent' ? 'Devis envoyé' : 'Relance 1 envoyée'} · {daysSince} jours sans réponse
                  </p>
                </div>
                <Link
                  href={`/chat?prospect=${p.id}&action=followup`}
                  className="px-3 py-1.5 text-xs bg-zinc-900 text-white rounded-lg hover:bg-zinc-700 transition"
                >
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
