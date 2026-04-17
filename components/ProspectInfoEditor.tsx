'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Prospect } from '@/lib/supabase/types'

type EditableFields = Pick<Prospect, 'email' | 'phone' | 'siret' | 'address' | 'company'>

export default function ProspectInfoEditor({ prospect }: { prospect: Prospect }) {
  const [open, setOpen] = useState(false)
  const [fields, setFields] = useState<EditableFields>({
    email: prospect.email ?? '',
    phone: prospect.phone ?? '',
    siret: prospect.siret ?? '',
    address: prospect.address ?? '',
    company: prospect.company ?? '',
  })
  const [saving, setSaving] = useState(false)
  const router = useRouter()

  const hasData = Object.values({ email: prospect.email, phone: prospect.phone, siret: prospect.siret, address: prospect.address }).some(Boolean)

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const supabase = createClient()
    await supabase.from('prospects').update({
      email: fields.email || null,
      phone: fields.phone || null,
      siret: fields.siret || null,
      address: fields.address || null,
      company: fields.company || null,
    }).eq('id', prospect.id)
    setSaving(false)
    setOpen(false)
    router.refresh()
  }

  const inputClass = "w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-zinc-900 bg-white"

  if (!open) {
    return (
      <div className="space-y-1">
        {hasData && (
          <div className="text-sm space-y-0.5" style={{ color: '#64748b' }}>
            {prospect.company && <p>{prospect.company}</p>}
            {prospect.email && <p>{prospect.email}</p>}
            {prospect.phone && <p>{prospect.phone}</p>}
            {prospect.siret && <p className="text-xs font-mono">SIRET {prospect.siret}</p>}
            {prospect.address && <p className="text-xs">{prospect.address}</p>}
          </div>
        )}
        <button onClick={() => setOpen(true)}
          className="text-xs transition-all"
          style={{ color: '#94a3b8' }}>
          {hasData ? 'Modifier les infos' : '+ Ajouter SIRET, tél, adresse…'}
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={save} className="space-y-3 bg-white border border-zinc-200 rounded-xl p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Infos client</p>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-zinc-400 mb-1 block">Société</label>
          <input value={fields.company ?? ''} onChange={e => setFields(f => ({ ...f, company: e.target.value }))}
            placeholder="ACME SAS" className={inputClass} />
        </div>
        <div>
          <label className="text-xs text-zinc-400 mb-1 block">Email</label>
          <input value={fields.email ?? ''} onChange={e => setFields(f => ({ ...f, email: e.target.value }))}
            placeholder="contact@acme.fr" type="email" className={inputClass} />
        </div>
        <div>
          <label className="text-xs text-zinc-400 mb-1 block">Téléphone</label>
          <input value={fields.phone ?? ''} onChange={e => setFields(f => ({ ...f, phone: e.target.value }))}
            placeholder="06 XX XX XX XX" className={inputClass} />
        </div>
        <div>
          <label className="text-xs text-zinc-400 mb-1 block">SIRET</label>
          <input value={fields.siret ?? ''} onChange={e => setFields(f => ({ ...f, siret: e.target.value }))}
            placeholder="XXX XXX XXX XXXXX" className={inputClass} />
        </div>
        <div className="col-span-2">
          <label className="text-xs text-zinc-400 mb-1 block">Adresse</label>
          <input value={fields.address ?? ''} onChange={e => setFields(f => ({ ...f, address: e.target.value }))}
            placeholder="12 rue de la Paix, 75001 Paris" className={inputClass} />
        </div>
      </div>
      <div className="flex gap-2">
        <button type="submit" disabled={saving}
          className="px-4 py-2 bg-zinc-900 text-white text-sm rounded-lg hover:bg-zinc-700 transition disabled:opacity-40">
          {saving ? 'Enregistrement…' : 'Enregistrer'}
        </button>
        <button type="button" onClick={() => setOpen(false)}
          className="px-4 py-2 text-zinc-500 text-sm hover:text-zinc-900 transition">
          Annuler
        </button>
      </div>
    </form>
  )
}
