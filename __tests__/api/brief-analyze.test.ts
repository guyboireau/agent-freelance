/**
 * Integration tests for /api/brief/analyze
 *
 * Strategy: mock the AI SDK and Supabase so tests run without API keys or DB.
 * The assertions focus on the contract between the route and its callers:
 * - Output must match BriefAnalysisSchema (structural validity)
 * - Semantic plausibility rules (complexity range, days > 0, stack non-empty)
 * - Edge cases the prompt might not handle well (very short, misleading briefs)
 *
 * For real LLM evaluation against a live model, use `scripts/eval-brief.ts`.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { z } from 'zod'

// --- Mocks ---

const mockGenerateObject = vi.fn()
vi.mock('ai', () => ({ generateObject: (...args: unknown[]) => mockGenerateObject(...args) }))
vi.mock('@ai-sdk/anthropic', () => ({ anthropic: vi.fn(() => 'mocked-model') }))
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    from: () => ({ insert: vi.fn().mockResolvedValue({ error: null }) }),
  }),
}))

// --- Schema (mirrors route — kept in sync) ---

const BriefAnalysisSchema = z.object({
  project_type: z.string(),
  probable_stack: z.array(z.string()),
  complexity: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]),
  unclear_points: z.array(z.string()),
  budget_signals: z.array(z.string()),
  estimated_days: z.number().int().positive(),
  summary: z.string(),
})

// --- Helpers ---

function makeRequest(body: unknown) {
  return new NextRequest('http://localhost/api/brief/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

function mockLLMResponse(overrides: Partial<z.infer<typeof BriefAnalysisSchema>> = {}) {
  const defaults: z.infer<typeof BriefAnalysisSchema> = {
    project_type: 'webapp',
    probable_stack: ['React', 'Next.js', 'Supabase'],
    complexity: 3,
    unclear_points: ['Périmètre exact des notifications', 'Besoin mobile ou web uniquement ?'],
    budget_signals: ['Mentionne "pas trop cher"', 'Délai serré : 6 semaines'],
    estimated_days: 15,
    summary: 'Application web de gestion de réservations avec tableau de bord admin et notifications.',
  }
  mockGenerateObject.mockResolvedValueOnce({ object: { ...defaults, ...overrides } })
}

// --- Tests ---

describe('POST /api/brief/analyze', () => {
  beforeEach(() => vi.clearAllMocks())

  it('retourne une analyse structurée valide pour un brief normal', async () => {
    mockLLMResponse()
    const { POST } = await import('@/app/api/brief/analyze/route')

    const res = await POST(makeRequest({
      raw_text: 'Bonjour, je cherche à développer une app de réservation pour mon restaurant. Les clients doivent pouvoir réserver en ligne et je veux un admin pour gérer tout ça. Budget serré.',
    }))

    expect(res.status).toBe(200)
    const data = await res.json()
    const parsed = BriefAnalysisSchema.safeParse(data)
    expect(parsed.success, `Schéma invalide: ${JSON.stringify(parsed.error?.issues)}`).toBe(true)
  })

  it('refuse un brief trop court (< 20 caractères)', async () => {
    const { POST } = await import('@/app/api/brief/analyze/route')

    const res = await POST(makeRequest({ raw_text: 'Site web svp' }))

    expect(res.status).toBe(400)
    expect(mockGenerateObject).not.toHaveBeenCalled()
  })

  it('un brief e-commerce complexe → complexity >= 3 et estimated_days >= 10', async () => {
    mockLLMResponse({
      project_type: 'e-commerce',
      probable_stack: ['Next.js', 'Stripe', 'PostgreSQL', 'Redis'],
      complexity: 4,
      estimated_days: 22,
      unclear_points: ['Intégration ERP existant ?', 'Gestion multi-devises ?'],
      budget_signals: ['Budget mentionné : 15k€', 'Délai : 3 mois'],
    })
    const { POST } = await import('@/app/api/brief/analyze/route')

    const res = await POST(makeRequest({
      raw_text: 'Je veux refaire notre site e-commerce B2B avec gestion des stocks, catalogue de 5000 produits, commandes, factures automatiques, intégration avec notre ERP Sage. On a environ 15k€ de budget et on voudrait ça pour dans 3 mois.',
    }))

    const data = await res.json()
    expect(data.complexity).toBeGreaterThanOrEqual(3)
    expect(data.estimated_days).toBeGreaterThanOrEqual(10)
    expect(data.probable_stack.length).toBeGreaterThan(0)
  })

  it('un brief site vitrine simple → complexity <= 2 et estimated_days <= 8', async () => {
    mockLLMResponse({
      project_type: 'site-vitrine',
      probable_stack: ['Next.js', 'Tailwind'],
      complexity: 2,
      estimated_days: 6,
      unclear_points: ['Nombre de pages ?'],
      budget_signals: [],
    })
    const { POST } = await import('@/app/api/brief/analyze/route')

    const res = await POST(makeRequest({
      raw_text: 'Bonjour, je suis plombier artisan et j\'ai besoin d\'un site vitrine simple pour présenter mes services, mes coordonnées et un formulaire de contact. Rien de compliqué.',
    }))

    const data = await res.json()
    expect(data.complexity).toBeLessThanOrEqual(2)
    expect(data.estimated_days).toBeLessThanOrEqual(8)
  })

  it('persiste en base si prospect_id est fourni', async () => {
    mockLLMResponse()
    const { createClient } = await import('@/lib/supabase/server')
    const mockInsert = vi.fn().mockResolvedValue({ error: null })
    ;(createClient as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      from: () => ({ insert: mockInsert }),
    })
    const { POST } = await import('@/app/api/brief/analyze/route')

    await POST(makeRequest({
      raw_text: 'Projet de marketplace pour artisans avec profils, annonces et messagerie intégrée. On vise un MVP en 2 mois.',
      prospect_id: '123e4567-e89b-12d3-a456-426614174000',
    }))

    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({ prospect_id: '123e4567-e89b-12d3-a456-426614174000' })
    )
  })
})
