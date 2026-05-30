-- Add trailing_annual_dividend to stocks so portfolio metrics can compute
-- yieldOnCost and annualIncome without a separate join to the dividends table.
-- Written by price cron each run; read by portfolio page.

ALTER TABLE stocks
  ADD COLUMN IF NOT EXISTS trailing_annual_dividend DECIMAL(10,4) DEFAULT 0;
