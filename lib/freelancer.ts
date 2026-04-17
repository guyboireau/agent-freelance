export const FREELANCER = {
  name: 'Guy Boireau',
  title: 'Développeur freelance',
  email: 'boireauguy@gmail.com',
  website: 'guyboireau.com',
  // À renseigner dans .env.local si vous préférez ne pas hardcoder
  siret: process.env.NEXT_PUBLIC_FREELANCER_SIRET ?? '',
  phone: process.env.NEXT_PUBLIC_FREELANCER_PHONE ?? '',
  address: process.env.NEXT_PUBLIC_FREELANCER_ADDRESS ?? '',
  tjm: 350,
  tva_mention: 'TVA non applicable, article 293B du CGI',
  payment_terms: '30 jours date de facture',
  deposit_percent: 30,
}

export const ACTIVE_PROJECTS = [
  { name: 'LaLucarne', client: 'La Lucarne', stack: 'React + Vite + Supabase', type: 'actualités/événements' },
  { name: 'Munera', client: 'Munera', stack: 'React + Supabase', type: 'plateforme SaaS' },
  { name: 'arnault-janvier-stained-glass', client: 'Arnault Janvier', stack: 'Next.js 14 + Supabase', type: 'site vitrier artisan' },
  { name: 'guyboireau.com', client: 'Personnel', stack: 'Astro + Tailwind', type: 'site personnel' },
  { name: 'caltounian-workspace', client: 'C. Altounian', stack: 'React + NestJS + Supabase', type: 'école de danse' },
  { name: 'niido', client: 'Niido France', stack: 'React + React Native + Supabase', type: 'marketplace artisans' },
]
