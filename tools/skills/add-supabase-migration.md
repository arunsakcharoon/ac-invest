# Skill: add-supabase-migration

Generates a correctly numbered SQL migration file in `supabase/migrations/`. Use this for every schema change — new tables, new columns, indexes, RLS policies.

## When to use
- Adding a new table
- Adding a column to an existing table
- Adding an index for query performance
- Modifying or adding RLS policies
- Seeding reference data that belongs in the DB

## Steps

### 1. Find the next migration number
```bash
ls supabase/migrations/
# → 001_initial.sql
# Next: 002_your_description.sql
```

### 2. Create the file
```
supabase/migrations/{NNN}_{short_description}.sql
```
Naming: `NNN` is zero-padded to 3 digits; `short_description` is snake_case.

Examples:
- `002_indexes.sql`
- `003_add_watchlist.sql`
- `004_dividend_calendar.sql`

### 3. Write the SQL
Always use `IF NOT EXISTS` / `IF EXISTS` guards so migrations are idempotent:
```sql
-- Safe to re-run
CREATE INDEX IF NOT EXISTS idx_holdings_portfolio ON holdings(portfolio_id);
ALTER TABLE stocks ADD COLUMN IF NOT EXISTS consecutive_years INT DEFAULT 0;
```

### 4. Apply locally
```bash
# Option A: Supabase CLI
npx supabase db push

# Option B: Paste into Supabase SQL editor
# supabase.com → Project → SQL Editor → paste and run
```

### 5. Update ARCHITECTURE.md
Add a row to the "Migrations" table in ARCHITECTURE.md:
```
| 002_indexes.sql | Adds performance indexes on holdings and dividends |
```

## Important rules
- Never edit `001_initial.sql` after it has been applied — create a new migration instead
- Never drop columns without a transition plan — add `IF EXISTS` guards
- RLS policies must be re-created idempotently: `DROP POLICY IF EXISTS ... ; CREATE POLICY ...`
