'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Brief, BriefAnalysis } from '@/lib/supabase/types'

const COMPLEXITY_LABEL = ['', 'Très simple', 'Simple', 'Modéré', 'Complexe', 'Très complexe']

export default function BriefAnalyzer({
  prospectId,
  existingBrief,
}: {
  prospectId: string
  existingBrief: Brief | null
}) {
  const [text, setText] = useState(existingBrief?.raw_text ?? '')
  const [analysis, setAnalysis] = useState<BriefAnalysis | null>(
    (existingBrief?.analysis as unknown as BriefAnalysis) ?? null
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  async function analyze() {
    if (!text.trim()) return
    setLoading(true)
    setError('')
    const res = await fetch('/api/brief/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ raw_text: text, prospect_id: prospectId }),
    })
    if (!res.ok) {
      setError('Erreur lors de l\'analyse')
      setLoading(false)
      return
    }
    const data = await res.json()
    setAnalysis(data)
    setLoading(false)
    router.refresh()
  }

  return (
    <div className="space-y-4">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Colle le texte du brief ici (mail reçu, message LinkedIn, notes d'appel…)"
        rows={6}
        className="w-full px-4 py-3 border border-zinc-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-zinc-900 resize-none bg-white"
      />
      <button
        onClick={analyze}
        disabled={loading || !text.trim()}
        className="px-4 py-2 bg-zinc-900 text-white text-sm rounded-lg hover:bg-zinc-700 transition disabled:opacity-40"
      >
        {loading ? 'Analyse en cours…' : 'Analyser le brief'}
      </button>
      {error && <p className="text-red-600 text-sm">{error}</p>}

      {analysis && (
        <div className="bg-white border border-zinc-200 rounded-xl p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-zinc-400 text-xs uppercase tracking-wide">Type</span>
              <p className="font-medium mt-0.5">{analysis.project_type}</p>
            </div>
            <div>
              <span className="text-zinc-400 text-xs uppercase tracking-wide">Complexité</span>
              <p className="font-medium mt-0.5">
                {analysis.complexity}/5 — {COMPLEXITY_LABEL[analysis.complexity]}
              </p>
            </div>
            <div>
              <span className="text-zinc-400 text-xs uppercase tracking-wide">Estimation</span>
              <p className="font-medium mt-0.5">{analysis.estimated_days}j · {analysis.estimated_days * 350}€ HT</p>
            </div>
            <div>
              <span className="text-zinc-400 text-xs uppercase tracking-wide">Stack probable</span>
              <p className="font-medium mt-0.5">{analysis.probable_stack.join(', ')}</p>
            </div>
          </div>
          <div>
            <span className="text-zinc-400 text-xs uppercase tracking-wide">Résumé</span>
            <p className="text-sm mt-1">{analysis.summary}</p>
          </div>
          {analysis.unclear_points.length > 0 && (
            <div>
              <span className="text-zinc-400 text-xs uppercase tracking-wide">Points à clarifier</span>
              <ul className="mt-1 space-y-1">
                {analysis.unclear_points.map((p, i) => (
                  <li key={i} className="text-sm text-orange-700">· {p}</li>
                ))}
              </ul>
            </div>
          )}
          {analysis.budget_signals.length > 0 && (
            <div>
              <span className="text-zinc-400 text-xs uppercase tracking-wide">Signaux budget</span>
              <ul className="mt-1 space-y-1">
                {analysis.budget_signals.map((s, i) => (
                  <li key={i} className="text-sm text-zinc-600">· {s}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
