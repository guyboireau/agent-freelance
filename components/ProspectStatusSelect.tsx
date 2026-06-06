'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { ProspectStatus } from '@/lib/supabase/types'

const OPTIONS: { value: ProspectStatus; label: string }[] = [
  { value: 'lead_identified', label: 'Lead identifié' },
  { value: 'demo_generated', label: 'Site démo généré' },
  { value: 'r1_done', label: 'R1 effectué' },
  { value: 'followup_r2', label: 'En relance R2' },
  { value: 'won', label: 'Gagné' },
  { value: 'lost', label: 'Perdu' },
  { value: 'postponed', label: 'Reporté' },
]

export default function ProspectStatusSelect({
  prospectId,
  currentStatus,
}: {
  prospectId: string
  currentStatus: string
}) {
  const [status, setStatus] = useState(currentStatus)
  const router = useRouter()

  async function update(next: string) {
    setStatus(next)
    const supabase = createClient()
    await supabase.from('prospects').update({ status: next }).eq('id', prospectId)
    router.refresh()
  }

  return (
    <select
      value={status}
      onChange={(e) => update(e.target.value)}
      className="px-3 py-1.5 border border-zinc-200 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-zinc-900"
    >
      {OPTIONS.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  )
}
