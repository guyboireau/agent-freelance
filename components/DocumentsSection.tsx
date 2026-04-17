'use client'

import { useState } from 'react'
import DocumentUpload from './DocumentUpload'
import type { Document } from '@/lib/supabase/types'

export default function DocumentsSection({ prospectId, initialDocuments }: { prospectId: string; initialDocuments: Document[] }) {
  const [documents, setDocuments] = useState<Document[]>(initialDocuments)

  return (
    <DocumentUpload
      prospectId={prospectId}
      documents={documents}
      onUpload={(doc) => setDocuments((prev) => [doc, ...prev])}
      onDelete={(id) => setDocuments((prev) => prev.filter((d) => d.id !== id))}
    />
  )
}
