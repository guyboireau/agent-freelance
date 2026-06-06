// SECURITY: Row Level Security (RLS) must be enabled on all Supabase tables.
// This file connects with the ANON key — without RLS, any client can read/write everything.
// Run the SQL in database/rls-setup.sql and define policies per table before going to production.

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch (e) {
            console.error('Cookie set error:', e)
          }
        },
      },
    }
  )
}
