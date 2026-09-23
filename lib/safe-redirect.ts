/**
 * Cible de redirection après connexion (paramètre `next` du login).
 *
 * Seul un chemin interne est accepté ; tout le reste retombe sur `fallback` :
 * - URL absolue ou schéma (`https://…`, `javascript:…`) : ne commence pas par « / » ;
 * - URL relative au protocole (`//evil.com`, `/\evil.com`) : le navigateur la
 *   résout vers un autre domaine ;
 * - caractère de contrôle : le parseur d'URL supprime tabulations et sauts de
 *   ligne, si bien que « /<TAB>/evil.com » deviendrait « //evil.com ».
 *
 * Le chemin est ensuite résolu par le parseur WHATWG, celui du navigateur, et
 * c'est la forme normalisée qui est renvoyée, après un second contrôle :
 * « /.//evil.com » se normalise en « //evil.com ».
 */

export const DEFAULT_LOGIN_REDIRECT = '/dashboard'

// Origine fictive, jamais contactée : elle ne sert que de base de résolution.
const BASE = 'http://origine.invalid'

function isProtocolRelative(path: string): boolean {
  return path.startsWith('//') || path.startsWith('/\\')
}

function hasControlChar(value: string): boolean {
  for (let i = 0; i < value.length; i++) {
    const code = value.charCodeAt(i)
    if (code <= 0x1f || code === 0x7f) return true
  }
  return false
}

export function safeRedirectPath(candidate: unknown, fallback: string = DEFAULT_LOGIN_REDIRECT): string {
  if (typeof candidate !== 'string') return fallback
  if (!candidate.startsWith('/') || isProtocolRelative(candidate)) return fallback
  if (hasControlChar(candidate)) return fallback

  let url: URL
  try {
    url = new URL(candidate, BASE)
  } catch {
    return fallback
  }
  if (url.origin !== BASE) return fallback

  const normalized = `${url.pathname}${url.search}${url.hash}`
  return isProtocolRelative(normalized) ? fallback : normalized
}
