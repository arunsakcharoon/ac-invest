# AC Invest — Architecture

**Version:** 1.3
**Last updated:** May 2026

---

## 1. Design principle: minimize paid APIs

Every data dependency was chosen to be free. Before adding any external service, verify it appears in section 3 (Free data sources). Paid financial data vendors (Bloomberg, Refinitiv, etc.) are explicitly prohibited. No AI APIs are used at runtime.

---

## 2. System overview

```
Free sources          Vercel Cron (daily)       Storage
─────────────         ───────────────────       ───────
Yahoo Finance    →    Price + yield cron    →   Vercel Blob (dividends.json)
SET website      →    (08:00 BKK weekdays)  →   Supabase DB  (stocks table)

RSS feeds        →    News cron             →   Vercel Blob (news.json)
                      (07:00 BKK weekdays)       → News page reads Blob directly

Supabase Auth    →    User session (SSR)    →   Supabase DB  (portfolios, holdings)
```

---

## 3. Free data sources

### 3.1 Stock prices + dividends — Yahoo Finance
- Endpoint: `https://query1.finance.yahoo.com/v8/finance/spark` or `v7/finance/quote`
- Thai tickers use `.BK` suffix: `PTT.BK`, `KBANK.BK`, etc.
- Key fields: `regularMarketPrice`, `trailingAnnualDividendRate`
- No API key required. Batch all SET50 tickers in one request.
- Rate limit: generous for server-side batch calls; do not call from browser.

### 3.2 Dividend announcements — SET website
- Public RSS and HTML pages at `set.or.th`
- Used to supplement Yahoo Finance dividend data and XD dates

### 3.3 News — RSS feeds
- SET: `https://www.set.or.th/th/news/rss`
- BoT: `https://www.bot.or.th/rss`
- กรุงเทพธุรกิจ: `https://www.bangkokbiznews.com/rss/finance.xml`
- The Standard: public RSS
- Parse with `fast-xml-parser` (no key, no cost)
- Items stored as-is (title, excerpt, link, date, source) — no AI processing

### 3.4 Auth + user DB — Supabase free tier
- 50,000 MAU, 500MB DB, included auth
- Sufficient for early scale

### 3.5 Storage — Vercel Blob free tier
- 1GB storage, used for `dividends.json`, `bonds.json`, and `news.json`
- Read by public pages; written by cron and admin API

---

## 4. Database schema (Supabase)

```sql
-- Shared stock reference (written by cron, read by all)
stocks (
  ticker                    TEXT PRIMARY KEY,       -- e.g. 'PTT'
  name                      TEXT,
  sector                    TEXT,
  last_price                DECIMAL(12,4),
  trailing_annual_dividend  DECIMAL(10,4) DEFAULT 0, -- written by price cron
  price_updated_at          TIMESTAMPTZ
)

-- Dividend events (written by cron)
dividends (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticker           TEXT REFERENCES stocks(ticker),
  amount_per_share DECIMAL(10,4),
  ex_date          DATE,
  pay_date         DATE,
  frequency        TEXT                    -- 'annual','semi-annual','quarterly'
)

-- Users (managed by Supabase Auth)
users (
  id               UUID PRIMARY KEY,       -- matches auth.users.id
  email            TEXT UNIQUE NOT NULL,
  full_name        TEXT,
  created_at       TIMESTAMPTZ DEFAULT now()
)

-- User portfolios
portfolios (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID REFERENCES users(id) ON DELETE CASCADE,
  name             TEXT DEFAULT 'My Portfolio',
  created_at       TIMESTAMPTZ DEFAULT now()
)

-- Individual holdings
holdings (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_id     UUID REFERENCES portfolios(id) ON DELETE CASCADE,
  ticker           TEXT REFERENCES stocks(ticker),
  shares           DECIMAL(14,4) NOT NULL,
  cost_per_share   DECIMAL(12,4) NOT NULL,
  purchase_date    DATE
)

-- Dividend income tracking
dividend_receipts (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  holding_id       UUID REFERENCES holdings(id) ON DELETE CASCADE,
  dividend_id      UUID REFERENCES dividends(id),
  amount_received  DECIMAL(12,4),
  received_date    DATE
)
```

### Row-Level Security

```sql
ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE holdings ENABLE ROW LEVEL SECURITY;
ALTER TABLE dividend_receipts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own portfolios" ON portfolios
  USING (user_id = auth.uid());

CREATE POLICY "own holdings" ON holdings
  USING (portfolio_id IN (
    SELECT id FROM portfolios WHERE user_id = auth.uid()
  ));

CREATE POLICY "own receipts" ON dividend_receipts
  USING (holding_id IN (
    SELECT h.id FROM holdings h
    JOIN portfolios p ON h.portfolio_id = p.id
    WHERE p.user_id = auth.uid()
  ));
```

---

## 4a. Migrations

| File | Description |
|------|-------------|
| `001_initial.sql` | Creates all tables (stocks, dividends, users, portfolios, holdings, dividend_receipts) + RLS policies |
| `002_indexes.sql` | Adds performance indexes on holdings, dividends, portfolios, and stocks |
| `003_stocks_dividend_column.sql` | Adds `trailing_annual_dividend` to stocks (written by price cron; read by portfolio metrics) |

