export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: { PostgrestVersion: '14.5' }
  public: {
    Tables: {
      briefs: {
        Row: { analysis: Json | null; created_at: string; id: string; prospect_id: string; raw_text: string }
        Insert: { analysis?: Json | null; created_at?: string; id?: string; prospect_id: string; raw_text: string }
        Update: { analysis?: Json | null; created_at?: string; id?: string; prospect_id?: string; raw_text?: string }
        Relationships: []
      }
      messages: {
        Row: { content: string; created_at: string; id: string; prospect_id: string | null; role: string; tool_calls: Json | null }
        Insert: { content: string; created_at?: string; id?: string; prospect_id?: string | null; role: string; tool_calls?: Json | null }
        Update: { content?: string; created_at?: string; id?: string; prospect_id?: string | null; role?: string; tool_calls?: Json | null }
        Relationships: []
      }
      past_projects: {
        Row: { client: string; created_at: string; daily_rate: number | null; delivered_at: string | null; description: string; duration_days: number | null; embedding: string | null; id: string; name: string; stack: string[]; total_ht: number | null; type: string }
        Insert: { client: string; created_at?: string; daily_rate?: number | null; delivered_at?: string | null; description: string; duration_days?: number | null; embedding?: string | null; id?: string; name: string; stack?: string[]; total_ht?: number | null; type: string }
        Update: { client?: string; created_at?: string; daily_rate?: number | null; delivered_at?: string | null; description?: string; duration_days?: number | null; embedding?: string | null; id?: string; name?: string; stack?: string[]; total_ht?: number | null; type?: string }
        Relationships: []
      }
      prospects: {
        Row: { company: string | null; created_at: string; email: string | null; id: string; name: string; source: string | null; status: string; updated_at: string }
        Insert: { company?: string | null; created_at?: string; email?: string | null; id?: string; name: string; source?: string | null; status?: string; updated_at?: string }
        Update: { company?: string | null; created_at?: string; email?: string | null; id?: string; name?: string; source?: string | null; status?: string; updated_at?: string }
        Relationships: []
      }
      quotes: {
        Row: { brief_id: string | null; conditions: string | null; created_at: string; duration_days: number | null; id: string; lines: Json; notes: string | null; prospect_id: string; status: string; total_ht: number | null }
        Insert: { brief_id?: string | null; conditions?: string | null; created_at?: string; duration_days?: number | null; id?: string; lines?: Json; notes?: string | null; prospect_id: string; status?: string; total_ht?: number | null }
        Update: { brief_id?: string | null; conditions?: string | null; created_at?: string; duration_days?: number | null; id?: string; lines?: Json; notes?: string | null; prospect_id?: string; status?: string; total_ht?: number | null }
        Relationships: []
      }
    }
    Views: { [_ in never]: never }
    Functions: {
      match_past_projects: {
        Args: { match_count?: number; query_embedding: string }
        Returns: { client: string; created_at: string; daily_rate: number; delivered_at: string; description: string; duration_days: number; id: string; name: string; similarity: number; stack: string[]; total_ht: number; type: string }[]
      }
    }
    Enums: { [_ in never]: never }
    CompositeTypes: { [_ in never]: never }
  }
}

// Domain types
export type ProspectStatus = 'brief_received' | 'quote_sent' | 'followup_1' | 'followup_2' | 'won' | 'lost' | 'archived'

export type Prospect = Database['public']['Tables']['prospects']['Row']
export type Brief = Database['public']['Tables']['briefs']['Row']
export type Quote = Database['public']['Tables']['quotes']['Row']
export type PastProject = Database['public']['Tables']['past_projects']['Row']

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
