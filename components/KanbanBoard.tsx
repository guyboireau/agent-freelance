'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { createClient } from '@/lib/supabase/client'
import type { Prospect, ProspectStatus } from '@/lib/supabase/types'

const COLUMNS: { status: ProspectStatus; label: string; bg: string; color: string }[] = [
  { status: 'lead_identified', label: 'Lead identifié', bg: '#e2e8f0', color: '#475569' },
  { status: 'demo_generated', label: 'Site démo généré', bg: '#dbeafe', color: '#1d4ed8' },
  { status: 'r1_done', label: 'R1 effectué', bg: '#ede9fe', color: '#6d28d9' },
  { status: 'followup_r2', label: 'En relance R2', bg: '#fef3c7', color: '#d97706' },
  { status: 'won', label: 'Gagné', bg: '#d1fae5', color: '#059669' },
  { status: 'lost', label: 'Perdu', bg: '#fee2e2', color: '#dc2626' },
]

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return ''
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000)
  if (days === 0) return "aujourd'hui"
  if (days === 1) return 'il y a 1 jour'
  return `il y a ${days} jours`
}

function ProspectCard({ prospect }: { prospect: Prospect }) {
  const col = COLUMNS.find((c) => c.status === prospect.status)
  const ref = prospect.last_contact_at ?? prospect.updated_at

  return (
    <div
      className="rounded-xl p-4 mb-2 cursor-grab active:cursor-grabbing"
      style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      }}
    >
      <div className="flex items-start justify-between gap-2 mb-1">
        <p className="text-sm font-semibold leading-tight" style={{ color: '#0f172a' }}>{prospect.name}</p>
        {col && (
          <span
            className="text-xs px-2 py-0.5 rounded-full font-medium shrink-0"
            style={{ background: col.bg, color: col.color }}
          >
            {col.label}
          </span>
        )}
      </div>
      {prospect.company && (
        <p className="text-xs mb-1" style={{ color: '#64748b' }}>{prospect.company}</p>
      )}
      {prospect.phone && (
        <p className="text-xs font-mono" style={{ color: '#94a3b8' }}>{prospect.phone}</p>
      )}
      {prospect.vercel_demo_url && (
        <a
          href={prospect.vercel_demo_url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="text-xs underline block mt-1 truncate"
          style={{ color: '#6366f1' }}
        >
          Voir le site
        </a>
      )}
      {prospect.assigned_template && (
        <p className="text-xs mt-1" style={{ color: '#94a3b8' }}>
          Template : {prospect.assigned_template}
        </p>
      )}
      <p className="text-xs mt-2" style={{ color: '#cbd5e1' }}>{timeAgo(ref)}</p>
    </div>
  )
}

function SortableCard({ prospect }: { prospect: Prospect }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: prospect.id,
    data: { status: prospect.status },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <ProspectCard prospect={prospect} />
    </div>
  )
}

type NewProspectState = { name: string; company: string; phone: string }

