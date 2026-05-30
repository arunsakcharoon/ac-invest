-- Shared stock reference (written by cron, read by all)
CREATE TABLE IF NOT EXISTS stocks (
  ticker           TEXT PRIMARY KEY,
  name             TEXT,
  sector           TEXT,
  last_price       DECIMAL(12,4),
  price_updated_at TIMESTAMPTZ
);

-- Dividend events (written by cron)
CREATE TABLE IF NOT EXISTS dividends (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticker           TEXT REFERENCES stocks(ticker),
  amount_per_share DECIMAL(10,4),
  ex_date          DATE,
  pay_date         DATE,
  frequency        TEXT
);

-- Users (mirrors auth.users)
CREATE TABLE IF NOT EXISTS users (
  id               UUID PRIMARY KEY,
  email            TEXT UNIQUE NOT NULL,
  full_name        TEXT,
  created_at       TIMESTAMPTZ DEFAULT now()
);

-- User portfolios
CREATE TABLE IF NOT EXISTS portfolios (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID REFERENCES users(id) ON DELETE CASCADE,
  name             TEXT DEFAULT 'My Portfolio',
  created_at       TIMESTAMPTZ DEFAULT now()
);

-- Individual holdings
CREATE TABLE IF NOT EXISTS holdings (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_id     UUID REFERENCES portfolios(id) ON DELETE CASCADE,
  ticker           TEXT REFERENCES stocks(ticker),
  shares           DECIMAL(14,4) NOT NULL,
  cost_per_share   DECIMAL(12,4) NOT NULL,
  purchase_date    DATE
);

-- Dividend income tracking
CREATE TABLE IF NOT EXISTS dividend_receipts (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  holding_id       UUID REFERENCES holdings(id) ON DELETE CASCADE,
  dividend_id      UUID REFERENCES dividends(id),
  amount_received  DECIMAL(12,4),
  received_date    DATE
);

-- Row-Level Security
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
