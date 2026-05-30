// Database row types (match Supabase schema in migrations/001_initial.sql)

export interface Stock {
  ticker: string
  name: string | null
  sector: string | null
  last_price: number | null
  trailing_annual_dividend: number | null
  price_updated_at: string | null
}

export interface Dividend {
  id: string
  ticker: string
  amount_per_share: number
  ex_date: string
  pay_date: string | null
  frequency: 'annual' | 'semi-annual' | 'quarterly' | string
}

export interface Portfolio {
  id: string
  user_id: string
  name: string
  created_at: string
}

export interface Holding {
  id: string
  portfolio_id: string
  ticker: string
  shares: number
  cost_per_share: number
  purchase_date: string | null
}

export interface DividendReceipt {
  id: string
  holding_id: string
  dividend_id: string | null
  amount_received: number
  received_date: string
}

// Computed metrics (never stored, always derived at query time)
export interface HoldingWithMetrics extends Holding {
  stock: Stock
  current_value: number
  gain_loss: number
  gain_loss_pct: number
  dividend_yield: number
  yield_on_cost: number
  annual_income: number
}

// Vercel Blob JSON schemas

export interface DividendRow {
  ticker: string
  name: string
  sector: string
  last_price: number
  trailing_annual_dividend: number
  dividend_yield: number
  ex_date: string | null
  pay_date: string | null
  frequency: string
  updated_at: string
}

export interface BondIPO {
  id: string
  name: string
  issuer: string
  coupon_rate: number
  maturity_date: string
  offer_start: string
  offer_end: string
  min_investment: number
  rating: string | null
  link: string | null
}

export interface NewsItem {
  title: string
  excerpt: string
  link: string
  date: string
  source: string
  category: 'macro' | 'equity' | 'dividend' | 'fund'
}
