/**
 * Tests pour lib/safe-redirect.ts
 * Le paramètre `next` du login ne doit jamais mener hors de l'application.
 */

import { describe, it, expect } from 'vitest'
import { DEFAULT_LOGIN_REDIRECT, safeRedirectPath } from '@/lib/safe-redirect'

describe('safeRedirectPath', () => {
  it.each([
    '/dashboard',
    '/prospects/42',
    '/pipeline?vue=kanban',
    '/prospects/42#devis',
    // « :// » au milieu d'un chemin reste un chemin interne
    '/http://evil.example',
  ])('accepte le chemin interne %j', (chemin) => {
    expect(safeRedirectPath(chemin)).toBe(chemin)
  })

  it('renvoie la forme normalisée du chemin', () => {
    expect(safeRedirectPath('/pipeline/../dashboard')).toBe('/dashboard')
  })

  it.each([
    ['absent', undefined],
    ['null', null],
    ['vide', ''],
    ['un tableau (paramètre répété)', ['/dashboard', '/pipeline']],
    ['un nombre', 42],
  ])('retombe sur la page par défaut quand la valeur est %s', (_cas, valeur) => {
    expect(safeRedirectPath(valeur)).toBe(DEFAULT_LOGIN_REDIRECT)
  })

  it.each([
    // URL absolues et schémas
    'https://evil.example',
    'http://evil.example/dashboard',
    'javascript:alert(1)',
    'JaVaScRiPt:alert(1)',
    'data:text/html,<script>alert(1)</script>',
    // URL relatives au protocole
    '//evil.example',
    '///evil.example',
    '/\\evil.example',
    '\\\\evil.example',
    '\\/evil.example',
    // Chemins relatifs, ou précédés d'une espace
    'evil.example',
    'dashboard',
    ' /dashboard',
    // Caractères de contrôle supprimés par le parseur d'URL
    '/\t/evil.example',
    '/\n/evil.example',
    '/\r/evil.example',
    '/dash\u0000board',
    // Segments « . » et « .. » qui se normalisent en « //evil.example »
    '/.//evil.example',
    '/%2e//evil.example',
    '/..//evil.example',
  ])('refuse %j', (valeur) => {
    expect(safeRedirectPath(valeur)).toBe(DEFAULT_LOGIN_REDIRECT)
  })

  it('utilise le repli fourni', () => {
    expect(safeRedirectPath('https://evil.example', '/pipeline')).toBe('/pipeline')
  })
})
