'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function NewProspectForm() {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [company, setCompany] = useState('')
  const [email, setEmail] = useState('')
  const [source, setSource] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    const supabase = createClient()
    await supabase.from('prospects').insert({
      name: name.trim(),
      company: company.trim() || null,
      email: email.trim() || null,
      source: source.trim() || null,
      status: 'brief_received',
    })
    setOpen(false)
    setName(''); setCompany(''); setEmail(''); setSource('')
    setLoading(false)
    router.refresh()
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="px-4 py-2 bg-zinc-900 text-white text-sm rounded-lg hover:bg-zinc-700 transition"
      >
        + Nouveau prospect
      </button>
    )
  }

  return (
    <form onSubmit={submit} className="flex gap-2 items-end flex-wrap">
      <input value={name} onChange={e => setName(e.target.value)} placeholder="Nom *" required
        className="px-3 py-2 border border-zinc-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-zinc-900 w-36" />
      <input value={company} onChange={e => setCompany(e.target.value)} placeholder="Société"
        className="px-3 py-2 border border-zinc-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-zinc-900 w-32" />
      <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" type="email"
        className="px-3 py-2 border border-zinc-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-zinc-900 w-40" />
      <input value={source} onChange={e => setSource(e.target.value)} placeholder="Source"
        className="px-3 py-2 border border-zinc-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-zinc-900 w-28" />
      <button type="submit" disabled={loading}
        className="px-4 py-2 bg-zinc-900 text-white text-sm rounded-lg hover:bg-zinc-700 transition disabled:opacity-40">
        Créer
      </button>
      <button type="button" onClick={() => setOpen(false)}
        className="px-4 py-2 text-zinc-500 text-sm hover:text-zinc-900 transition">
        Annuler
      </button>
    </form>
  )
}
