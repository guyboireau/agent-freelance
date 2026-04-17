# Agent Freelance

> AI-powered back-office for freelance developers — built to explore real LLM integration patterns, not toy demos.

**[→ Live demo](https://agent-freelance.vercel.app)** · Data is seeded, nothing is saved.

---

<!-- Replace with actual screencast — record with Loom then convert:        -->
<!-- ffmpeg -i screencast.mp4 -vf "fps=15,scale=1200:-1" -loop 0 demo.gif  -->
<!-- ![Demo: analyzing a client brief in real time](docs/demo.gif)          -->

> **Recording needed:** `npm run dev` → open `/chat` → paste the brief below → Loom it.
>
> ```text
> Bonjour, je cherche un dev pour une app mobile de covoiturage avec géolocalisation temps réel,
> notifications push et paiements in-app. On vise l'App Store + Google Play. Budget ~20k€.
> ```

---

## Features

### LinkedIn post generator

Paste a GitHub URL **or type any topic** → get 3–4 ready-to-publish posts in different voices:

| Tone | What it does |
| --- | --- |
| **Narrative** | The story of the project — why, how, what was hard |
| **Technical** | A deep dive on one architecture or problem |
| **REX** | Honest retrospective — what worked, what didn't |
| **Promotional** | Visibility post — your expertise, a concrete offer |

This is the feature freelancers actually use daily. It works on any topic: rates, stack choices, client stories, anything.

---

### Agent chat with persistent memory

Conversational interface powered by `streamText` + tool calling. Each conversation is stored under a `thread_id` (localStorage), so the agent remembers your exchanges across sessions.

The agent knows your active projects, your rates, and your stack. Tools available:

```text
search_similar_projects  → RAG search over past_projects (pgvector)
create_prospect          → insert a new prospect in the DB
list_prospects           → filtered view of the pipeline
get_prospect_details     → full prospect data (brief + quote)
suggest_followup         → draft a follow-up email (Haiku, fast)
```

### Brief analysis → structured quote

Paste a client message (email, LinkedIn DM, call notes) → Claude extracts project type, complexity 1–5, probable stack, unclear points, budget signals, and an estimated number of days → RAG searches your past projects → generates a line-by-line quote calibrated to your actual rates.

Export as a professional PDF with: two-column header (your info + client info), quote ref, 30-day validity, itemized breakdown, payment schedule, signature block.

### Email generator

5 templates, one click: send quote · follow-up · thank you · polite decline · proactive proposal. Context (client name, quote amount, project summary) is injected automatically.

### Document storage per client

Attach PDFs, contracts, and signed quotes to any prospect file. Drag & drop upload to Supabase Storage, organized by type (Brief / Quote / Contract / Other).

### Follow-up tracking

Auto-detection of stale prospects: 7 days without response after quote → first follow-up. 10 days → second. 14 days → urgent (flagged red).

### Model comparison

Same brief → Claude Sonnet vs Claude Haiku in parallel. Side-by-side diff with token counts, elapsed time, and a 4-criteria rating system.

---

## Stack

- **Next.js 15** App Router, TypeScript strict
- **Vercel AI SDK v4** — `streamText` + tool calling, `generateObject` + Zod
- **Anthropic Claude Sonnet** — analysis, quotes, LinkedIn posts
- **Claude Haiku** — follow-up drafts, email generation (fast + cheap)
- **Supabase** — Postgres + pgvector + Storage
- **@react-pdf/renderer** — PDF quote export
- **Vitest** — integration tests with mocked LLM

## Architecture

```text
app/
├── api/
│   ├── brief/analyze/      generateObject → BriefAnalysisSchema (Zod)
│   ├── brief/compare/      parallel Sonnet + Haiku with token metrics
│   ├── quotes/generate/    RAG + generateObject → QuoteSchema
│   ├── agent/
│   │   ├── chat/           streamText + 5 tools, thread_id persistence
│   │   └── messages/       GET history by thread_id
│   ├── email/generate/     5 email types, context-aware (Haiku)
│   ├── linkedin/           GitHub mode + free topic mode, 4 tones
│   ├── followups/          stale prospect detection
│   └── stats/              pipeline metrics
├── dashboard/              prospect list + 5 KPI cards
├── prospects/[id]/         brief → quote → email → documents
├── chat/                   useChat with initialMessages from DB
├── emails/                 standalone email generator
├── linkedin/               GitHub URL or free topic
├── compare/                model comparison UI
└── followups/              relance queue

lib/
├── freelancer.ts           your profile (TJM, SIRET, active projects)
├── supabase/               typed client (server + browser), generated types
└── rag/search.ts           semantic project search (Haiku ranking)
```

## Run locally

```bash
git clone https://github.com/guyboireau/agent-freelance
cd agent-freelance
npm install
cp .env.local.example .env.local
# Fill in keys (see below)
npm run dev
```

Then seed demo data:

```bash
npx tsx scripts/seed-demo.ts
```

Required env vars:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
ANTHROPIC_API_KEY=
SUPABASE_SERVICE_ROLE_KEY=    # seed script only

# Webhook Make.com
WEBHOOK_SECRET=               # secret partagé avec Make (header x-webhook-secret)
NEXT_PUBLIC_APP_URL=          # ex: https://agent-freelance.vercel.app

# Optional — shown on PDF quotes
NEXT_PUBLIC_FREELANCER_SIRET=
NEXT_PUBLIC_FREELANCER_PHONE=
NEXT_PUBLIC_FREELANCER_ADDRESS=
```

Supabase setup: enable pgvector, run `supabase/migrations/` in order.

## Tests

```bash
npm test           # vitest run (13 tests, ~350ms)
npm run test:watch
```

Tests are integration tests on the route handlers — mocked LLM, real Zod validation. They assert on structural validity **and** semantic plausibility (a simple brief shouldn't come back with complexity 5 and 40 estimated days):

```text
__tests__/api/
├── brief-analyze.test.ts   5 tests — schema, edge cases, semantic rules
└── email-generate.test.ts  8 tests — all 5 types, subject extraction, 400s
```

For real LLM evaluation against the live model: `scripts/eval-brief.ts` (coming soon).

## Deploy your own

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/guyboireau/agent-freelance)

1. Connect your Supabase project and set env vars in Vercel
2. Run migrations via Supabase dashboard
3. `npx tsx scripts/seed-demo.ts` for demo data

## What I learned

- **`generateObject` + Zod** is the right primitive for structured LLM output — more reliable than parsing free text, easier to test
- **Tool calling without frameworks** — `streamText` + `tool()` from the AI SDK is all you need, no LangChain
- **RAG at small scale** — letting Haiku rank a handful of past projects semantically is cheaper and more flexible than maintaining embeddings
- **Prompt engineering is the hard part** — the brief analysis system prompt took more iteration than all the surrounding code combined
- **Testing LLMs is different** — you assert on contracts and plausibility ranges, not exact values; mocking the SDK is the right approach for CI

## License

MIT — [guyboireau.com](https://guyboireau.com)
