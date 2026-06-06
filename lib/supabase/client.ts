// SECURITY: Row Level Security (RLS) must be enabled on all Supabase tables.
// This file connects with the ANON key — without RLS, any client can read/write everything.
// Run the SQL in database/rls-setup.sql and define policies per table before going to production.

import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
