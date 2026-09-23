# Agent Freelance — Contexte IA

> Fichier de contexte pour les assistants de codage (Claude, Copilot, etc.)

## Stack

- **Framework** : Next.js 15 (App Router)
- **Runtime** : React 19, TypeScript 5
- **Styling** : Tailwind CSS 4
- **Base de données** : Supabase (PostgreSQL + Auth)
- **Tests** : Vitest 4
- **LLM** : Anthropic Claude via `ai` SDK (`@ai-sdk/anthropic`)

## Architecture clé

### Auth & SSR Supabase

Le projet utilise `@supabase/ssr` avec l'API moderne `getAll` / `setAll` (pas l'ancienne `get`/`set`/`remove`).

- `lib/supabase/server.ts` — `createServerClient` avec `cookies()` de Next.js
- `lib/supabase/client.ts` — `createBrowserClient` (pas besoin de config cookies côté client)
- `middleware.ts` — `createServerClient` avec `req.cookies` / `response.cookies`

> **Règle** : si on met à jour `@supabase/ssr`, vérifier que l'API `getAll`/`setAll` n'a pas changé. La v0.10.3 est compatible.

### Validation Zod

Zod v4 est utilisé. L'API est stable par rapport à v3 pour les cas d'usage du projet (`z.object`, `z.string`, `z.array`, `z.infer`, `.parse()`, `.safeParse()`).

Fichiers concernés :
- `lib/rag/search.ts` — schéma de réponse LLM
- `app/api/linkedin/route.ts` — schéma de posts générés
- `app/api/webhooks/inbound-email/route.ts` — schéma de requête webhook + analyse de brief

> **Règle** : Zod v4 est rétro-compatible pour ces patterns. Pas de migration nécessaire.

### Patterns LLM

- `generateText` + `generateObject` (ai SDK) pour les appels à Claude
- `streamText` pour le chat agent (mémoire persistante par `thread_id`)
- Pas d'embeddings — la recherche sémantique (`findSimilarProjects`) envoie tous les projets dans le prompt (volume faible, coût négligeable)

### Webhook sécurisé

`POST /api/webhooks/inbound-email` vérifie le header `x-webhook-secret` contre `WEBHOOK_SECRET`.

## Conventions de code

- Pas de `;` en fin de ligne : convention du code, qu'aucun outil n'impose (ESLint n'applique que les presets `next/core-web-vitals` et `next/typescript`)
- Imports absolus via `@/` (alias TypeScript)
- Pas de `any` implicite — `strict: true` dans `tsconfig.json`
- Les fonctions serveur Supabase sont `async` et retournent `Promise<SupabaseClient>`

## Variables d'environnement

Liste de référence, commentée : `.env.local.example`.

```bash
# Supabase (requis)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=        # scripts/seed-demo.ts uniquement

# Anthropic (requis)
ANTHROPIC_API_KEY=

# Webhook Make.com (requis pour /api/webhooks/inbound-email)
WEBHOOK_SECRET=
NEXT_PUBLIC_APP_URL=              # URL publique, pour les liens des mails sortants

# Optionnelles
SITE_GENERATOR_WEBHOOK_URL=       # /api/pipeline/generate, sinon la route répond 503
TRUSTED_PROXY=                    # non vide = x-forwarded-for pris en compte par le rate limit
NEXT_PUBLIC_FREELANCER_EMAIL=     # identité affichée sur les devis PDF
NEXT_PUBLIC_FREELANCER_SIRET=
NEXT_PUBLIC_FREELANCER_PHONE=
NEXT_PUBLIC_FREELANCER_ADDRESS=
```

## Commandes utiles

```bash
npm run dev        # Next.js dev server
npm run build      # Build de production
npm run test       # Vitest (run once)
npm run test:watch # Vitest (watch mode)
npm run lint       # ESLint
```

## Points de vigilance

1. **Middleware** : la réponse est reconstruite dans `setAll` pour que les cookies soient bien propagés. Ne pas simplifier ce pattern.
2. **Rate limiting** : `lib/rate-limit.ts` utilise un store en mémoire (OK pour Vercel sans Redis, mais pas scalable).
3. **PDF** : les devis sont générés **côté client**. `components/QuotePDF.tsx` est `'use client'` et `downloadQuotePDF()` appelle `pdf(...).toBlob()` dans le navigateur. `@react-pdf/renderer`, lourd, fait donc partie du bundle client de la page prospect (import statique via `QuoteGenerator`).
