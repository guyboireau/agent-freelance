/**
 * Profil du freelance : identité imprimée sur les devis PDF et reprise dans
 * les prompts.
 *
 * Le dépôt est public : aucune donnée réelle n'est versionnée ici. Tout vient
 * des variables NEXT_PUBLIC_FREELANCER_* (liste commentée dans
 * .env.local.example), avec des valeurs par défaut neutres.
 *
 * NEXT_PUBLIC_ : Next inline ces valeurs dans le bundle JS client au build,
 * parce que le devis PDF est généré dans le navigateur (components/QuotePDF.tsx).
 * N'y mettre que ce qui figure de toute façon sur un devis. Les données
 * internes (projets et clients en cours) restent côté serveur, dans
 * lib/active-projects.ts. Changer une valeur demande un nouveau build.
 *
 * Chaque variable est lue par son nom complet (process.env.NEXT_PUBLIC_…) :
 * Next ne remplace que cette forme littérale, pas un accès dynamique.
 */

const A_CONFIGURER = 'À configurer'

/** TJM en euros HT : un nombre strictement positif, sinon null (non configuré). */
export function parseTjm(raw: string | undefined): number | null {
  if (!raw?.trim()) return null
  const tjm = Number(raw)
  return Number.isFinite(tjm) && tjm > 0 ? tjm : null
}

export interface FreelancerProfile {
  name: string
  title: string
  email: string
  website: string
  siret: string
  phone: string
  address: string
  /** TJM en euros HT, null tant que NEXT_PUBLIC_FREELANCER_TJM n'est pas défini. */
  tjm: number | null
  tva_mention: string
  payment_terms: string
  deposit_percent: number
}

export const FREELANCER: FreelancerProfile = {
  name: process.env.NEXT_PUBLIC_FREELANCER_NAME || A_CONFIGURER,
  title: process.env.NEXT_PUBLIC_FREELANCER_TITLE || 'Développeur freelance',
  email: process.env.NEXT_PUBLIC_FREELANCER_EMAIL || A_CONFIGURER,
  website: process.env.NEXT_PUBLIC_FREELANCER_WEBSITE || '',
  siret: process.env.NEXT_PUBLIC_FREELANCER_SIRET || '',
  phone: process.env.NEXT_PUBLIC_FREELANCER_PHONE || '',
  address: process.env.NEXT_PUBLIC_FREELANCER_ADDRESS || '',
  tjm: parseTjm(process.env.NEXT_PUBLIC_FREELANCER_TJM),
  tva_mention: 'TVA non applicable, article 293B du CGI',
  payment_terms: '30 jours date de facture',
  deposit_percent: 30,
}

/** Le TJM tel qu'il apparaît dans les prompts : « 500€/jour » ou « non configuré ». */
export const TJM_LABEL = FREELANCER.tjm === null ? 'non configuré' : `${FREELANCER.tjm}€/jour`

/** Montant HT estimé (jours × TJM), ou null tant que le TJM n'est pas configuré. */
export function estimateHt(days: number): number | null {
  return FREELANCER.tjm === null ? null : days * FREELANCER.tjm
}

/** « 12j · 6000€ HT », ou seulement « 12j » tant que le TJM n'est pas configuré. */
export function formatEstimate(days: number): string {
  const ht = estimateHt(days)
  return ht === null ? `${days}j` : `${days}j · ${ht}€ HT`
}
