export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type ProspectStatus =
  | 'lead_identified'
  | 'demo_generated'
  | 'r1_done'
  | 'followup_r2'
  | 'won'
  | 'lost'
  | 'postponed'

export type RdvType = 'R1' | 'R2' | 'autre'
export type DocumentType = 'brief' | 'quote' | 'contract' | 'other'

export interface Prospect {
  id: string
  name: string
  company: string | null
  email: string | null
  phone: string | null
  address: string | null
  siret: string | null
  source: string | null
  status: ProspectStatus
  vercel_demo_url: string | null
  requested_changes: { items?: string[] } | null
  assigned_template: string | null
  last_contact_at: string | null
  next_followup_at: string | null
  created_at: string
  updated_at: string
}

export interface Rdv {
  id: string
  prospect_id: string
  type: RdvType
  scheduled_at: string
  notes: string | null
  completed: boolean
  created_at: string
  updated_at: string
}

export interface Brief {
  id: string
  prospect_id: string
  raw_text: string
  analysis: Json | null
  created_at: string
}

export interface Quote {
  id: string
  prospect_id: string
  brief_id: string | null
  lines: Json
  total_ht: number | null
  duration_days: number | null
  conditions: string | null
  notes: string | null
  status: 'draft' | 'sent' | 'accepted' | 'refused'
  created_at: string
}

export interface PastProject {
  id: string
  name: string
  client: string
  type: string
  description: string
  stack: string[]
  duration_days: number | null
  daily_rate: number | null
  total_ht: number | null
  delivered_at: string | null
  embedding: string | null
  created_at: string
}

export interface Document {
  id: string
  prospect_id: string
  name: string
  url: string
  storage_path: string
  type: string
  size_bytes: number | null
  created_at: string | null
}

export interface BriefAnalysis {
  project_type: string
  probable_stack: string[]
  complexity: 1 | 2 | 3 | 4 | 5
  unclear_points: string[]
  budget_signals: string[]
  estimated_days: number
  summary: string
}

export interface QuoteLine {
  label: string
  days: number
  unit_price: number
  total: number
}
