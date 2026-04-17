'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Document, DocumentType } from '@/lib/supabase/types'

const DOC_TYPES: { value: DocumentType; label: string }[] = [
  { value: 'brief', label: 'Brief' },
  { value: 'quote', label: 'Devis' },
  { value: 'contract', label: 'Contrat' },
  { value: 'other', label: 'Autre' },
]

const TYPE_COLORS: Record<DocumentType, { bg: string; color: string }> = {
  brief:    { bg: '#eff6ff', color: '#1d4ed8' },
  quote:    { bg: '#f0fdf4', color: '#15803d' },
  contract: { bg: '#fff7ed', color: '#c2410c' },
  other:    { bg: '#f8fafc', color: '#475569' },
}

const ACCEPT = '.pdf,.doc,.docx,.png,.jpg,.jpeg,.xlsx,.xls'
const BUCKET = 'prospect-docs'
const MAX_MB = 10

interface Props {
  prospectId: string
  documents: Document[]
  onUpload: (doc: Document) => void
  onDelete: (docId: string) => void
}

function formatBytes(bytes: number | null): string {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} o`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function DocumentUpload({ prospectId, documents, onUpload, onDelete }: Props) {
  const [uploading, setUploading] = useState(false)
  const [docType, setDocType] = useState<DocumentType>('other')
  const [error, setError] = useState('')
  const [deleting, setDeleting] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleFile(file: File) {
    if (file.size > MAX_MB * 1024 * 1024) {
      setError(`Fichier trop lourd (max ${MAX_MB} Mo)`)
      return
    }
    setUploading(true)
    setError('')

    const supabase = createClient()
    const ext = file.name.split('.').pop()
    const path = `${prospectId}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`

    const { error: uploadErr } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: false })
    if (uploadErr) {
      setError(`Upload échoué : ${uploadErr.message}`)
      setUploading(false)
      return
    }

    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path)

    const { data: doc, error: dbErr } = await supabase
      .from('documents')
      .insert({
        prospect_id: prospectId,
        name: file.name,
        url: urlData.publicUrl,
        storage_path: path,
        type: docType,
        size_bytes: file.size,
      })
      .select()
      .single()

    if (dbErr) {
      setError(`Erreur base de données : ${dbErr.message}`)
    } else if (doc) {
      onUpload(doc as Document)
    }
    setUploading(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  async function handleDelete(doc: Document) {
    setDeleting(doc.id)
    const supabase = createClient()
    await supabase.storage.from(BUCKET).remove([doc.storage_path])
    await supabase.from('documents').delete().eq('id', doc.id)
    onDelete(doc.id)
    setDeleting(null)
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const grouped = DOC_TYPES.map((t) => ({
    ...t,
    docs: documents.filter((d) => d.type === t.value),
  })).filter((g) => g.docs.length > 0)

  return (
    <div className="space-y-4">
      {/* Type + Upload */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1.5">
          {DOC_TYPES.map((t) => (
            <button key={t.value}
              onClick={() => setDocType(t.value)}
              className="px-2.5 py-1 rounded-lg text-xs font-medium transition-all"
              style={{
                background: docType === t.value ? '#0f172a' : '#f1f5f9',
                color: docType === t.value ? '#ffffff' : '#64748b',
              }}>
              {t.label}
            </button>
          ))}
        </div>

        <label
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm cursor-pointer transition-all"
          style={{ background: uploading ? '#f1f5f9' : '#0f172a', color: uploading ? '#94a3b8' : '#ffffff' }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={onDrop}>
          {uploading ? 'Upload…' : '+ Ajouter un fichier'}
          <input ref={fileRef} type="file" accept={ACCEPT} className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
            disabled={uploading} />
        </label>
      </div>

      {/* Drop hint */}
      <div
        className="border-2 border-dashed rounded-xl px-4 py-5 text-center text-sm transition-all"
        style={{ borderColor: '#e2e8f0', color: '#94a3b8' }}
        onDragOver={(e) => { e.preventDefault(); (e.currentTarget as HTMLDivElement).style.borderColor = '#6366f1' }}
        onDragLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = '#e2e8f0' }}
        onDrop={(e) => {
          (e.currentTarget as HTMLDivElement).style.borderColor = '#e2e8f0'
          onDrop(e)
        }}>
        Glisse un fichier ici (PDF, Word, image — max {MAX_MB} Mo)
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      {/* Documents groupés */}
      {grouped.length > 0 && (
        <div className="space-y-4">
          {grouped.map((group) => {
            const c = TYPE_COLORS[group.value as DocumentType]
            return (
              <div key={group.value}>
                <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: '#94a3b8' }}>
                  {group.label}
                </p>
                <div className="space-y-1.5">
                  {group.docs.map((doc) => (
                    <div key={doc.id}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
                      style={{ background: '#ffffff', border: '1px solid #e2e8f0' }}>
                      <span className="text-xs font-medium px-2 py-0.5 rounded-md shrink-0"
                        style={{ background: c.bg, color: c.color }}>
                        {group.label}
                      </span>
                      <a href={doc.url} target="_blank" rel="noreferrer"
                        className="flex-1 text-sm truncate hover:underline" style={{ color: '#0f172a' }}>
                        {doc.name}
                      </a>
                      <span className="text-xs shrink-0" style={{ color: '#cbd5e1' }}>
                        {formatBytes(doc.size_bytes)} · {formatDate(doc.created_at)}
                      </span>
                      <button
                        onClick={() => handleDelete(doc)}
                        disabled={deleting === doc.id}
                        className="text-xs px-2 py-1 rounded-lg transition-all shrink-0"
                        style={{ color: '#ef4444', background: 'transparent' }}
                        title="Supprimer">
                        {deleting === doc.id ? '…' : '×'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {documents.length === 0 && (
        <p className="text-sm text-center py-4" style={{ color: '#cbd5e1' }}>
          Aucun document pour ce prospect
        </p>
      )}
    </div>
  )
}
