'use client'

import Link from 'next/link'
import type { ProspectStatus } from '@/lib/supabase/types'

const STATUS_LABELS: Record<ProspectStatus, string> = {
  brief_received: 'Brief reçu',
  quote_sent: 'Devis envoyé',
  followup_1: 'Relance 1',
  followup_2: 'Relance 2',
  won: 'Gagné',
  lost: 'Perdu',
  archived: 'Archivé',
}

const STATUS_STYLES: Record<ProspectStatus, { bg: string; color: string }> = {
  brief_received: { bg: '#eff6ff', color: '#1d4ed8' },
  quote_sent:     { bg: '#fefce8', color: '#a16207' },
  followup_1:     { bg: '#fff7ed', color: '#c2410c' },
  followup_2:     { bg: '#fef2f2', color: '#b91c1c' },
  won:            { bg: '#f0fdf4', color: '#15803d' },
  lost:           { bg: '#f8fafc', color: '#64748b' },
  archived:       { bg: '#f8fafc', color: '#94a3b8' },
}

type Prospect = {
  id: string
  name: string
  company: string | null
  status: string
  updated_at: string
}

export default function ProspectList({ prospects }: { prospects: Prospect[] }) {
  if (prospects.length === 0) {
    return (
      <div className="animate-fade-in rounded-2xl p-12 text-center"
        style={{ background: '#ffffff', border: '1px solid #e2e8f0' }}>
        <p className="text-sm" style={{ color: '#94a3b8' }}>Aucun prospect pour l&apos;instant</p>
        <p className="text-xs mt-1" style={{ color: '#cbd5e1' }}>Clique sur &quot;+ Nouveau prospect&quot; pour commencer</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {prospects.map((p, i) => {
        const s = STATUS_STYLES[p.status as ProspectStatus] ?? STATUS_STYLES.archived
        return (
          <Link
            key={p.id}
            href={`/prospects/${p.id}`}
            className={`animate-fade-in-up stagger-${Math.min(i + 1, 5)} flex items-center justify-between px-5 py-3.5 rounded-xl transition-all duration-150`}
            style={{ background: '#ffffff', border: '1px solid #e2e8f0' }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.borderColor = '#c7d2fe'
              ;(e.currentTarget as HTMLElement).style.boxShadow = '0 4px 12px rgba(99,102,241,.08)'
              ;(e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.borderColor = '#e2e8f0'
              ;(e.currentTarget as HTMLElement).style.boxShadow = ''
              ;(e.currentTarget as HTMLElement).style.transform = ''
            }}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold"
                style={{ background: '#f1f5f9', color: '#475569' }}>
                {p.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: '#0f172a' }}>{p.name}</p>
                {p.company && <p className="text-xs" style={{ color: '#94a3b8' }}>{p.company}</p>}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs" style={{ color: '#cbd5e1' }}>
                {new Date(p.updated_at).toLocaleDateString('fr-FR')}
              </span>
              <span className="text-xs px-2.5 py-1 rounded-full font-medium"
                style={{ background: s.bg, color: s.color }}>
                {STATUS_LABELS[p.status as ProspectStatus]}
              </span>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
