# AC Invest — Product Requirements Document

**Version:** 1.1
**Last updated:** May 2026
**Status:** Active development

---

## 1. Product overview

AC Invest is a free, bilingual (Thai/English) Progressive Web App that gives Thai retail investors — primarily retirees and salary workers — accessible, reliable investment data without ads, paywalls, or complicated interfaces.

Revenue model: voluntary donation. No Premium tier. No advertising.

---

## 2. Target users

**Primary:** Thai retail investors — retirees and salary workers
- Not finance professionals
- Want simple, trustworthy data in Thai
- Investing for income (dividends) or capital preservation
- Low tolerance for complexity; high trust sensitivity

**Secondary:** Independent financial advisors and planners
- Need quick reference data
- May use portfolio tracking for client discussions

---

## 3. Core principles

1. **Free by default** — every feature is free; donations are optional
2. **No paid APIs** — all data sourced from free endpoints; yield computed server-side
3. **Thai first** — default language Thai; English available at `/en/...`
4. **Simple over complete** — three focused sections, not a Bloomberg terminal
5. **No ads** — ever
6. **Comfortable to read** — dark/light mode toggle in header; system preference respected by default

---

## 4. Features

### 4.1 SET50 Dividend Yields

**Goal:** Show dividend yield for all SET50 stocks, updated daily.

**Public (no sign-in):**
- Preview table showing top 3 rows (yield, XD date, frequency)
- Rows 4–50 blurred with sign-up prompt

**Signed-in:**
- Full SET50 table
- Sortable by yield, sector, XD date, consecutive years
- Sector filter
- Search by ticker

**Data source:** Yahoo Finance unofficial API (free, no key) + SET website
**Computation:** `dividendYield = trailingAnnualDividendRate / regularMarketPrice * 100` — calculated server-side by daily cron
**Update frequency:** Once daily, 08:00 Bangkok time, weekdays only

---

### 4.2 My Portfolio

**Goal:** Let signed-in users track their holdings, cost basis, and dividend income.

**Requires sign-in.** Unauthenticated users see a locked state with sign-up prompt.

**Features:**
- Add/edit/remove holdings (ticker, shares, cost per share, purchase date)
- Auto-computed metrics per holding:
  - Current value (shares × last_price from Supabase)
  - Gain/loss in THB and %
  - Yield on Cost (annual dividend / cost per share)
- Portfolio summary:
  - Total value
  - Total gain/loss
  - Blended yield on cost
  - Dividends received this year (from dividend_receipts)
- Sector allocation bar chart (computed client-side)
- Dividend calendar — upcoming XD dates for held stocks

**No broker integration.** Users enter holdings manually.

---

### 4.3 Daily Investment News

**Goal:** Surface relevant Thai investment news every morning from trusted free sources.

**Public (no sign-in required).**

**Features:**
- 3–10 news items per day, fetched at 07:00 Bangkok time weekdays
- Each item: title, excerpt, source, link, published date
- Categories: มหภาค (macro), หุ้น (equity), ปันผล (dividend), กองทุน (fund)
- Items ranked by investment keyword relevance score
- Links open original source article

**Pipeline:** RSS feeds (SET, BoT, กรุงเทพธุรกิจ, The Standard) → keyword score → top items stored as `news.json` in Vercel Blob → news page reads Blob

**No AI generation.** Raw RSS items displayed directly — title, excerpt, and link from the source.

---

### 4.4 Donation

**Goal:** Sustainable revenue without ads or paywalls.

**Features:**
- Donation strip on landing page
- Preset amounts: ฿49, ฿99, ฿199, ฿499
- Custom amount input
- PromptPay QR / number displayed
- Optional card payment integration (future)

---

## 5. Auth

**Provider:** Supabase Auth (email + password, free tier)
**Sign-up:** Email, full name, password
**Sign-in:** Email + password
**Session:** Supabase SSR session cookies for Next.js App Router

**Auth-gated features:**
- Full SET50 dividend table (rows 4–50)
- My Portfolio (all features)

**Public features:**
- Dividend table preview (rows 1–3)
- All news items
- Landing page

---

## 6. Non-goals (v1)

The following are explicitly out of scope for v1:

- Social login (Google, LINE) — may add in v2
- Stock price charts or historical data
- Bond trading or execution
- Push notifications (PWA notifications future)
- Automated dividend receipt tracking (manual entry only in v1)
- Mobile app (PWA covers this)
- Any paid data vendor integration
- AI-generated or AI-summarised news content

---

## 7. Success metrics

| Metric | Target (3 months post-launch) |
|--------|-------------------------------|
| Registered users | 500+ |
| Daily active users | 100+ |
| Monthly donations | ฿2,000+ |
| Cron job success rate | >95% weekdays |

---

## 8. Open questions

- Card payment provider for donations (Omise vs Stripe Thailand)
- Whether to add LINE Login in v2
- Dividend receipt auto-population from cron (v2 consideration)
- AI news summarisation as an opt-in v2 feature (Thai/English toggle)
