/**
 * Tests pour lib/active-projects.ts
 * La liste vient d'une variable serveur au format JSON : une valeur absente ou
 * invalide donne une liste vide, sans jamais journaliser son contenu.
 */

import { describe, it, expect, vi, afterEach } from 'vitest'
import { parseActiveProjects } from '@/lib/active-projects'

const PROJET = { name: 'Projet marqueur', client: 'Client marqueur', stack: 'Next.js · Supabase', type: 'SaaS' }

afterEach(() => {
  vi.restoreAllMocks()
})

describe('parseActiveProjects', () => {
  it('lit un tableau JSON valide', () => {
    expect(parseActiveProjects(JSON.stringify([PROJET, { ...PROJET, name: 'Autre projet' }]))).toEqual([
      PROJET,
      { ...PROJET, name: 'Autre projet' },
    ])
  })

  it.each([undefined, '', '   '])('renvoie une liste vide, sans avertir, pour %j', (brut) => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    expect(parseActiveProjects(brut)).toEqual([])
    expect(warn).not.toHaveBeenCalled()
  })

  it.each([
    ['du JSON invalide', '[{"name": "Projet marqueur"'],
    ['un objet au lieu d’un tableau', JSON.stringify(PROJET)],
    ['un champ manquant', JSON.stringify([{ ...PROJET, client: undefined }])],
    ['un champ vide', JSON.stringify([{ ...PROJET, name: '' }])],
  ])('ignore %s et avertit sans recopier la valeur', (_cas, brut) => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    expect(parseActiveProjects(brut)).toEqual([])
    expect(warn).toHaveBeenCalledOnce()
    expect(warn.mock.calls.flat().join(' ')).not.toContain('marqueur')
  })
})
