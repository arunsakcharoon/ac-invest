import { NextRequest, NextResponse } from 'next/server'
import { verifyCronSecret } from '@/lib/api-auth'
import { writeBlob } from '@/lib/data-store'
import { createServerClient } from '@/lib/supabase-server'
import { SET50_TICKERS } from '@/lib/set50'
import type { DividendRow } from '@/lib/types'

// ─── Yahoo Finance types ────────────────────────────────────────────────────

interface YahooQuote {
  symbol: string
  shortName?: string
  longName?: string
  regularMarketPrice?: number
  trailingAnnualDividendRate?: number
  sector?: string
  dividendDate?: number   // Unix timestamp (seconds) — most recent ex-dividend date
}

interface YahooResponse {
  quoteResponse?: {
    result: YahooQuote[]
    error: unknown
  }
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Convert a Yahoo Finance Unix timestamp (seconds) to YYYY-MM-DD, or null. */
function unixToDate(ts: number | undefined): string | null {
  if (!ts) return null
  return new Date(ts * 1000).toISOString().split('T')[0]
}

/** Infer payment frequency from the ticker using known SET50 patterns.
 *  Yahoo Finance does not expose frequency directly via the quote endpoint.
 *  This heuristic can be overridden by a manual seed update. */
const QUARTERLY_TICKERS = new Set(['SCC', 'TISCO', 'KTC', 'MTC'])
const SEMI_ANNUAL_TICKERS = new Set([
  'ADVANC', 'KBANK', 'SCB', 'CPALL', 'GULF', 'BBL', 'KTB', 'BAY',
  'INTUCH', 'DELTA', 'HMPRO', 'CPN', 'BH', 'BDMS', 'MINT', 'CENTEL',
  'BTS', 'TTB', 'LH', 'AWC',
])

function inferFrequency(ticker: string): 'annual' | 'semi-annual' | 'quarterly' {
  if (QUARTERLY_TICKERS.has(ticker)) return 'quarterly'
  if (SEMI_ANNUAL_TICKERS.has(ticker)) return 'semi-annual'
  return 'annual'
}

// ─── Route handler ─────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  if (!verifyCronSecret(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // ── 1. Batch-fetch all SET50 tickers from Yahoo Finance ─────────────────
  const symbols = SET50_TICKERS.join(',')
  const fields = [
    'regularMarketPrice',
    'trailingAnnualDividendRate',
    'longName',
    'shortName',
    'sector',
    'dividendDate',
  ].join(',')

  const yahooUrl =
    `https://query1.finance.yahoo.com/v7/finance/quote` +
    `?symbols=${encodeURIComponent(symbols)}` +
    `&fields=${fields}` +
    `&formatted=false` +
    `&corsDomain=finance.yahoo.com`

  let quotes: YahooQuote[] = []

  try {
    const res = await fetch(yahooUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; AC-Invest-Cron/1.0)',
        Accept: 'application/json',
      },
      signal: AbortSignal.timeout(20_000),
    })

    if (!res.ok) {
      throw new Error(`Yahoo Finance responded with HTTP ${res.status}`)
    }

    const json: YahooResponse = await res.json()
    quotes = json?.quoteResponse?.result ?? []

    if (quotes.length === 0) {
      console.warn('[cron/prices] Yahoo returned 0 quotes — rate-limited or API change?')
    }
  } catch (err) {
    console.error('[cron/prices] Fetch failed:', err)
    return NextResponse.json({ ok: false, error: String(err) }, { status: 502 })
  }

  // ── 2. Build DividendRow[] + stock upsert rows ───────────────────────────
  const now = new Date().toISOString()

  const dividendRows: DividendRow[] = []
  const stockRows: {
    ticker: string
    name: string | null
    sector: string | null
    last_price: number
    trailing_annual_dividend: number
    price_updated_at: string
  }[] = []

  const errors: string[] = []

  for (const q of quotes) {
    try {
      const ticker = q.symbol.replace('.BK', '')
      const price = q.regularMarketPrice ?? 0
      const annualDiv = q.trailingAnnualDividendRate ?? 0

      // dividendYield = trailingAnnualDividendRate / regularMarketPrice × 100
      const yieldPct = price > 0 ? Math.round((annualDiv / price) * 10_000) / 100 : 0

      dividendRows.push({
        ticker,
        name: q.longName ?? q.shortName ?? ticker,
        sector: q.sector ?? '',
        last_price: price,
        trailing_annual_dividend: annualDiv,
        dividend_yield: yieldPct,
        ex_date: unixToDate(q.dividendDate),
        pay_date: null,   // not available from basic quote endpoint
        frequency: inferFrequency(ticker),
        updated_at: now,
      })

      stockRows.push({
        ticker,
        name: q.longName ?? q.shortName ?? null,
        sector: q.sector ?? null,
        last_price: price,
        trailing_annual_dividend: annualDiv,
        price_updated_at: now,
      })
    } catch (err) {
      const msg = `Failed to process ${q.symbol}: ${err}`
      console.error('[cron/prices]', msg)
      errors.push(msg)
    }
  }

  // ── 3. Write dividends.json to Vercel Blob ───────────────────────────────
  // Sort by yield descending so the public table shows highest yields first
  const sorted = dividendRows.sort((a, b) => b.dividend_yield - a.dividend_yield)

  try {
    await writeBlob('dividends.json', sorted)
    console.info(`[cron/prices] Wrote dividends.json (${sorted.length} rows)`)
  } catch (err) {
    const msg = `Blob write failed: ${err}`
    console.error('[cron/prices]', msg)
    errors.push(msg)
  }

  // ── 4. Upsert stocks table in Supabase ───────────────────────────────────
  try {
    const supabase = await createServerClient()
    const { error } = await supabase
      .from('stocks')
      .upsert(stockRows, { onConflict: 'ticker' })

    if (error) throw error
    console.info(`[cron/prices] Upserted ${stockRows.length} stocks in Supabase`)
  } catch (err) {
    const msg = `Supabase upsert failed: ${err}`
    console.error('[cron/prices]', msg)
    errors.push(msg)
    // Non-fatal: Blob is already written, public table still works
  }

  return NextResponse.json({
    ok: true,
    processed: dividendRows.length,
    updated_at: now,
    ...(errors.length > 0 && { errors }),
  })
}
