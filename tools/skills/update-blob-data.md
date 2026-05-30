# Skill: update-blob-data

Updates production JSON data in Vercel Blob by POSTing to the admin API. Use this to push new bond IPOs, dividend snapshots, or other Blob-backed content to production without a redeploy.

## When to use
- Publishing new bond IPO listings
- Pushing a manually corrected dividend snapshot
- Any time `content/*.json` changes need to be live in production

## Endpoints

| Data | Route | Body type |
|------|-------|-----------|
| Bonds | `POST /api/admin/bonds` | `BondIPO[]` |
| Dividends | `POST /api/admin/dividends` | `DividendRow[]` |

Both endpoints require `Authorization: Bearer <ADMIN_API_KEY>`.

## Steps

### 1. Prepare the JSON file
Edit the relevant file in `content/`:
- `content/bonds/bonds.json` → for bonds
- `content/dividends/set50-dividends.json` → for dividends

Validate against the TypeScript types in `src/lib/types.ts`.

### 2. Upload with curl (see tools/scripts/update-blob.sh)
```bash
# Bonds
curl -X POST https://your-app.vercel.app/api/admin/bonds \
  -H "Authorization: Bearer $ADMIN_API_KEY" \
  -H "Content-Type: application/json" \
  -d @content/bonds/bonds.json

# Dividends
curl -X POST https://your-app.vercel.app/api/admin/dividends \
  -H "Authorization: Bearer $ADMIN_API_KEY" \
  -H "Content-Type: application/json" \
  -d @content/dividends/set50-dividends.json
```

### 3. Verify
The response contains `{ "ok": true, "url": "https://..." }`. Check the Blob URL to confirm the content is live.

## Local development
In local dev, `BLOB_READ_WRITE_TOKEN` may not be set. The news, bonds, and dividends pages fall back gracefully to an empty array when the Blob URL returns 404. Use the JSON files in `content/` directly as the source of truth for local dev — the pages will serve them via `readBlob` once the env var is configured.

## Using the helper script
```bash
# Set env vars first
export ADMIN_API_KEY=your-key
export APP_URL=https://your-app.vercel.app

bash tools/scripts/update-blob.sh bonds
bash tools/scripts/update-blob.sh dividends
```
