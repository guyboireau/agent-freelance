'use client'
import { useState, useEffect } from 'react'

export default function LeadOmeter() {
  const GOAL = 400
  const [calls, setCalls] = useState(0)

  useEffect(() => {
    const stored = localStorage.getItem('lead_calls_' + new Date().toISOString().slice(0, 7))
    if (stored) setCalls(Number(stored))
  }, [])

  function update(val: number) {
    setCalls(val)
    localStorage.setItem('lead_calls_' + new Date().toISOString().slice(0, 7), String(val))
  }

  const pct = Math.min(Math.round((calls / GOAL) * 100), 100)

  return (
    <div className="rounded-2xl p-5" style={{ background: '#ffffff', border: '1px solid #e2e8f0' }}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#94a3b8' }}>Lead-O-Meter</p>
        <input type="number" value={calls} min={0} max={9999}
          onChange={e => update(Number(e.target.value))}
          className="w-20 text-right text-sm font-bold border-0 outline-none"
          style={{ color: '#0f172a' }} />
      </div>
      <div className="h-2 rounded-full mb-2" style={{ background: '#f1f5f9' }}>
        <div className="h-2 rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: pct >= 100 ? '#10b981' : '#6366f1' }} />
      </div>
      <p className="text-xs" style={{ color: '#94a3b8' }}>{calls} / {GOAL} appels ce mois · {pct}%</p>
    </div>
  )
}
