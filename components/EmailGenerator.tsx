'use client'

import { useState } from 'react'
import type { EmailType } from '@/app/api/email/generate/route'

const EMAIL_TYPES: { value: EmailType; label: string; desc: string }[] = [
  { value: 'send_quote', label: 'Envoi de devis', desc: 'Accompagne l\'envoi du devis' },
  { value: 'followup', label: 'Relance', desc: 'Relance après devis sans réponse' },
  { value: 'thanks', label: 'Remerciement', desc: 'Après signature du contrat' },
  { value: 'proposal', label: 'Proposition', desc: 'Prise de contact proactive' },
  { value: 'decline', label: 'Refus poli', desc: 'Décline une demande' },
]

interface Props {
  prospectName: string
  company?: string | null
  quoteAmount?: number | null
  projectSummary?: string | null
}

export default function EmailGenerator({ prospectName, company, quoteAmount, projectSummary }: Props) {
  const [type, setType] = useState<EmailType>('send_quote')
  const [context, setContext] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ subject: string; body: string } | null>(null)
  const [copied, setCopied] = useState<'subject' | 'body' | 'all' | null>(null)

  async function generate() {
    setLoading(true)
    setResult(null)
    const res = await fetch('/api/email/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, prospectName, company, quoteAmount, projectSummary, context: context || undefined }),
    })
    const data = await res.json()
    setResult(data)
    setLoading(false)
  }

  async function copy(what: 'subject' | 'body' | 'all') {
    if (!result) return
    const text = what === 'all'
      ? `Objet : ${result.subject}\n\n${result.body}`
      : what === 'subject' ? result.subject : result.body
    await navigator.clipboard.writeText(text)
    setCopied(what)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div className="space-y-4">
      {/* Type selector */}
      <div className="flex flex-wrap gap-2">
        {EMAIL_TYPES.map((t) => (
          <button
            key={t.value}
            onClick={() => { setType(t.value); setResult(null) }}
            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={{
              background: type === t.value ? '#0f172a' : '#f1f5f9',
              color: type === t.value ? '#ffffff' : '#475569',
              border: `1px solid ${type === t.value ? '#0f172a' : '#e2e8f0'}`,
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Context input */}
      <textarea
        value={context}
        onChange={(e) => setContext(e.target.value)}
        placeholder={`Contexte additionnel (optionnel) — ex : "devis envoyé il y a 10 jours, client hésitant sur le budget"`}
        rows={2}
        className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-zinc-900 resize-none bg-white"
      />

      <button
        onClick={generate}
        disabled={loading}
        className="px-4 py-2 bg-zinc-900 text-white text-sm rounded-lg hover:bg-zinc-700 transition disabled:opacity-40">
        {loading ? 'Génération…' : 'Générer l\'email'}
      </button>

      {/* Result */}
      {result && (
        <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
          {/* Subject */}
          <div className="px-4 py-3 border-b border-zinc-100 flex items-center justify-between gap-3"
            style={{ background: '#f8fafc' }}>
            <div className="flex-1 min-w-0">
              <span className="text-xs text-zinc-400 uppercase tracking-wide mr-2">Objet</span>
              <span className="text-sm font-medium text-zinc-800">{result.subject}</span>
            </div>
            <button
              onClick={() => copy('subject')}
              className="text-xs px-2.5 py-1 rounded-lg shrink-0 transition-all"
              style={{ background: copied === 'subject' ? '#f0fdf4' : '#f1f5f9', color: copied === 'subject' ? '#15803d' : '#64748b' }}>
              {copied === 'subject' ? 'Copié ✓' : 'Copier'}
            </button>
          </div>

          {/* Body */}
          <div className="px-4 py-4">
            <p className="text-sm text-zinc-700 whitespace-pre-wrap leading-relaxed">{result.body}</p>
          </div>

          {/* Actions */}
          <div className="px-4 py-3 border-t border-zinc-100 flex gap-2">
            <button
              onClick={() => copy('all')}
              className="px-4 py-2 text-sm font-medium rounded-lg transition-all"
              style={{ background: copied === 'all' ? '#f0fdf4' : '#0f172a', color: copied === 'all' ? '#15803d' : '#ffffff' }}>
              {copied === 'all' ? 'Tout copié ✓' : 'Copier tout (objet + corps)'}
            </button>
            <button
              onClick={generate}
              className="px-4 py-2 text-sm rounded-lg transition-all"
              style={{ background: '#f1f5f9', color: '#475569' }}>
              Regénérer
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
