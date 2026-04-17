'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { BriefAnalysis, QuoteLine } from '@/lib/supabase/types'
import { downloadQuotePDF } from './QuotePDF'

interface QuoteState {
  lines: QuoteLine[]
  total_ht: number
  duration_days: number
  conditions: string
  notes: string
}

export default function QuoteGenerator({
  prospectId,
  briefId,
  briefAnalysis,
  rawBrief,
  existingQuote,
  prospectName,
  company,
  email,
  phone,
  siret,
  address,
}: {
  prospectId: string
  briefId: string
  briefAnalysis: BriefAnalysis
  rawBrief: string
  existingQuote: QuoteState | null
  prospectName: string
  company?: string | null
  email?: string | null
  phone?: string | null
  siret?: string | null
  address?: string | null
}) {
  const [quote, setQuote] = useState<QuoteState | null>(existingQuote)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  async function generate() {
    setLoading(true)
    setError('')
    const res = await fetch('/api/quotes/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        brief_analysis: briefAnalysis,
        raw_brief: rawBrief,
        prospect_id: prospectId,
        brief_id: briefId,
      }),
    })
    if (!res.ok) {
      setError('Erreur lors de la génération')
      setLoading(false)
      return
    }
    const data = await res.json()
    setQuote(data)
    setLoading(false)
    router.refresh()
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <button
          onClick={generate}
          disabled={loading}
          className="px-4 py-2 bg-zinc-900 text-white text-sm rounded-lg hover:bg-zinc-700 transition disabled:opacity-40"
        >
          {loading ? 'Génération…' : quote ? 'Regénérer' : 'Générer le devis'}
        </button>
        {quote && (
          <button
            onClick={() => downloadQuotePDF({
              prospectName,
              company,
              email,
              phone,
              siret,
              address,
              lines: quote.lines,
              total_ht: quote.total_ht,
              duration_days: quote.duration_days,
              conditions: quote.conditions,
              notes: quote.notes,
              date: new Date().toLocaleDateString('fr-FR'),
            })}
            className="px-4 py-2 border border-zinc-200 text-zinc-700 text-sm rounded-lg hover:bg-zinc-50 transition"
          >
            Exporter PDF
          </button>
        )}
      </div>
      {error && <p className="text-red-600 text-sm">{error}</p>}

      {quote && (
        <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 border-b border-zinc-200">
              <tr>
                <th className="text-left px-4 py-2 text-zinc-500 font-medium">Prestation</th>
                <th className="text-right px-4 py-2 text-zinc-500 font-medium">Jours</th>
                <th className="text-right px-4 py-2 text-zinc-500 font-medium">PU HT</th>
                <th className="text-right px-4 py-2 text-zinc-500 font-medium">Total HT</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {quote.lines.map((line, i) => (
                <tr key={i}>
                  <td className="px-4 py-2.5">{line.label}</td>
                  <td className="px-4 py-2.5 text-right">{line.days}j</td>
                  <td className="px-4 py-2.5 text-right">{line.unit_price}€</td>
                  <td className="px-4 py-2.5 text-right font-medium">{line.total}€</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t-2 border-zinc-200 bg-zinc-50">
              <tr>
                <td colSpan={3} className="px-4 py-3 font-semibold">Total HT</td>
                <td className="px-4 py-3 text-right font-bold text-lg">{quote.total_ht}€</td>
              </tr>
            </tfoot>
          </table>
          <div className="px-4 py-4 border-t border-zinc-100 space-y-2 text-sm text-zinc-600">
            <p><span className="font-medium">Durée estimée :</span> {quote.duration_days} jours</p>
            {quote.conditions && <p><span className="font-medium">Conditions :</span> {quote.conditions}</p>}
            {quote.notes && <p className="text-zinc-500 italic">{quote.notes}</p>}
          </div>
        </div>
      )}
    </div>
  )
}
