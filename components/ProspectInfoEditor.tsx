'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Prospect } from '@/lib/supabase/types'

type EditableFields = Pick<Prospect,
  | 'email'
  | 'phone'
  | 'siret'
  | 'address'
  | 'company'
  | 'vercel_demo_url'
  | 'assigned_template'
  | 'last_contact_at'
  | 'next_followup_at'
> & { requested_changes_text: string }

export default function ProspectInfoEditor({ prospect }: { prospect: Prospect }) {
  const [open, setOpen] = useState(false)
  const [fields, setFields] = useState<EditableFields>({
    email: prospect.email ?? '',
    phone: prospect.phone ?? '',
    siret: prospect.siret ?? '',
    address: prospect.address ?? '',
    company: prospect.company ?? '',
    vercel_demo_url: prospect.vercel_demo_url ?? '',
    assigned_template: prospect.assigned_template ?? '',
    requested_changes_text: (prospect.requested_changes?.items ?? []).join('\n'),
    last_contact_at: prospect.last_contact_at ? prospect.last_contact_at.slice(0, 10) : '',
    next_followup_at: prospect.next_followup_at ? prospect.next_followup_at.slice(0, 10) : '',
  })
  const [saving, setSaving] = useState(false)
  const router = useRouter()

  const hasData = Object.values({
    email: prospect.email,
    phone: prospect.phone,
    siret: prospect.siret,
    address: prospect.address,
    vercel_demo_url: prospect.vercel_demo_url,
  }).some(Boolean)

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const supabase = createClient()
    const items = fields.requested_changes_text
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean)
    await supabase.from('prospects').update({
      email: fields.email || null,
      phone: fields.phone || null,
      siret: fields.siret || null,
      address: fields.address || null,
      company: fields.company || null,
      vercel_demo_url: fields.vercel_demo_url || null,
      assigned_template: fields.assigned_template || null,
      requested_changes: items.length > 0 ? { items } : {},
      last_contact_at: fields.last_contact_at || null,
      next_followup_at: fields.next_followup_at || null,
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
            {prospect.vercel_demo_url && (
              <a
                href={prospect.vercel_demo_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs underline"
                style={{ color: '#6366f1' }}
              >
                Voir le site démo
              </a>
            )}
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
        <div className="col-span-2">
          <label className="text-xs text-zinc-400 mb-1 block">URL démo Vercel</label>
          <input value={fields.vercel_demo_url ?? ''} onChange={e => setFields(f => ({ ...f, vercel_demo_url: e.target.value }))}
            placeholder="https://mon-site.vercel.app" type="url" className={inputClass} />
        </div>
        <div className="col-span-2">
          <label className="text-xs text-zinc-400 mb-1 block">Template assigné</label>
          <input value={fields.assigned_template ?? ''} onChange={e => setFields(f => ({ ...f, assigned_template: e.target.value }))}
            placeholder="premium-multipage / site-vitrine-template" className={inputClass} />
        </div>
        <div className="col-span-2">
          <label className="text-xs text-zinc-400 mb-1 block">Modifications demandées (une par ligne)</label>
          <textarea
            value={fields.requested_changes_text}
            onChange={e => setFields(f => ({ ...f, requested_changes_text: e.target.value }))}
            placeholder="Changer la couleur du header&#10;Ajouter une galerie photo"
            rows={3}
            className={inputClass + ' resize-none'}
          />
        </div>
        <div>
          <label className="text-xs text-zinc-400 mb-1 block">Dernier contact</label>
          <input value={fields.last_contact_at ?? ''} onChange={e => setFields(f => ({ ...f, last_contact_at: e.target.value }))}
            type="date" className={inputClass} />
        </div>
        <div>
          <label className="text-xs text-zinc-400 mb-1 block">Prochaine relance</label>
          <input value={fields.next_followup_at ?? ''} onChange={e => setFields(f => ({ ...f, next_followup_at: e.target.value }))}
            type="date" className={inputClass} />
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
