// Polyfill Next.js server globals for route handler tests
import { vi } from 'vitest'

// Stub next/server cookies (used by Supabase SSR)
vi.mock('next/headers', () => ({
  cookies: () => ({ get: () => null, getAll: () => [], set: vi.fn(), delete: vi.fn() }),
}))
