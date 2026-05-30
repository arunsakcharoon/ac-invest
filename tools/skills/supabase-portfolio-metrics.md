# Skill: supabase-portfolio-metrics

Pattern for querying user holdings from Supabase and computing all portfolio metrics server-side.

## Metric formulas (from ARCHITECTURE.md §5)

```
currentValue  = shares × stocks.last_price
gainLoss      = currentValue - (shares × cost_per_share)
gainLossPct   = gainLoss / (shares × cost_per_share) × 100
dividendYield = stocks.trailing_annual_dividend / stocks.last_price × 100
yieldOnCost   = stocks.trailing_annual_dividend / cost_per_share × 100
annualIncome  = shares × stocks.trailing_annual_dividend
```

Portfolio-level aggregates:
```
totalValue         = sum of currentValue across all holdings
totalCost          = sum of (shares × cost_per_share)
totalGainLoss      = totalValue - totalCost
blendedYieldOnCost = sum(annualIncome) / totalCost × 100
```

## Data source for trailing_annual_dividend
`stocks.trailing_annual_dividend` is written by the `/api/cron/prices` route every weekday at 08:00 BKK.
It equals `trailingAnnualDividendRate` from Yahoo Finance (e.g. 1.50 THB/share for PTT).

## Query pattern

```ts
// In a Server Component or Route Handler
import { createServerClient } from '@/lib/supabase-server'

const supabase = await createServerClient()

const { data: holdings } = await supabase
  .from('holdings')
  .select(`
    id, ticker, shares, cost_per_share, purchase_date,
    stocks ( ticker, name, sector, last_price, trailing_annual_dividend )
  `)
  .eq('portfolio_id', portfolioId)

// Map to HoldingWithMetrics
const rows = (holdings ?? []).map((h) => {
  const price = h.stocks?.last_price ?? 0
  const annualDiv = h.stocks?.trailing_annual_dividend ?? 0
  const costBasis = h.shares * h.cost_per_share
  const currentValue = h.shares * price
  const gainLoss = currentValue - costBasis

  return {
    ...h,
    stock: h.stocks,
    current_value: currentValue,
    gain_loss: gainLoss,
    gain_loss_pct: costBasis > 0 ? (gainLoss / costBasis) * 100 : 0,
    dividend_yield: price > 0 ? (annualDiv / price) * 100 : 0,
    yield_on_cost: h.cost_per_share > 0 ? (annualDiv / h.cost_per_share) * 100 : 0,
    annual_income: h.shares * annualDiv,
  }
})

// Portfolio-level summary
const totalValue = rows.reduce((s, r) => s + r.current_value, 0)
const totalCost  = rows.reduce((s, r) => s + r.shares * r.cost_per_share, 0)
const totalAnnualIncome = rows.reduce((s, r) => s + r.annual_income, 0)
const blendedYieldOnCost = totalCost > 0 ? (totalAnnualIncome / totalCost) * 100 : 0
```

## Types used
- `Holding`, `Stock`, `HoldingWithMetrics` from `src/lib/types.ts`
- `createServerClient` from `src/lib/supabase-server`

## RLS note
Holdings are filtered by `user_id` automatically via RLS policy — no need to add `.eq('user_id', ...)` manually.
