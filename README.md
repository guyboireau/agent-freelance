# Agent Freelance

AI-powered back-office for freelance developers — brief analysis, quote generation, prospect follow-up, and model comparison. Built as a learning project to go deep on LLM integration.

## What it does

**Brief analysis** — Paste a client brief (email, LinkedIn message, call notes). Claude extracts project type, complexity, probable stack, unclear points, budget signals, and an estimated number of days.

**Quote generation with RAG** — The agent searches your past projects semantically (pgvector) to find similar work, then generates a structured quote calibrated to your actual rates and delivery times.

**Agent chat** — Conversational interface powered by `streamText` + tool calling. The agent can analyze briefs, search past projects, create prospects, and draft follow-up emails — all in one thread.

**Model comparison** — Run the same brief through Claude Sonnet and GPT-4o simultaneously. Rate each result on 4 criteria and track which model performs better for your use case.

**Follow-up tracking** — Automatic detection of prospects that need a follow-up (quote unanswered for 7+ days, first follow-up unanswered for 10+ days).

## Stack

- **Next.js 15** — App Router, TypeScript strict
- **Vercel AI SDK v4** — `streamText` + tool calling, `generateObject` + Zod schemas
- **Anthropic Claude Sonnet** — main model
- **OpenAI GPT-4o** — comparison model + `text-embedding-3-small` for embeddings
- **Supabase** — Postgres + pgvector for semantic search
- **@react-pdf/renderer** — PDF quote export
- **Tailwind CSS** — styling

## Architecture

```text
app/
├── api/
│   ├── brief/
│   │   ├── analyze/     — generateObject (Claude), structured brief extraction
│   │   └── compare/     — parallel Claude + GPT-4o with usage metrics
│   ├── quotes/generate/ — RAG + generateObject, calibrated quote
│   ├── agent/chat/      — streamText + 4 tools (search, create, list, followup)
│   ├── followups/       — detect prospects needing a follow-up
│   └── stats/           — conversion rate, revenue, pipeline metrics
├── dashboard/           — prospect list + stats cards
├── prospects/[id]/      — brief analyzer + quote generator + status
├── chat/                — useChat interface (ai/react)
├── compare/             — model comparison UI with rating system
└── followups/           — prospects to follow up today

lib/
├── supabase/            — typed client (server + browser), generated types
└── rag/                 — embedText, embedMany, findSimilarProjects

scripts/
└── embed-projects.ts    — one-shot embedding generation for past_projects
```

## Run locally

```bash
git clone https://github.com/guyboireau/agent-freelance
cd agent-freelance
npm install
cp .env.local.example .env.local
# Fill in your keys (see below)
npm run dev
```

Required env vars:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
ANTHROPIC_API_KEY=
OPENAI_API_KEY=
SUPABASE_SERVICE_ROLE_KEY=   # only needed for the embed script
```

Then run the embedding script once to seed past projects with vectors:

```bash
npx tsx scripts/embed-projects.ts
```

## Deploy your own

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/guyboireau/agent-freelance)

You'll need a Supabase project with pgvector enabled. Run the migrations via the Supabase dashboard, then run the embed script.

## What I learned building this

- **`generateObject` + Zod** is the right abstraction for extracting structured data from LLMs — far more reliable than parsing free text
- **RAG with pgvector** is simpler than expected at this scale — a single SQL function does the heavy lifting
- **Tool calling with `streamText`** enables genuinely useful agents without needing LangChain or similar frameworks
- **Prompt engineering matters more than model choice** — the system prompt for brief analysis took 3x more time than the code around it
- **Model comparison is humbling** — Claude and GPT-4o often give different estimates for the same brief, with no clear winner

## License

MIT — Made by [guyboireau.com](https://guyboireau.com)