Use `tools/skills/add-supabase-migration.md` when adding new migrations.

---

## 5. Computed metrics (never stored, always calculated)

All portfolio metrics are computed at query time from raw holdings + stocks data:

```
currentValue      = shares × stocks.last_price
gainLoss          = currentValue - (shares × cost_per_share)
gainLossPct       = gainLoss / (shares × cost_per_share) × 100
dividendYield     = stocks.trailingAnnualDividend / stocks.last_price × 100
yieldOnCost       = stocks.trailingAnnualDividend / cost_per_share × 100
annualIncome      = shares × stocks.trailingAnnualDividend
```

---

## 6. Cron jobs

### 6.1 Price + dividend cron
- **Route:** `POST /api/cron/prices`
- **Schedule:** `0 1 * * 1-5` (08:00 BKK = 01:00 UTC, Mon–Fri)
- **Skill:** `tools/skills/fetch-set50-prices.md`
- **Steps:**
  1. Load SET50 tickers from `src/lib/set50.ts`
  2. Batch fetch from Yahoo Finance — one request for all 50 tickers
  3. Compute `dividendYield = trailingAnnualDividendRate / regularMarketPrice * 100`
  4. Write `dividends.json` to Vercel Blob (powers public dividend table)
  5. Upsert `stocks` table in Supabase with `last_price` and `price_updated_at`
- **Auth:** `CRON_SECRET` header (Vercel sets automatically)
- **Error handling:** Log failures, do not throw — partial success is acceptable

### 6.2 News cron
- **Route:** `POST /api/cron/news`
- **Schedule:** `0 0 * * 1-5` (07:00 BKK = 00:00 UTC, Mon–Fri)
- **Skill:** `tools/skills/fetch-rss-news.md`
- **Steps:**
  1. Fetch and parse RSS from SET, BoT, กรุงเทพธุรกิจ, The Standard
  2. Filter: last 24h only
  3. Score by investment keywords: `ดอกเบี้ย`, `หุ้น`, `ปันผล`, `กนง`, `SET`, `พันธบัตร`, `กองทุน`
  4. Keep top 10 items
  5. Write as `news.json` to Vercel Blob — array of `{ title, excerpt, link, date, source, category }`
- **Auth:** `CRON_SECRET` header
- **No AI calls.** Raw RSS data only.

---

## 7. News JSON schema (Vercel Blob)

```json
[
  {
    "title": "...",
    "excerpt": "...",
    "link": "https://...",
    "date": "2026-05-29T07:00:00Z",
    "source": "กรุงเทพธุรกิจ",
    "category": "macro|equity|dividend|fund"
  }
]
```

News page reads `news.json` from Blob and renders cards. No MDX, no GitHub commits, no redeploy needed.

---

## 8. Auth flow

```
User visits /th/portfolio (auth-gated page)
  → Server component checks Supabase session (SSR cookie)
  → No session → redirect to /th/auth/signin
  → Sign in → Supabase sets session cookie
  → Redirect back to /th/portfolio
  → Server component fetches holdings from Supabase (RLS filters by user)
  → Compute metrics server-side
  → Render page
```

Supabase SSR pattern for Next.js App Router:
- Server client: `createServerClient` from `@supabase/ssr` — Server Components and Route Handlers
- Browser client: `createBrowserClient` from `@supabase/ssr` — Client Components only
- Session refreshed via middleware (`src/middleware.ts`)

---

## 9. Dark mode

Dark mode is implemented with `next-themes` (class strategy) + Tailwind CSS v4.

```
globals.css           → @custom-variant dark (&:where(.dark, .dark *))
[locale]/layout.tsx   → <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
components/layout/theme-toggle.tsx  → 'use client'; useTheme(); Sun/Moon toggle
header.tsx            → renders <ThemeToggle /> (desktop)
mobile-nav.tsx        → renders <ThemeToggle /> (mobile drawer)
```

- `next-themes` adds/removes the `dark` class on `<html>` based on user preference
- `defaultTheme="system"` — respects OS preference on first visit
- Toggle persists in `localStorage` across sessions
- `suppressHydrationWarning` on `<html>` prevents mismatch between server and client render
- `ThemeToggle` defers rendering until mounted to avoid hydration errors

## 10. Environment variables

| Variable | Used by | Notes |
|----------|---------|-------|
| `SUPABASE_URL` | All server code | Supabase project URL |
| `SUPABASE_ANON_KEY` | All server + browser code | Public anon key — safe to expose |
| `ADMIN_API_KEY` | Admin API routes | Keep secret |
| `CRON_SECRET` | Cron routes | Auto-set by Vercel |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob | Production only |

---

## 11. Scaling considerations (future)

Current architecture handles ~500–2,000 MAU comfortably within free tiers. If scale increases:
- Supabase free → Pro ($25/mo) when MAU approaches 50,000
- Vercel Blob free → Pro when storage approaches 1GB
- Yahoo Finance unofficial API → cache aggressively if rate-limited
- News cron: zero marginal cost regardless of user growth
- AI news summarisation: possible v2 addition as an opt-in feature, controlled via a separate cron with a daily call cap
