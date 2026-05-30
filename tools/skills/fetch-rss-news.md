# Skill: fetch-rss-news

Fetches RSS feeds from Thai financial news sources, scores items by investment relevance, and stores the top 10 to Vercel Blob as `news.json`.

## Route
`POST /api/cron/news`
Protected by `Authorization: Bearer <CRON_SECRET>` header (set automatically by Vercel).

## RSS sources

| Source | URL | Format |
|--------|-----|--------|
| SET | `https://www.set.or.th/th/news/rss` | RSS 2.0 |
| ธนาคารแห่งประเทศไทย | `https://www.bot.or.th/rss` | RSS 2.0 |
| กรุงเทพธุรกิจ | `https://www.bangkokbiznews.com/rss/finance.xml` | RSS 2.0 |
| The Standard | `https://thestandard.co/feed/` | RSS 2.0 (WordPress) |

Add new sources to the `RSS_SOURCES` array at the top of the route file.

## Processing pipeline

```
Fetch (parallel, 10s timeout each)
  → parseFeed()        — XMLParser, handles RSS 2.0 + Atom, strips HTML/CDATA
  → filter: last 24h
  → filter: score > 0  — must contain ≥1 investment keyword
  → sort by score desc
  → slice top 10
  → writeBlob('news.json')
```

## XML parsing

Uses `fast-xml-parser` (v5) with:
```ts
new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  isArray: (tag) => tag === 'item' || tag === 'entry',
  cdataPropName: '__cdata',
})
```

Handles both RSS 2.0 (`<channel><item>`) and Atom (`<feed><entry>`).
Atom `<link href="...">` is extracted via `@_href` attribute.

## Keyword scoring

Each item scores 1 point per matching investment keyword found in `title + excerpt`:
```
ดอกเบี้ย หุ้น ปันผล กนง SET พันธบัตร กองทุน ราคา ตลาด ลงทุน
นักลงทุน เงินเฟ้อ ค่าเงิน ETF หลักทรัพย์ ผลกำไร เงินปันผล XD
หุ้นกู้ ธนาคาร stock dividend fund market invest
```

Items with score = 0 are discarded regardless of recency.

## Categorisation

Assigned from the first category whose keywords match (checked in order):
1. `dividend` — ปันผล, เงินปันผล, XD, dividend
2. `fund`     — กองทุน, ETF, กองทุนรวม, NAV, fund
3. `macro`    — ดอกเบี้ย, กนง, เงินเฟ้อ, ค่าเงิน, GDP, เศรษฐกิจ, นโยบาย, ธนาคาร
4. `equity`   — หุ้น, SET, ตลาดหลักทรัพย์, ดัชนี, stock, market

Fallback: `macro`.

## Output — `news.json` schema

```ts
interface NewsItem {
  title:    string
  excerpt:  string          // stripped HTML, max 300 chars
  link:     string
  date:     string          // ISO 8601
  source:   string          // source label
  category: 'macro' | 'equity' | 'dividend' | 'fund'
}
```

## Response
```json
{
  "ok": true,
  "total_fetched": 87,
  "recent_24h": 34,
  "relevant": 22,
  "stored": 10,
  "fetch_errors": []    // per-source failures; partial success is acceptable
}
```

## Error handling
- Per-source fetch failure: logged, skipped — other sources continue
- Blob write failure: `ok: false`, included as `blob_error`
- Parse errors per item: silently skipped

## Cron schedule
`0 0 * * 1-5` — 07:00 Bangkok time (UTC+7), Monday–Friday

## Testing locally
```bash
curl -X POST http://localhost:3000/api/cron/news \
  -H "Authorization: Bearer your-cron-secret"
```

## Adding a new source
1. Add entry to `RSS_SOURCES` in the route file
2. Confirm it serves RSS 2.0 or Atom XML
3. No other changes needed — the parser handles both formats
