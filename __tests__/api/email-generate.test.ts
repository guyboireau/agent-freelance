/**
 * Tests pour /api/email/generate
 * Vérifie que chaque type d'email produit un objet { subject, body } non vide,
 * et que le sujet est bien extrait de la première ligne.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const mockGenerateText = vi.fn()
vi.mock('ai', () => ({ generateText: (...args: unknown[]) => mockGenerateText(...args) }))
vi.mock('@ai-sdk/anthropic', () => ({ anthropic: vi.fn(() => 'mocked-model') }))

function makeRequest(body: unknown) {
  return new NextRequest('http://localhost/api/email/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/email/generate', () => {
  beforeEach(() => vi.clearAllMocks())

  it('extrait correctement le sujet de la première ligne', async () => {
    mockGenerateText.mockResolvedValueOnce({
      text: `Objet : Votre devis pour la refonte e-commerce — 7 500€ HT

Bonjour Marie,

Suite à notre échange de la semaine dernière, veuillez trouver ci-joint le devis détaillé pour la refonte de votre site e-commerce.

Le projet couvre les développements front-end, l'intégration de Stripe et la migration des données existantes.

N'hésitez pas à me contacter si vous avez des questions.

Cordialement,
Guy Boireau`,
    })

    const { POST } = await import('@/app/api/email/generate/route')
    const res = await POST(makeRequest({
      type: 'send_quote',
      prospectName: 'Marie Dupont',
      company: 'Boutique Lumière',
      quoteAmount: 7500,
    }))

    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.subject).toBe('Votre devis pour la refonte e-commerce — 7 500€ HT')
    expect(data.body).not.toContain('Objet :')
    expect(data.body.length).toBeGreaterThan(50)
  })

  it('retourne 400 si le type est absent', async () => {
    const { POST } = await import('@/app/api/email/generate/route')
    const res = await POST(makeRequest({ prospectName: 'Test' }))
    expect(res.status).toBe(400)
    expect(mockGenerateText).not.toHaveBeenCalled()
  })

  it('retourne 400 si prospectName est absent', async () => {
    const { POST } = await import('@/app/api/email/generate/route')
    const res = await POST(makeRequest({ type: 'followup' }))
    expect(res.status).toBe(400)
  })

  it.each(['send_quote', 'followup', 'thanks', 'decline', 'proposal'] as const)(
    'accepte le type "%s" et appelle le LLM',
    async (type) => {
      mockGenerateText.mockResolvedValueOnce({
        text: `Objet : Test email ${type}\n\nCorps du mail de test.`,
      })
      const { POST } = await import('@/app/api/email/generate/route')
      const res = await POST(makeRequest({ type, prospectName: 'Jean Test' }))
      expect(res.status).toBe(200)
      expect(mockGenerateText).toHaveBeenCalledOnce()
    }
  )
})
