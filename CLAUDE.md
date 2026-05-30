@AGENTS.md

# AC Invest — Claude Code Instructions

## Read first
Before writing any code, read `ARCHITECTURE.md` for data flow and schema decisions, and `PRD.md` for feature scope. Do not invent infrastructure — every technical decision is already documented.

## Stack
- **Framework:** Next.js 15 (App Router, Turbopack)
- **Language:** TypeScript (strict)
- **Styling:** Tailwind CSS + shadcn/ui
- **Auth + DB:** Supabase (SSR pattern for App Router)
- **i18n:** next-intl (path-based: `/th/...`, `/en/...`, default: Thai)
- **Dark mode:** next-themes (`attribute="class"`, `defaultTheme="system"`); Tailwind v4 class variant configured via `@custom-variant dark` in `globals.css`
- **Content:** MDX (research) + JSON (bonds, dividends, news via Vercel Blob)
- **Storage:** Vercel Blob (dividends.json, bonds.json, news.json) + Supabase DB (user data)
- **PWA:** @ducanh2912/next-pwa
- **Hosting:** Vercel (auto-deploy on push to master)

## Project structure
```
content/                        # Static content files
  research/{category}/{locale}/ # Research MDX
  bonds/bonds.json              # Bond IPO data
  dividends/set50-dividends.json
  resources/resources.json
messages/                       # i18n strings (th.json, en.json)
supabase/
  migrations/                   # SQL migration files
src/app/[locale]/               # Pages
src/app/api/admin/              # Admin API (POST bonds/dividends)
src/app/api/cron/               # Cron jobs (prices, news)
src/components/                 # React components by feature
src/lib/
  content.ts                    # MDX + JSON + Blob readers
  types.ts                      # All TypeScript interfaces
  data-store.ts                 # Vercel Blob read/write
  api-auth.ts                   # Cron + admin auth helpers
  supabase-server.ts            # Supabase server client (Server Components + Route Handlers)
  supabase-browser.ts           # Supabase browser client (Client Components only)
  supabase.ts                   # Server-only barrel — do NOT import in Client Components
  set50.ts                      # SET50 ticker constant
tools/skills/                   # Reusable skill files for Claude Code
```

## Naming conventions
- Files: kebab-case (`bond-card.tsx`, `supabase.ts`)
- Components: PascalCase (`BondFilters`, `PortfolioTable`)
- Translation keys: camelCase nested by section (`portfolio.yieldOnCost`)

## Coding standards
- Server Components by default; `"use client"` only for interactivity
- All pages are async Server Components
- Every user-facing string must exist in both `messages/th.json` and `messages/en.json`
- **Translations:** Use `getTranslations` (async) in async Server Components; `useTranslations` in sync server or client components
- **Supabase imports:**
  - Server Components + Route Handlers → `import { createServerClient } from '@/lib/supabase-server'`
  - Client Components → `import { createBrowserClient } from '@/lib/supabase-browser'`
  - Never import `supabase.ts` in Client Components — it pulls in `next/headers` and breaks the bundle
- Never expose `SUPABASE_SERVICE_ROLE_KEY` to the browser — use anon key + RLS
- **Dark mode:** `ThemeProvider` (from `next-themes`) wraps the locale layout body. `ThemeToggle` (`src/components/layout/theme-toggle.tsx`) is a `'use client'` component — render it only after mount (`useState(false)` + `useEffect`) to avoid hydration mismatch. Use `resolvedTheme` (not `theme`) to get the actual active theme.

## Free API strategy — do not violate
This project is designed to avoid paid data APIs. Before adding any external data dependency, check `ARCHITECTURE.md` section "Free data sources". Rules:
- Stock prices and dividends: Yahoo Finance unofficial endpoint only (`query1.finance.yahoo.com`) — no API key required
- News: RSS feeds only — SET, BoT, กรุงเทพธุรกิจ, The Standard — parsed and stored as JSON in Vercel Blob
- No AI generation for news — raw RSS items displayed directly
- Auth + DB: Supabase free tier only
- Storage: Vercel Blob free tier only
- Never add Bloomberg, Refinitiv, or any paid financial data vendor

