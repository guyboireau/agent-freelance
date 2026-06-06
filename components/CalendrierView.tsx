'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { Rdv, RdvType } from '@/lib/supabase/types'

type RdvWithProspect = Rdv & {
  prospects: { name: string; company: string | null; phone: string | null } | null
}

type ProspectOption = { id: string; name: string; company: string | null }

const RDV_COLORS: Record<RdvType, { bg: string; color: string }> = {
  R1: { bg: '#dbeafe', color: '#1d4ed8' },
  R2: { bg: '#fef3c7', color: '#d97706' },
  autre: { bg: '#e2e8f0', color: '#475569' },
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfWeek(year: number, month: number): number {
  // Monday = 0, Sunday = 6
  const d = new Date(year, month, 1).getDay()
  return (d + 6) % 7
}

const MONTH_NAMES = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
]
const DAY_NAMES = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

export default function CalendrierView({
  initialRdvs,
  prospects,
}: {
  initialRdvs: RdvWithProspect[]
  prospects: ProspectOption[]
}) {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [rdvs, setRdvs] = useState<RdvWithProspect[]>(initialRdvs)
  const [selectedRdv, setSelectedRdv] = useState<RdvWithProspect | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    prospect_id: '',
    type: 'R1' as RdvType,
    scheduled_at: '',
    notes: '',
  })
  const [saving, setSaving] = useState(false)
  const router = useRouter()

  const prevMonth = useCallback(() => {
    if (month === 0) { setYear((y) => y - 1); setMonth(11) }
    else setMonth((m) => m - 1)
  }, [month])

  const nextMonth = useCallback(() => {
    if (month === 11) { setYear((y) => y + 1); setMonth(0) }
    else setMonth((m) => m + 1)
  }, [month])

  const daysInMonth = getDaysInMonth(year, month)
  const firstDay = getFirstDayOfWeek(year, month)

  function rdvsForDay(day: number): RdvWithProspect[] {
    return rdvs.filter((r) => {
      const d = new Date(r.scheduled_at)
      return d.getFullYear() === year && d.getMonth() === month && d.getDate() === day
    })
  }

  const upcoming = rdvs
    .filter((r) => {
      const d = new Date(r.scheduled_at)
      return d >= now && d <= new Date(now.getTime() + 14 * 86400000)
    })
    .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())

  async function createRdv(e: React.FormEvent) {
    e.preventDefault()
    if (!form.prospect_id || !form.scheduled_at) return
    setSaving(true)
    const supabase = createClient()
    const { data } = await supabase.from('rdv').insert({
      prospect_id: form.prospect_id,
      type: form.type,
      scheduled_at: new Date(form.scheduled_at).toISOString(),
      notes: form.notes || null,
    }).select('*, prospects(name, company, phone)').single()
    setSaving(false)
    if (data) {
      setRdvs((prev) => [...prev, data as RdvWithProspect])
    }
    setShowForm(false)
    setForm({ prospect_id: '', type: 'R1', scheduled_at: '', notes: '' })
    router.refresh()
  }

  const inputClass = "w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-zinc-900 bg-white"

  return (
    <div className="p-6 flex gap-6">
      {/* Calendrier principal */}
      <div className="flex-1 min-w-0">
        {/* Navigation */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold" style={{ color: '#0f172a' }}>
            {MONTH_NAMES[month]} {year}
          </h2>
          <div className="flex gap-2">
            <button onClick={prevMonth}
              className="px-3 py-1.5 rounded-lg text-sm transition"
              style={{ background: '#f1f5f9', color: '#475569' }}>
              ←
            </button>
            <button onClick={nextMonth}
              className="px-3 py-1.5 rounded-lg text-sm transition"
              style={{ background: '#f1f5f9', color: '#475569' }}>
              →
            </button>
            <button
              onClick={() => setShowForm(true)}
              className="px-3 py-1.5 rounded-lg text-sm font-semibold transition"
              style={{ background: '#0f172a', color: '#fff' }}>
              + RDV
            </button>
          </div>
        </div>

        {/* Grille */}
        <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid #e2e8f0' }}>
          {/* Headers jours */}
          <div className="grid grid-cols-7" style={{ background: '#f8fafc' }}>
            {DAY_NAMES.map((d) => (
              <div key={d} className="py-2 text-center text-xs font-semibold" style={{ color: '#94a3b8' }}>{d}</div>
            ))}
          </div>

          {/* Jours */}
          <div className="grid grid-cols-7" style={{ background: '#ffffff' }}>
            {/* Jours vides avant le 1er */}
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} className="min-h-20 p-1" style={{ borderRight: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9' }} />
            ))}

            {/* Jours du mois */}
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
              const dayRdvs = rdvsForDay(day)
              const isToday = now.getFullYear() === year && now.getMonth() === month && now.getDate() === day
              return (
                <div
                  key={day}
                  className="min-h-20 p-1"
                  style={{ borderRight: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9' }}
                >
                  <span
                    className="text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full mb-1"
                    style={{
                      background: isToday ? '#0f172a' : 'transparent',
                      color: isToday ? '#fff' : '#475569',
                    }}
                  >
                    {day}
                  </span>
                  {dayRdvs.map((r) => {
                    const c = RDV_COLORS[r.type] ?? RDV_COLORS.autre
                    return (
                      <button
                        key={r.id}
                        onClick={() => setSelectedRdv(r)}
                        className="w-full text-left text-xs px-1.5 py-0.5 rounded mb-0.5 truncate font-medium"
                        style={{ background: c.bg, color: c.color }}
                      >
                        {r.type} · {r.prospects?.name ?? '—'}
                      </button>
                    )
                  })}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Panneau latéral */}
      <div className="w-64 shrink-0">
        <h3 className="text-sm font-bold mb-3" style={{ color: '#0f172a' }}>RDV à venir (14j)</h3>
        <div className="space-y-2">
          {upcoming.length === 0 && (
            <p className="text-xs" style={{ color: '#94a3b8' }}>Aucun RDV dans les 14 prochains jours</p>
          )}
          {upcoming.map((r) => {
            const c = RDV_COLORS[r.type] ?? RDV_COLORS.autre
            const d = new Date(r.scheduled_at)
            return (
              <button
                key={r.id}
                onClick={() => setSelectedRdv(r)}
                className="w-full text-left rounded-xl p-3"
                style={{ background: '#ffffff', border: '1px solid #e2e8f0' }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: c.bg, color: c.color }}>
                    {r.type}
                  </span>
                  <span className="text-xs" style={{ color: '#94a3b8' }}>
                    {d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} à {d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-xs font-medium" style={{ color: '#0f172a' }}>{r.prospects?.name ?? '—'}</p>
                {r.prospects?.company && (
                  <p className="text-xs" style={{ color: '#94a3b8' }}>{r.prospects.company}</p>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Modal détail RDV */}
      {selectedRdv && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.3)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setSelectedRdv(null) }}
        >
          <div className="rounded-2xl p-6 w-full max-w-sm" style={{ background: '#fff', border: '1px solid #e2e8f0' }}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <span
                  className="text-xs px-2 py-0.5 rounded-full font-semibold"
                  style={{ background: RDV_COLORS[selectedRdv.type].bg, color: RDV_COLORS[selectedRdv.type].color }}
                >
                  {selectedRdv.type}
                </span>
                <p className="text-base font-bold mt-1" style={{ color: '#0f172a' }}>{selectedRdv.prospects?.name ?? '—'}</p>
                {selectedRdv.prospects?.company && (
                  <p className="text-sm" style={{ color: '#64748b' }}>{selectedRdv.prospects.company}</p>
                )}
              </div>
              <button onClick={() => setSelectedRdv(null)} style={{ color: '#94a3b8' }}>✕</button>
            </div>
            <p className="text-sm mb-1" style={{ color: '#475569' }}>
              {new Date(selectedRdv.scheduled_at).toLocaleString('fr-FR', {
                weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
                hour: '2-digit', minute: '2-digit',
              })}
            </p>
            {selectedRdv.notes && (
              <p className="text-xs mt-2 p-3 rounded-lg" style={{ background: '#f8fafc', color: '#475569' }}>
                {selectedRdv.notes}
              </p>
            )}
            {selectedRdv.prospects?.phone && (
              <p className="text-xs mt-2 font-mono" style={{ color: '#94a3b8' }}>{selectedRdv.prospects.phone}</p>
            )}
            <Link
              href={`/prospects/${selectedRdv.prospect_id}`}
              className="mt-4 block text-center text-xs px-3 py-2 rounded-lg font-medium transition"
              style={{ background: '#f1f5f9', color: '#475569' }}
              onClick={() => setSelectedRdv(null)}
            >
              Voir la fiche prospect
            </Link>
          </div>
        </div>
      )}

      {/* Modal ajout RDV */}
      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.3)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowForm(false) }}
        >
          <div className="rounded-2xl p-6 w-full max-w-sm" style={{ background: '#fff', border: '1px solid #e2e8f0' }}>
            <h2 className="text-base font-bold mb-4" style={{ color: '#0f172a' }}>Nouveau RDV</h2>
            <form onSubmit={createRdv} className="space-y-3">
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Prospect *</label>
                <select
                  value={form.prospect_id}
                  onChange={(e) => setForm((f) => ({ ...f, prospect_id: e.target.value }))}
                  required
                  className={inputClass}
                >
                  <option value="">Sélectionner…</option>
                  {prospects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}{p.company ? ` — ${p.company}` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Type</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as RdvType }))}
                  className={inputClass}
                >
                  <option value="R1">R1</option>
                  <option value="R2">R2</option>
                  <option value="autre">Autre</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Date et heure *</label>
                <input
                  type="datetime-local"
                  value={form.scheduled_at}
                  onChange={(e) => setForm((f) => ({ ...f, scheduled_at: e.target.value }))}
                  required
                  className={inputClass}
                />
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Notes</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  rows={2}
                  className={inputClass + ' resize-none'}
                />
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2 bg-zinc-900 text-white text-sm rounded-lg hover:bg-zinc-700 transition disabled:opacity-40"
                >
                  {saving ? 'Enregistrement…' : 'Créer'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 text-zinc-500 text-sm hover:text-zinc-900 transition"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
