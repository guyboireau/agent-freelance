'use client'

import { useState } from 'react'
import type { BriefAnalysis } from '@/lib/supabase/types'

type ModelResult =
  | { success: true; analysis: BriefAnalysis; usage: { promptTokens: number; completionTokens: number } }
  | { success: false; error: string }

type CompareResult = {
  claude: ModelResult
  gpt4o: ModelResult
  elapsed_ms: number
}

type Rating = Record<string, 1 | 2 | 3 | 4 | 5>

const COMPLEXITY_LABEL = ['', 'Très simple', 'Simple', 'Modéré', 'Complexe', 'Très complexe']

const CRITERIA = [
  { key: 'precision', label: 'Précision de l\'estimation' },
  { key: 'stack', label: 'Pertinence de la stack' },
  { key: 'unclear', label: 'Qualité des points flous' },
  { key: 'summary', label: 'Clarté du résumé' },
]

export default function ComparePage() {
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<CompareResult | null>(null)
  const [error, setError] = useState('')
  const [ratings, setRatings] = useState<{ claude: Rating; gpt4o: Rating }>({ claude: {}, gpt4o: {} })

  async function compare() {
    if (!text.trim()) return
    setLoading(true)
    setError('')
    setResult(null)
    setRatings({ claude: {}, gpt4o: {} })

    const res = await fetch('/api/brief/compare', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ raw_text: text }),
    })

    if (!res.ok) {
      setError('Erreur lors de la comparaison')
      setLoading(false)
      return
    }

    setResult(await res.json())
    setLoading(false)
  }

  function rate(model: 'claude' | 'gpt4o', criterion: string, value: 1 | 2 | 3 | 4 | 5) {
    setRatings((prev) => ({
      ...prev,
      [model]: { ...prev[model], [criterion]: value },
    }))
  }

  function score(model: 'claude' | 'gpt4o') {
    const r = ratings[model]
    const vals = Object.values(r)
    if (!vals.length) return null
    return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10
  }

  return (
    <div className="p-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1">Comparaison de modèles</h1>
        <p className="text-zinc-500 text-sm">Claude Sonnet vs GPT-4o — même brief, même prompt, résultats côte à côte</p>
      </div>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Colle un brief client ici…"
        rows={5}
        className="w-full px-4 py-3 border border-zinc-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-zinc-900 resize-none bg-white mb-4"
      />
      <button
        onClick={compare}
        disabled={loading || !text.trim()}
        className="px-5 py-2.5 bg-zinc-900 text-white text-sm rounded-lg hover:bg-zinc-700 transition disabled:opacity-40 mb-8"
      >
        {loading ? 'Comparaison en cours…' : 'Comparer'}
      </button>

      {error && <p className="text-red-600 text-sm mb-6">{error}</p>}

      {result && (
        <div className="space-y-6">
          <p className="text-xs text-zinc-400">
            Temps total : {result.elapsed_ms}ms (les deux modèles tournent en parallèle)
          </p>

          <div className="grid grid-cols-2 gap-6">
            {(['claude', 'gpt4o'] as const).map((model) => {
              const r = result[model]
              const modelScore = score(model)
              return (
                <div key={model} className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
                  <div className="px-5 py-3 border-b border-zinc-100 flex items-center justify-between bg-zinc-50">
                    <span className="font-semibold text-sm">
                      {model === 'claude' ? 'Claude Sonnet 4.5' : 'GPT-4o'}
                    </span>
                    {modelScore && (
                      <span className="text-xs bg-zinc-900 text-white px-2 py-0.5 rounded-full">
                        {modelScore}/5
                      </span>
                    )}
                  </div>

                  {r.success ? (
                    <div className="p-5 space-y-4">
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-zinc-400 text-xs uppercase tracking-wide">Type</p>
                          <p className="font-medium mt-0.5">{r.analysis.project_type}</p>
                        </div>
                        <div>
                          <p className="text-zinc-400 text-xs uppercase tracking-wide">Complexité</p>
                          <p className="font-medium mt-0.5">{r.analysis.complexity}/5 — {COMPLEXITY_LABEL[r.analysis.complexity]}</p>
                        </div>
                        <div>
                          <p className="text-zinc-400 text-xs uppercase tracking-wide">Estimation</p>
                          <p className="font-medium mt-0.5">{r.analysis.estimated_days}j · {r.analysis.estimated_days * 350}€ HT</p>
                        </div>
                        <div>
                          <p className="text-zinc-400 text-xs uppercase tracking-wide">Tokens</p>
                          <p className="font-medium mt-0.5">{(r.usage.promptTokens + r.usage.completionTokens).toLocaleString()}</p>
                        </div>
                      </div>

                      <div>
                        <p className="text-zinc-400 text-xs uppercase tracking-wide mb-1">Stack</p>
                        <p className="text-sm">{r.analysis.probable_stack.join(', ')}</p>
                      </div>

                      <div>
                        <p className="text-zinc-400 text-xs uppercase tracking-wide mb-1">Résumé</p>
                        <p className="text-sm">{r.analysis.summary}</p>
                      </div>

                      {r.analysis.unclear_points.length > 0 && (
                        <div>
                          <p className="text-zinc-400 text-xs uppercase tracking-wide mb-1">Points flous</p>
                          <ul className="space-y-0.5">
                            {r.analysis.unclear_points.map((p, i) => (
                              <li key={i} className="text-sm text-orange-700">· {p}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Rating */}
                      <div className="border-t border-zinc-100 pt-4 space-y-2">
                        <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Ta note</p>
                        {CRITERIA.map(({ key, label }) => (
                          <div key={key} className="flex items-center justify-between">
                            <span className="text-xs text-zinc-500">{label}</span>
                            <div className="flex gap-1">
                              {([1, 2, 3, 4, 5] as const).map((n) => (
                                <button
                                  key={n}
                                  onClick={() => rate(model, key, n)}
                                  className={`w-6 h-6 rounded text-xs font-medium transition ${
                                    ratings[model][key] === n
                                      ? 'bg-zinc-900 text-white'
                                      : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200'
                                  }`}
                                >
                                  {n}
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="p-5 text-sm text-red-600">{r.error}</div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Verdict */}
          {score('claude') && score('gpt4o') && (
            <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-5 text-sm">
              <p className="font-medium mb-1">Verdict</p>
              {score('claude')! > score('gpt4o')! && <p className="text-zinc-600">Claude remporte ce brief ({score('claude')}/5 vs {score('gpt4o')}/5).</p>}
              {score('gpt4o')! > score('claude')! && <p className="text-zinc-600">GPT-4o remporte ce brief ({score('gpt4o')}/5 vs {score('claude')}/5).</p>}
              {score('claude') === score('gpt4o') && <p className="text-zinc-600">Égalité ({score('claude')}/5).</p>}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