## Doc maintenance

**After completing any feature, bug fix, or infrastructure change, run the `update-docs` skill.**

The skill (`tools/skills/update-docs.md`) contains the exact mapping of what triggers an update in each of the 4 project docs. Do not skip this step — stale docs cause future sessions to make wrong assumptions.

Quick rule of thumb:
- New page / component → **PRD.md** (features) + **README.md** (features list)
- New package / pattern → **CLAUDE.md** (stack or coding standards) + **README.md** (tech stack table)
- New cron / API route → **ARCHITECTURE.md** (§6 or §7+) + **CLAUDE.md** (decision trees if pattern is new)
- New env var → **ARCHITECTURE.md** (§10) + **README.md** (getting started) + `.env.example`
- New migration → **ARCHITECTURE.md** (§4a)
- New skill file → **CLAUDE.md** (Skills list)

## Skills
Before implementing a repeatable task, check `tools/skills/` for an existing skill file:
- `add-i18n-key.md` — add a translation key to both th.json and en.json
- `scaffold-feature-page.md` — create a new page with all required pieces
- `add-supabase-migration.md` — generate a numbered .sql migration file
- `update-blob-data.md` — POST updated JSON to admin API for production Blob
- `seed-dev-data.md` — populate content/*.json for local development
- `fetch-set50-prices.md` — Yahoo Finance batch fetch + yield computation
- `fetch-rss-news.md` — RSS fetch, parse, score, store to Blob
- `supabase-portfolio-metrics.md` — portfolio metric formulas + Supabase query pattern
- `update-docs.md` — checklist for keeping the 4 project docs in sync after code changes

## Boundaries — do not modify
- `src/middleware.ts` — locale routing
- `src/i18n/` — i18n setup
- `vercel.json` — only append cron entries, never remove existing ones
- `.env.example` — always update when adding new env vars

## Decision trees

### Adding a new feature page
Use `tools/skills/scaffold-feature-page.md` for the full checklist. Summary:
1. Create page at `src/app/[locale]/{feature}/page.tsx` — export `generateMetadata` and default async component
2. Add auth guard if required: use `createServerClient` from `@/lib/supabase-server`, redirect to `/{locale}/auth/signin`
3. Create components at `src/components/{feature}/`
4. Run `add-i18n-key` skill to add `{feature}.title` and all needed strings to both message files
5. Add nav link to `src/components/layout/header.tsx` (navLinks array)

### Adding a new cron job
1. Create route at `src/app/api/cron/{name}/route.ts`
2. Protect with `CRON_SECRET` check via `src/lib/api-auth.ts`
3. Add schedule to `vercel.json` under `crons`
4. Document in `ARCHITECTURE.md`

### Updating bond/dividend data
- Development: use `seed-dev-data` skill — edit JSON in `content/`, serve locally
- Production: use `update-blob-data` skill — POST to `/api/admin/{bonds|dividends}` via `tools/scripts/update-blob.sh`

### Auth-gated pages
- Portfolio page and full dividend table require sign-in
- Use Supabase server client to check session in the page component
- Redirect unauthenticated users to `/{locale}/auth/signin`
- Public pages (news, partial dividend table): no auth required

## Environment variables
All required vars are documented in `.env.example`. Never hardcode secrets. Required for full functionality:
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase project (safe to expose; anon key + RLS)
- `ADMIN_API_KEY` — admin API protection (server-only secret)
- `CRON_SECRET` — Vercel cron protection (auto-set on Vercel)
- `BLOB_READ_WRITE_TOKEN` — Vercel Blob write access (server-only)
- `NEXT_PUBLIC_BLOB_BASE_URL` — Vercel Blob public base URL (for client-side reads)
