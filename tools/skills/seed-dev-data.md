# Skill: seed-dev-data

Populates `content/*.json` files with realistic local development data so pages render meaningful content without hitting the admin API or Vercel Blob.

## When to use
- Setting up a fresh local dev environment
- Adding new fields to a JSON schema (add matching values to seed data)
- Testing UI with realistic Thai financial data

## Files to seed

| File | Type | Purpose |
|------|------|---------|
| `content/dividends/set50-dividends.json` | `DividendRow[]` | Powers dividend yield table in dev |
| `content/bonds/bonds.json` | `BondIPO[]` | Powers bond IPO list in dev |
| `content/news.json` | `NewsItem[]` | Powers news page in dev (create this file) |

## Steps

### 1. Edit the JSON file directly
Use the TypeScript types in `src/lib/types.ts` as the schema reference.

### 2. Thai ticker format
- SET tickers: no suffix in JSON data (e.g., `"PTT"`, `"KBANK"`)
- Yahoo Finance fetches use `.BK` suffix — that's only in `src/lib/set50.ts`

### 3. Realistic values for DividendRow
```json
{
  "ticker": "PTT",
  "name": "บริษัท ปตท. จำกัด (มหาชน)",
  "sector": "พลังงาน",
  "last_price": 32.50,
  "trailing_annual_dividend": 1.50,
  "dividend_yield": 4.62,
  "ex_date": "2025-04-25",
  "pay_date": "2025-05-15",
  "frequency": "annual",
  "updated_at": "2026-05-29T01:00:00Z"
}
```

### 4. Verify locally
```bash
npm run dev
```
Open `http://localhost:3000/th/dividends` — the table should show your seeded data.

## Notes
- Dev data is committed to the repo and visible to contributors — use realistic but non-sensitive values
- Do NOT use personal portfolio data as seed data
- When the `NEXT_PUBLIC_BLOB_BASE_URL` env var is not set, `readBlob` returns `null` and pages show empty state — this is expected in dev unless you point it at your Blob store
