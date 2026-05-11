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

- Pas de `;` en fin de ligne (config ESLint)
- Imports absolus via `@/` (alias TypeScript)
- Pas de `any` implicite — `strict: true` dans `tsconfig.json`
- Les fonctions serveur Supabase sont `async` et retournent `Promise<SupabaseClient>`

## Variables d'environnement

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ANTHROPIC_API_KEY=
WEBHOOK_SECRET=
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
3. **PDF** : `@react-pdf/renderer` est utilisé pour générer les devis côté serveur — lourd, ne pas l'ajouter au bundle client.