export default function KanbanBoard({ initialProspects }: { initialProspects: Prospect[] }) {
  const [prospects, setProspects] = useState<Prospect[]>(initialProspects)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [newProspect, setNewProspect] = useState<NewProspectState>({ name: '', company: '', phone: '' })
  const [creating, setCreating] = useState(false)
  const router = useRouter()

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  const activeProspect = activeId ? prospects.find((p) => p.id === activeId) ?? null : null

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(String(event.active.id))
  }, [])

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    setActiveId(null)
    const { active, over } = event
    if (!over) return

    const draggedId = String(active.id)
    const overStatus = (over.data.current?.status ?? over.id) as ProspectStatus

    const dragged = prospects.find((p) => p.id === draggedId)
    if (!dragged || dragged.status === overStatus) return

    setProspects((prev) =>
      prev.map((p) => (p.id === draggedId ? { ...p, status: overStatus } : p))
    )

    const supabase = createClient()
    await supabase.from('prospects').update({ status: overStatus }).eq('id', draggedId)
    router.refresh()
  }, [prospects, router])

  async function createProspect(e: React.FormEvent) {
    e.preventDefault()
    if (!newProspect.name.trim()) return
    setCreating(true)
    const supabase = createClient()
    const { data } = await supabase.from('prospects').insert({
      name: newProspect.name.trim(),
      company: newProspect.company.trim() || null,
      phone: newProspect.phone.trim() || null,
      status: 'lead_identified' as ProspectStatus,
    }).select().single()
    setCreating(false)
    setShowModal(false)
    setNewProspect({ name: '', company: '', phone: '' })
    if (data) {
      setProspects((prev) => [data as Prospect, ...prev])
    }
    router.refresh()
  }

  const inputClass = "w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-zinc-900 bg-white"

  return (
    <>
      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="flex gap-4 pb-6" style={{ minWidth: 'max-content' }}>
          {COLUMNS.map((col) => {
            const colProspects = prospects.filter((p) => p.status === col.status)
            return (
              <div
                key={col.status}
                data-status={col.status}
                className="rounded-2xl flex flex-col"
                style={{ width: 260, background: '#f8fafc', border: '1px solid #e2e8f0' }}
              >
                {/* Column header */}
                <div
                  className="rounded-t-2xl px-4 py-3 flex items-center justify-between"
                  style={{ background: col.bg }}
                >
                  <span className="text-xs font-semibold" style={{ color: col.color }}>{col.label}</span>
                  <span
                    className="text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center"
                    style={{ background: col.color, color: '#fff' }}
                  >
                    {colProspects.length}
                  </span>
                </div>

                {/* Drop zone */}
                <SortableContext
                  items={colProspects.map((p) => p.id)}
                  strategy={verticalListSortingStrategy}
                  id={col.status}
                >
                  <div
                    className="flex-1 p-3 min-h-24"
                    data-droppable-status={col.status}
                  >
                    {colProspects.map((p) => (
                      <SortableCard key={p.id} prospect={p} />
                    ))}
                    {colProspects.length === 0 && (
                      <div
                        className="h-16 rounded-xl border-2 border-dashed flex items-center justify-center"
                        style={{ borderColor: '#e2e8f0' }}
                      >
                        <span className="text-xs" style={{ color: '#cbd5e1' }}>Glisser ici</span>
                      </div>
                    )}
                  </div>
                </SortableContext>

                {/* Add button on first column */}
                {col.status === 'lead_identified' && (
                  <div className="px-3 pb-3">
                    <button
                      onClick={() => setShowModal(true)}
                      className="w-full py-2 rounded-xl text-xs font-semibold transition-all"
                      style={{ background: '#e2e8f0', color: '#475569' }}
                    >
                      + Nouveau lead
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <DragOverlay>
          {activeProspect && <ProspectCard prospect={activeProspect} />}
        </DragOverlay>
      </DndContext>

      {/* Modal création */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.3)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false) }}
        >
          <div className="rounded-2xl p-6 w-full max-w-sm" style={{ background: '#fff', border: '1px solid #e2e8f0' }}>
            <h2 className="text-base font-bold mb-4" style={{ color: '#0f172a' }}>Nouveau lead</h2>
            <form onSubmit={createProspect} className="space-y-3">
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Nom *</label>
                <input
                  value={newProspect.name}
                  onChange={(e) => setNewProspect((p) => ({ ...p, name: e.target.value }))}
                  placeholder="Jean Dupont"
                  required
                  className={inputClass}
                />
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Société</label>
                <input
                  value={newProspect.company}
                  onChange={(e) => setNewProspect((p) => ({ ...p, company: e.target.value }))}
                  placeholder="Plomberie Dupont"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Téléphone</label>
                <input
                  value={newProspect.phone}
                  onChange={(e) => setNewProspect((p) => ({ ...p, phone: e.target.value }))}
                  placeholder="06 XX XX XX XX"
                  className={inputClass}
                />
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 py-2 bg-zinc-900 text-white text-sm rounded-lg hover:bg-zinc-700 transition disabled:opacity-40"
                >
                  {creating ? 'Création…' : 'Créer'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-zinc-500 text-sm hover:text-zinc-900 transition"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
