/**
 * Tests pour lib/freelancer.ts
 * Le profil vient uniquement des variables d'environnement : sans elles, il ne
 * contient que des valeurs neutres (le dépôt est public).
 */

import { describe, it, expect, vi, afterEach } from 'vitest'
import { parseTjm } from '@/lib/freelancer'

const VARIABLES = [
  'NEXT_PUBLIC_FREELANCER_NAME',
  'NEXT_PUBLIC_FREELANCER_TITLE',
  'NEXT_PUBLIC_FREELANCER_EMAIL',
  'NEXT_PUBLIC_FREELANCER_WEBSITE',
  'NEXT_PUBLIC_FREELANCER_SIRET',
  'NEXT_PUBLIC_FREELANCER_PHONE',
  'NEXT_PUBLIC_FREELANCER_ADDRESS',
  'NEXT_PUBLIC_FREELANCER_TJM',
] as const

type Variable = (typeof VARIABLES)[number]

// Le module lit l'environnement à l'import : on le recharge après chaque stub.
async function chargerProfil(env: Partial<Record<Variable, string>> = {}) {
  for (const nom of VARIABLES) vi.stubEnv(nom, env[nom] ?? '')
  vi.resetModules()
  return import('@/lib/freelancer')
}

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('parseTjm', () => {
  it.each([
    ['500', 500],
    [' 450 ', 450],
    ['612.5', 612.5],
  ])('lit %j comme %d', (brut, attendu) => {
    expect(parseTjm(brut)).toBe(attendu)
  })

  it.each([undefined, '', '   ', '0', '-300', 'abc', 'Infinity'])('renvoie null pour %j', (brut) => {
    expect(parseTjm(brut)).toBeNull()
  })
})

describe('FREELANCER sans configuration', () => {
  it('ne contient que des valeurs neutres', async () => {
    const { FREELANCER, TJM_LABEL, estimateHt, formatEstimate } = await chargerProfil()

    expect(FREELANCER).toMatchObject({
      name: 'À configurer',
      title: 'Développeur freelance',
      email: 'À configurer',
      website: '',
      siret: '',
      phone: '',
      address: '',
      tjm: null,
    })
    expect(TJM_LABEL).toBe('non configuré')
    expect(estimateHt(12)).toBeNull()
    expect(formatEstimate(12)).toBe('12j')
  })
})

describe('FREELANCER configuré', () => {
  it('lit chaque champ dans sa variable', async () => {
    const { FREELANCER } = await chargerProfil({
      NEXT_PUBLIC_FREELANCER_NAME: 'Camille Exemple',
      NEXT_PUBLIC_FREELANCER_TITLE: 'Développeuse mobile',
      NEXT_PUBLIC_FREELANCER_EMAIL: 'camille@example.com',
      NEXT_PUBLIC_FREELANCER_WEBSITE: 'example.com',
      NEXT_PUBLIC_FREELANCER_SIRET: '000 000 000 00000',
      NEXT_PUBLIC_FREELANCER_PHONE: '+33 6 00 00 00 00',
      NEXT_PUBLIC_FREELANCER_ADDRESS: '1 rue de l’Exemple, 75000 Paris',
      NEXT_PUBLIC_FREELANCER_TJM: '500',
    })

    expect(FREELANCER).toMatchObject({
      name: 'Camille Exemple',
      title: 'Développeuse mobile',
      email: 'camille@example.com',
      website: 'example.com',
      siret: '000 000 000 00000',
      phone: '+33 6 00 00 00 00',
      address: '1 rue de l’Exemple, 75000 Paris',
      tjm: 500,
    })
  })

  it('calcule les montants à partir du TJM', async () => {
    const { TJM_LABEL, estimateHt, formatEstimate } = await chargerProfil({ NEXT_PUBLIC_FREELANCER_TJM: '500' })

    expect(TJM_LABEL).toBe('500€/jour')
    expect(estimateHt(12)).toBe(6000)
    expect(formatEstimate(12)).toBe('12j · 6000€ HT')
  })
})
