#!/usr/bin/env bash
# Usage: bash tools/scripts/update-blob.sh <bonds|dividends>
#
# Requires env vars:
#   ADMIN_API_KEY — secret key for the admin API
#   APP_URL       — production URL e.g. https://ac-invest.vercel.app
#
# Example:
#   ADMIN_API_KEY=xxx APP_URL=https://ac-invest.vercel.app bash tools/scripts/update-blob.sh bonds

set -euo pipefail

RESOURCE="${1:-}"

if [[ -z "$RESOURCE" ]]; then
  echo "Usage: $0 <bonds|dividends>"
  exit 1
fi

if [[ -z "${ADMIN_API_KEY:-}" || -z "${APP_URL:-}" ]]; then
  echo "Error: ADMIN_API_KEY and APP_URL must be set"
  exit 1
fi

case "$RESOURCE" in
  bonds)
    FILE="content/bonds/bonds.json"
    ENDPOINT="$APP_URL/api/admin/bonds"
    ;;
  dividends)
    FILE="content/dividends/set50-dividends.json"
    ENDPOINT="$APP_URL/api/admin/dividends"
    ;;
  *)
    echo "Unknown resource: $RESOURCE. Use 'bonds' or 'dividends'."
    exit 1
    ;;
esac

if [[ ! -f "$FILE" ]]; then
  echo "File not found: $FILE"
  exit 1
fi

echo "Uploading $FILE → $ENDPOINT"

RESPONSE=$(curl -s -w "\n%{http_code}" \
  -X POST "$ENDPOINT" \
  -H "Authorization: Bearer $ADMIN_API_KEY" \
  -H "Content-Type: application/json" \
  -d "@$FILE")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [[ "$HTTP_CODE" == "200" ]]; then
  echo "✓ Success"
  echo "$BODY" | grep -o '"url":"[^"]*"' || echo "$BODY"
else
  echo "✗ Failed (HTTP $HTTP_CODE)"
  echo "$BODY"
  exit 1
fi
