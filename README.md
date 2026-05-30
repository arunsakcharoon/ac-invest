# AC Invest

Progressive Web App providing investment information for Thai retail investors — retirees and salary workers looking for accessible, reliable investment data in Thai and English. Free, no ads, donation-supported.

## Features

- **SET50 Dividend Yields** — Live yield table (dividend ÷ price, computed server-side from free sources). Public preview; full table requires sign-in.
- **My Portfolio** — Auth-gated. Track holdings, cost basis, dividend receipts. Yield on Cost and P&L computed automatically.
- **Daily Investment News** — RSS feeds from SET, BoT, and Thai financial news sources, fetched and stored daily. Open to all, no AI generation.
- **Bilingual** — Full Thai/English support with path-based routing (`/th/...`, `/en/...`)
- **Dark mode** — Manual toggle in header (Sun/Moon), respects system preference by default
- **PWA** — Installable on mobile with offline support
- **Donation-supported** — No ads, no Premium tier. PromptPay + card via donation strip.

## Tech stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router, Turbopack) |
| Language | TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| Auth + DB | Supabase (SSR, free tier) |
| i18n | next-intl (path-based, default: Thai) |
| Content | MDX (research) + JSON (bonds, dividends, news via Vercel Blob) |
| Storage | Vercel Blob (public JSON) + Supabase DB (user data) |
| Dark mode | next-themes (class strategy) |
| PWA | @ducanh2912/next-pwa |
| Hosting | Vercel (auto-deploy on push to master) |

## Getting started

### Prerequisites
- Node.js 18+
- npm or pnpm
- Supabase project (free tier)

### Installation

```bash
cd ac-invest
npm install
```

### Environment variables

```bash
cp .env.example .env.local
```

| Variable | Description | Required |
|----------|-------------|----------|
| `SUPABASE_URL` | Supabase project URL | Yes |
| `SUPABASE_ANON_KEY` | Supabase anon/public key | Yes |
| `ADMIN_API_KEY` | Secret for admin API endpoints | For API usage |
| `CRON_SECRET` | Vercel Cron protection (auto-set on Vercel) | For cron |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob token | For production |

### Database setup

Run all migrations against your Supabase project:

```bash
npx supabase db push
```

Or paste each file from `supabase/migrations/` into the Supabase SQL editor in order:
1. `001_initial.sql` — tables + RLS
2. `002_indexes.sql` — performance indexes

### Local dev data

The `content/` directory contains seed data for local development. The app reads these files when `NEXT_PUBLIC_BLOB_BASE_URL` is not set. Pre-seeded with realistic Thai market data:
- `content/dividends/set50-dividends.json` — 10 SET50 dividend rows
- `content/bonds/bonds.json` — 2 sample bond IPOs
- `content/news.json` — 5 sample news items

See `tools/skills/seed-dev-data.md` to add more.

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Defaults to Thai (`/th`).

### Build

```bash
npm run build
npm start
```

## Project structure

```
ac-invest/
├── content/
│   ├── bonds/bonds.json
│   ├── dividends/set50-dividends.json
│   └── research/stocks|markets/th|en/
├── messages/
│   ├── th.json
│   └── en.json
├── supabase/
│   └── migrations/001_initial.sql
├── public/
├── src/
│   ├── app/
│   │   ├── [locale]/
│   │   │   ├── page.tsx            # Home / landing
│   │   │   ├── dividends/          # SET50 dividend table
│   │   │   ├── portfolio/          # Auth-gated portfolio
│   │   │   ├── news/               # News listing (from Blob)
│   │   │   ├── bonds/              # Bond IPO tracker
│   │   │   ├── research/           # Research listing + detail
│   │   │   └── auth/               # Sign in / sign up pages
│   │   ├── api/
│   │   │   ├── admin/              # POST bonds/dividends
│   │   │   └── cron/
│   │   │       ├── prices/         # Daily price + yield fetch
│   │   │       └── news/           # Daily RSS fetch + store
│   │   └── globals.css
│   ├── components/
│   │   ├── dividends/
│   │   ├── portfolio/
│   │   ├── news/
│   │   ├── layout/
│   │   └── ui/
│   └── lib/
│       ├── supabase.ts             # Server + browser Supabase clients
│       ├── set50.ts                # SET50 ticker list
│       ├── content.ts              # MDX + JSON + Blob readers
│       ├── data-store.ts           # Vercel Blob helpers
│       ├── api-auth.ts             # Auth helpers
│       ├── types.ts                # TypeScript interfaces
│       └── utils.ts
├── tools/
│   └── skills/                     # Reusable skill files for Claude Code
│       ├── fetch-set50-prices.md
│       ├── fetch-rss-news.md
│       └── supabase-portfolio-metrics.md
├── vercel.json
└── .env.example
```

## Deployment

Auto-deploys to Vercel on push to `master`.

### Vercel setup

1. Import repo at [vercel.com/new](https://vercel.com/new)
2. Set root directory to `ac-invest` if monorepo
3. Add all environment variables from `.env.example`
4. `CRON_SECRET` is set automatically by Vercel

### Cron jobs

| Job | Schedule | Purpose |
|-----|----------|---------|
| `/api/cron/news` | 07:00 BKK (00:00 UTC) weekdays | Fetch RSS → score → store news.json to Vercel Blob |
| `/api/cron/prices` | 08:00 BKK (01:00 UTC) weekdays | Yahoo Finance → compute yield → Blob + Supabase |

### Updating production data (bonds / dividends)

Use `tools/scripts/update-blob.sh` to push updated JSON to Vercel Blob without a redeploy:

```bash
# Edit the data file first
# content/bonds/bonds.json  OR  content/dividends/set50-dividends.json

# Then push to production
export ADMIN_API_KEY=your-key
export APP_URL=https://your-app.vercel.app

bash tools/scripts/update-blob.sh bonds
bash tools/scripts/update-blob.sh dividends
```

See `tools/skills/update-blob-data.md` for full documentation.

### Local development data

Seed realistic data for local development by editing the JSON files in `content/`. See `tools/skills/seed-dev-data.md` for the data schema.

## Documentation

| Document | Description |
|----------|-------------|
| [PRD.md](PRD.md) | Product requirements, features, user stories |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Data flow, schema, cron logic, free API strategy |
| [CLAUDE.md](CLAUDE.md) | Instructions for Claude Code |

## Revenue model

Donation-supported. No ads, no Premium tier. Users can donate via PromptPay or card from the donation strip on the landing page.

## License

Private — All rights reserved.
