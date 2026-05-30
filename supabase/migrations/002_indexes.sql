-- Performance indexes for common query patterns

-- Portfolio page: list holdings for a given portfolio
CREATE INDEX IF NOT EXISTS idx_holdings_portfolio_id
  ON holdings(portfolio_id);

-- Portfolio page: join holdings → stocks by ticker
CREATE INDEX IF NOT EXISTS idx_holdings_ticker
  ON holdings(ticker);

-- Dividend calendar: find dividends by ticker and ex_date
CREATE INDEX IF NOT EXISTS idx_dividends_ticker
  ON dividends(ticker);

CREATE INDEX IF NOT EXISTS idx_dividends_ex_date
  ON dividends(ex_date DESC);

-- Dividend receipts: list receipts for a holding
CREATE INDEX IF NOT EXISTS idx_dividend_receipts_holding_id
  ON dividend_receipts(holding_id);

-- User lookup: portfolios for a user
CREATE INDEX IF NOT EXISTS idx_portfolios_user_id
  ON portfolios(user_id);

-- Stocks: sort by sector (sector filter on dividend table)
CREATE INDEX IF NOT EXISTS idx_stocks_sector
  ON stocks(sector);
