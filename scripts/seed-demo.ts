/**
 * Seed démo — insère des données fictives réalistes pour la démo live.
 * Usage : npx tsx scripts/seed-demo.ts
 * Nécessite NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY dans .env.local
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ─── Past projects (base RAG) ─────────────────────────────────────────────────

const PAST_PROJECTS = [
  {
    name: 'Boutique en ligne Maison Fabre',
    client: 'Maison Fabre',
    type: 'e-commerce',
    description: 'Refonte complète d\'un site e-commerce B2C pour une maison de gants de luxe. Catalogue produit, Stripe, espace compte client, intégration logistique.',
    stack: ['Next.js', 'TypeScript', 'Stripe', 'Supabase', 'Tailwind'],
    duration_days: 18,
    daily_rate: 350,
    total_ht: 6300,
    delivered_at: '2025-11-15',
  },
  {
    name: 'SaaS RH — OnBoarding Pro',
    client: 'OnBoarding Pro',
    type: 'saas',
    description: 'Plateforme SaaS B2B de gestion de l\'onboarding employés. Workflow personnalisables, notifications, dashboard RH, rôles et permissions.',
    stack: ['React', 'NestJS', 'PostgreSQL', 'Supabase Auth', 'React Query'],
    duration_days: 28,
    daily_rate: 350,
    total_ht: 9800,
    delivered_at: '2025-09-01',
  },
  {
    name: 'App mobile livraison ZipDash',
    client: 'ZipDash',
    type: 'mobile',
    description: 'Application React Native pour livreurs et clients. Tracking GPS temps réel, notifications push, système de notation, paiements in-app.',
    stack: ['React Native', 'Expo', 'Supabase', 'Stripe', 'Google Maps API'],
    duration_days: 32,
    daily_rate: 350,
    total_ht: 11200,
    delivered_at: '2025-06-20',
  },
  {
    name: 'Site vitrine Cabinet Moreau Notaires',
    client: 'Cabinet Moreau',
    type: 'site-vitrine',
    description: 'Site vitrine institutionnel pour un cabinet notarial. Présentation des associés, blog juridique, formulaire de prise de RDV.',
    stack: ['Next.js', 'Tailwind', 'Supabase'],
    duration_days: 7,
    daily_rate: 350,
    total_ht: 2450,
    delivered_at: '2025-12-10',
  },
  {
    name: 'API données financières — FinMetrics',
    client: 'FinMetrics',
    type: 'api',
    description: 'API REST haute performance pour agrégation de données boursières. Authentification JWT, rate limiting, cache Redis, documentation Swagger.',
    stack: ['NestJS', 'PostgreSQL', 'Redis', 'TypeScript', 'Docker'],
    duration_days: 16,
    daily_rate: 350,
    total_ht: 5600,
    delivered_at: '2025-07-30',
  },
  {
    name: 'Marketplace artisans ArtLocal',
    client: 'ArtLocal',
    type: 'marketplace',
    description: 'MVP marketplace mettant en relation artisans locaux et particuliers. Profils vendeurs, système de commandes, messagerie, avis clients.',
    stack: ['Next.js', 'Supabase', 'Stripe Connect', 'Tailwind', 'Zod'],
    duration_days: 24,
    daily_rate: 350,
    total_ht: 8400,
    delivered_at: '2025-10-05',
  },
]

// ─── Prospects ───────────────────────────────────────────────────────────────

const PROSPECTS = [
  {
    name: 'Marie Dubois',
    company: 'Startup Renov',
    email: 'marie.dubois@startup-renov.fr',
    phone: '06 12 34 56 78',
    siret: '894 123 456 00015',
    source: 'LinkedIn',
    status: 'won',
    brief_text: 'Bonjour, je cherche un développeur pour créer une plateforme SaaS de gestion de chantiers pour des artisans du bâtiment. Les artisans doivent pouvoir créer des devis, suivre leurs chantiers, et les clients ont accès à un portail pour voir l\'avancement. On a déjà une maquette Figma complète et un budget autour de 12-15k€. Démarrage idéalement en janvier.',
    brief_analysis: {
      project_type: 'saas',
      probable_stack: ['Next.js', 'Supabase', 'React Query', 'Tailwind'],
      complexity: 4,
      unclear_points: ['Gestion des paiements en ligne prévue ?', 'Multi-tenant ou instance unique ?'],
      budget_signals: ['Budget mentionné : 12-15k€', 'Maquette Figma existante', 'Démarrage défini en janvier'],
      estimated_days: 24,
      summary: 'Plateforme SaaS B2B pour artisans du bâtiment avec gestion de devis, suivi chantiers et portail client. Périmètre bien défini avec maquettes. Budget confortable.',
    },
    quote_lines: [
      { label: 'Setup, architecture & auth multi-rôles', days: 3, unit_price: 350, total: 1050 },
      { label: 'Module devis & facturation', days: 5, unit_price: 350, total: 1750 },
      { label: 'Suivi chantier & notifications', days: 6, unit_price: 350, total: 2100 },
      { label: 'Portail client (lecture seule)', days: 4, unit_price: 350, total: 1400 },
      { label: 'Dashboard analytique', days: 3, unit_price: 350, total: 1050 },
      { label: 'Tests, déploiement & doc', days: 3, unit_price: 350, total: 1050 },
    ],
    quote_total: 8400,
    quote_status: 'accepted',
  },
  {
    name: 'Thomas Bernard',
    company: 'Bernard & Fils Distribution',
    email: 'thomas@bernard-distrib.com',
    phone: '07 89 01 23 45',
    source: 'Recommandation',
    status: 'followup_1',
    brief_text: 'On distribue des produits alimentaires régionaux à des épiceries fines. On voudrait un site e-commerce B2B pour que nos revendeurs puissent passer commande directement. Catalogue de ~300 références, gestion des tarifs par compte, exports CSV pour notre logiciel de compta.',
    brief_analysis: {
      project_type: 'e-commerce',
      probable_stack: ['Next.js', 'Supabase', 'Stripe', 'Tailwind'],
      complexity: 3,
      unclear_points: ['Intégration avec quel logiciel de compta ?', 'Gestion des stocks en temps réel ?', 'Mobile important pour les revendeurs ?'],
      budget_signals: ['Pas de budget mentionné', 'Besoin métier clair et bien défini'],
      estimated_days: 15,
      summary: 'Plateforme e-commerce B2B pour revendeurs avec catalogue, tarifs différenciés et exports compta. Projet bien cadré, complexité modérée.',
    },
    quote_lines: [
      { label: 'Catalogue produits & gestion tarifs par compte', days: 4, unit_price: 350, total: 1400 },
      { label: 'Tunnel de commande B2B', days: 4, unit_price: 350, total: 1400 },
      { label: 'Espace revendeur & historique commandes', days: 3, unit_price: 350, total: 1050 },
      { label: 'Export CSV & intégrations compta', days: 2, unit_price: 350, total: 700 },
      { label: 'Admin & déploiement', days: 2, unit_price: 350, total: 700 },
    ],
    quote_total: 5250,
    quote_status: 'sent',
  },
  {
    name: 'Claire Martin',
    company: 'Studio Lumière Photo',
    email: 'claire@studiolumiere.fr',
    source: 'Site web',
    status: 'brief_received',
    brief_text: 'Je suis photographe pro et j\'ai besoin d\'un site pour présenter mon portfolio, permettre aux clients de commander des tirages en ligne, et d\'un espace client pour livrer les photos en haute résolution après une séance. Quelque chose de beau visuellement, j\'ai des maquettes Canva approximatives.',
    brief_analysis: null,
    quote_lines: [],
    quote_total: 0,
    quote_status: 'draft',
  },
  {
    name: 'Lucas Petit',
    company: 'AgenceDigital360',
    email: 'l.petit@agencedigital360.com',
    source: 'Cold email',
    status: 'lost',
    brief_text: 'On cherche quelqu\'un pour refaire notre site agence. Budget très serré, environ 800€, on voudrait quelque chose de moderne avec animations.',
    brief_analysis: {
      project_type: 'site-vitrine',
      probable_stack: ['Next.js', 'Tailwind', 'Framer Motion'],
      complexity: 2,
      unclear_points: ['Budget de 800€ incompatible avec les attentes'],
      budget_signals: ['Budget déclaré : 800€ — sous le seuil rentable (TJM 350€)'],
      estimated_days: 5,
      summary: 'Site agence avec animations. Budget incompatible avec les attentes. Projet refusé.',
    },
    quote_lines: [],
    quote_total: 0,
    quote_status: 'draft',
  },
  {
    name: 'Sophie Laurent',
    company: 'Cabinet RH Avenir',
    email: 'sophie.laurent@rh-avenir.fr',
    phone: '06 55 44 33 22',
    siret: '512 987 654 00028',
    source: 'LinkedIn',
    status: 'quote_sent',
    brief_text: 'Nous sommes un cabinet de conseil RH et on a besoin d\'un outil interne pour gérer nos missions de recrutement : pipeline candidats, fiches de poste, suivi des entretiens, et envoi de comptes-rendus automatiques aux clients. On a 8 recruteurs dans l\'équipe.',
    brief_analysis: {
      project_type: 'webapp',
      probable_stack: ['React', 'Supabase', 'React Query', 'Zod'],
      complexity: 3,
      unclear_points: ['Intégration avec des ATS existants ?', 'Import/export LinkedIn souhaité ?'],
      budget_signals: ['Équipe de 8 personnes → budget probable 5-8k€', 'Outil interne → moins d\'exigences visuelles'],
      estimated_days: 9,
      summary: 'ATS interne léger pour cabinet de recrutement. Pipeline candidats, suivi entretiens et reporting client automatisé. Périmètre clair.',
    },
    quote_lines: [
      { label: 'Pipeline candidats & fiches de poste', days: 3, unit_price: 350, total: 1050 },
      { label: 'Suivi entretiens & notes', days: 2, unit_price: 350, total: 700 },
      { label: 'Comptes-rendus automatiques (email)', days: 2, unit_price: 350, total: 700 },
      { label: 'Déploiement & onboarding équipe', days: 2, unit_price: 350, total: 700 },
    ],
    quote_total: 3150,
    quote_status: 'sent',
  },
  {
    name: 'Antoine Moreau',
    company: 'FoodTech Startups',
    email: 'antoine.moreau@foodtech.io',
    source: 'Twitter / X',
    status: 'brief_received',
    brief_text: 'On construit une app de partage de recettes avec système social (like, commentaires, follow), suggestion IA basée sur les ingrédients qu\'on a dans le frigo, et version mobile iOS/Android. On lève une seed en ce moment, donc budget pas encore défini mais on cherche à estimer.',
    brief_analysis: null,
    quote_lines: [],
    quote_total: 0,
    quote_status: 'draft',
  },
]

// ─── Runner ───────────────────────────────────────────────────────────────────

async function seed() {
  console.log('🌱 Seeding demo data...\n')

  // 1. Past projects
  console.log('📁 Inserting past_projects...')
  const { error: ppErr } = await supabase.from('past_projects').upsert(
    PAST_PROJECTS.map((p) => ({ ...p, delivered_at: p.delivered_at + 'T00:00:00Z' })),
    { onConflict: 'name' }
  )
  if (ppErr) console.error('  ❌', ppErr.message)
  else console.log(`  ✓ ${PAST_PROJECTS.length} past projects`)

  // 2. Prospects + briefs + quotes
  console.log('\n👥 Inserting prospects, briefs & quotes...')
  for (const p of PROSPECTS) {
    const { quote_lines, quote_total, quote_status, brief_text, brief_analysis, ...prospectData } = p

    const { data: prospect, error: pErr } = await supabase
      .from('prospects')
      .insert(prospectData)
      .select()
      .single()

    if (pErr) { console.error(`  ❌ ${p.name}:`, pErr.message); continue }
    console.log(`  ✓ ${p.name} (${p.status})`)

    // Brief
    const { data: brief } = await supabase
      .from('briefs')
      .insert({ prospect_id: prospect.id, raw_text: brief_text, analysis: brief_analysis })
      .select()
      .single()

    // Quote (si des lignes existent)
    if (quote_lines.length > 0 && brief) {
      await supabase.from('quotes').insert({
        prospect_id: prospect.id,
        brief_id: brief.id,
        lines: quote_lines,
        total_ht: quote_total,
        duration_days: quote_lines.reduce((s, l) => s + l.days, 0),
        conditions: '30% à la commande, 70% à la livraison. Délai de paiement : 30 jours.',
        notes: `Basé sur des projets similaires livrés. Estimation inclut recette et déploiement Vercel + Supabase.`,
        status: quote_status,
      })
    }
  }

  console.log('\n✅ Seed terminé !')
  console.log('   Connecte-toi sur ton instance Vercel pour voir les données.')
}

seed().catch(console.error)
