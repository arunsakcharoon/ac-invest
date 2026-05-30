'use server'

import { revalidatePath } from 'next/cache'
import { getLocale } from 'next-intl/server'
import { createServerClient } from '@/lib/supabase-server'
import type { Portfolio, HoldingWithMetrics } from '@/lib/types'

// ─── Portfolio helpers ───────────────────────────────────────────────────────

/** Returns the user's first portfolio, creating one if none exists. */
export async function getOrCreatePortfolio(): Promise<Portfolio | null> {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Try to find existing portfolio
  const { data: existing } = await supabase
    .from('portfolios')
    .select('id, user_id, name, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (existing) return existing as Portfolio

  // Create a new one
  const { data: created } = await supabase
    .from('portfolios')
    .insert({ user_id: user.id, name: 'My Portfolio' })
    .select('id, user_id, name, created_at')
    .single()

  return (created as Portfolio) ?? null
}

// ─── Holdings query ──────────────────────────────────────────────────────────

/** Fetches all holdings for the given portfolio and computes metrics. */
export async function getHoldings(portfolioId: string): Promise<HoldingWithMetrics[]> {
  const supabase = await createServerClient()

  const { data: holdings } = await supabase
    .from('holdings')
    .select(`
      id, ticker, shares, cost_per_share, purchase_date, portfolio_id,
      stocks ( ticker, name, sector, last_price, trailing_annual_dividend, price_updated_at )
    `)
    .eq('portfolio_id', portfolioId)

  if (!holdings) return []

  return holdings.map((h) => {
    const stock = (h.stocks as unknown as Record<string, unknown> | null) ?? {}
    const price = (stock.last_price as number | null) ?? 0
    const annualDiv = (stock.trailing_annual_dividend as number | null) ?? 0
    const costBasis = h.shares * h.cost_per_share
    const currentValue = h.shares * price
    const gainLoss = currentValue - costBasis

    return {
      id: h.id,
      portfolio_id: h.portfolio_id,
      ticker: h.ticker,
      shares: h.shares,
      cost_per_share: h.cost_per_share,
      purchase_date: h.purchase_date ?? null,
      stock: {
        ticker: (stock.ticker as string | null) ?? h.ticker,
        name: (stock.name as string | null) ?? null,
        sector: (stock.sector as string | null) ?? null,
        last_price: price,
        trailing_annual_dividend: annualDiv,
        price_updated_at: (stock.price_updated_at as string | null) ?? null,
      },
      current_value: currentValue,
      gain_loss: gainLoss,
      gain_loss_pct: costBasis > 0 ? (gainLoss / costBasis) * 100 : 0,
      dividend_yield: price > 0 ? (annualDiv / price) * 100 : 0,
      yield_on_cost: h.cost_per_share > 0 ? (annualDiv / h.cost_per_share) * 100 : 0,
      annual_income: h.shares * annualDiv,
    } as HoldingWithMetrics
  })
}

// ─── Server Actions (mutate + revalidate) ────────────────────────────────────

export type HoldingFormData = {
  ticker: string
  shares: number
  cost_per_share: number
  purchase_date: string | null
}

export async function addHolding(
  portfolioId: string,
  data: HoldingFormData
): Promise<{ error?: string }> {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { error } = await supabase.from('holdings').insert({
    portfolio_id: portfolioId,
    ticker: data.ticker.toUpperCase().trim(),
    shares: data.shares,
    cost_per_share: data.cost_per_share,
    purchase_date: data.purchase_date || null,
  })

  if (error) return { error: error.message }

  const locale = await getLocale()
  revalidatePath(`/${locale}/portfolio`)
  return {}
}

export async function updateHolding(
  holdingId: string,
  data: HoldingFormData
): Promise<{ error?: string }> {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { error } = await supabase
    .from('holdings')
    .update({
      ticker: data.ticker.toUpperCase().trim(),
      shares: data.shares,
      cost_per_share: data.cost_per_share,
      purchase_date: data.purchase_date || null,
    })
    .eq('id', holdingId)

  if (error) return { error: error.message }

  const locale = await getLocale()
  revalidatePath(`/${locale}/portfolio`)
  return {}
}

export async function deleteHolding(holdingId: string): Promise<{ error?: string }> {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { error } = await supabase
    .from('holdings')
    .delete()
    .eq('id', holdingId)

  if (error) return { error: error.message }

  const locale = await getLocale()
  revalidatePath(`/${locale}/portfolio`)
  return {}
}
