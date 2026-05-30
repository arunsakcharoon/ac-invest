# Skill: fetch-set50-prices

Fetches current prices and dividend data for all SET50 tickers from Yahoo Finance, updates Vercel Blob, and upserts the Supabase `stocks` table.

## Route
`POST /api/cron/prices`
Protected by `Authorization: Bearer <CRON_SECRET>` header (set automatically by Vercel).

## Yahoo Finance endpoint

```
GET https://query1.finance.yahoo.com/v7/finance/quote
  ?symbols=PTT.BK,KBANK.BK,...   (all 50 in one request from SET50_TICKERS)
  &fields=regularMarketPrice,trailingAnnualDividendRate,longName,shortName,sector,dividendDate
  &formatted=false
  &corsDomain=finance.yahoo.com
```

- No API key required
- Thai tickers use `.BK` suffix (from `src/lib/set50.ts`)
- Timeout: 20 seconds (`AbortSignal.timeout(20_000)`)
- On complete failure: return HTTP 502, do not silently continue
- On per-ticker failure: log and skip, do not halt processing

## Response shape

```ts
interface YahooQuote {
  symbol: string                      // e.g. "PTT.BK"
  longName?: string
  shortName?: string
  regularMarketPrice?: number         // current price in THB
  trailingAnnualDividendRate?: number // annual dividend per share in THB
  sector?: string                     // English sector name from Yahoo
  dividendDate?: number               // Unix timestamp (seconds) of most recent ex-date
}
```

## Computed fields

```ts
// Strip .BK suffix for internal ticker
ticker = q.symbol.replace('.BK', '')

// Core formula (ARCHITECTURE.md §5)
dividendYield = (trailingAnnualDividendRate / regularMarketPrice) × 100
              = Math.round((annualDiv / price) * 10_000) / 100   // 2 dp

// ex_date from dividendDate Unix timestamp
exDate = new Date(dividendDate * 1000).toISOString().split('T')[0]  // YYYY-MM-DD
```

## Frequency inference

Yahoo Finance does not expose payment frequency in the basic quote endpoint.
The route uses a static `inferFrequency(ticker)` helper with known SET50 patterns:
- `QUARTERLY_TICKERS`: SCC, TISCO, KTC, MTC
- `SEMI_ANNUAL_TICKERS`: ADVANC, KBANK, SCB, CPALL, GULF, BBL, KTB, BAY, etc.
- Everything else defaults to `'annual'`

Update these sets in the route file when a company changes its frequency.

## Output

### 1. Vercel Blob — `dividends.json`
Array of `DividendRow[]` sorted by `dividend_yield` descending.
Written via `writeBlob('dividends.json', sorted)` from `src/lib/data-store.ts`.

### 2. Supabase — `stocks` table upsert
```ts
supabase.from('stocks').upsert(stockRows, { onConflict: 'ticker' })
```
Columns written: `ticker`, `name`, `sector`, `last_price`, `trailing_annual_dividend`, `price_updated_at`.
Requires migration `003_stocks_dividend_column.sql` to have been applied.

## Error handling
- Yahoo fetch failure → return 502 (Vercel will retry)
- Blob write failure → logged, included in response `errors[]`, non-fatal
- Supabase upsert failure → logged, included in response `errors[]`, non-fatal (Blob already written)
- Per-ticker parse error → logged and skipped

## Response
```json
{
  "ok": true,
  "processed": 50,
  "updated_at": "2026-05-29T01:00:00.000Z",
  "errors": []   // only present if partial failures occurred
}
```

## Cron schedule
`0 1 * * 1-5` — 08:00 Bangkok time (UTC+7), Monday–Friday

## Testing locally
```bash
curl -X POST http://localhost:3000/api/cron/prices \
  -H "Authorization: Bearer your-cron-secret"
```
