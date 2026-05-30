import { NextRequest, NextResponse } from 'next/server'
import { XMLParser } from 'fast-xml-parser'
import { verifyCronSecret } from '@/lib/api-auth'
import { writeBlob } from '@/lib/data-store'
import type { NewsItem } from '@/lib/types'

// ─── Source config ──────────────────────────────────────────────────────────

const RSS_SOURCES: { url: string; source: string }[] = [
  { url: 'https://www.set.or.th/th/news/rss',                source: 'SET' },
  { url: 'https://www.bot.or.th/rss',                        source: 'ธนาคารแห่งประเทศไทย' },
  { url: 'https://www.bangkokbiznews.com/rss/finance.xml',   source: 'กรุงเทพธุรกิจ' },
  { url: 'https://thestandard.co/feed/',                     source: 'The Standard' },
]

// ─── Keyword lists ──────────────────────────────────────────────────────────

/** Any item matching ≥1 of these is considered investment-relevant */
const INVESTMENT_KEYWORDS = [
  'ดอกเบี้ย', 'หุ้น', 'ปันผล', 'กนง', 'SET', 'พันธบัตร', 'กองทุน',
  'ราคา', 'ตลาด', 'ลงทุน', 'นักลงทุน', 'เงินเฟ้อ', 'ค่าเงิน',
  'ETF', 'หลักทรัพย์', 'ผลกำไร', 'เงินปันผล', 'XD', 'หุ้นกู้',
  'ธนาคาร', 'stock', 'dividend', 'fund', 'market', 'invest',
]

/** Category determined by the first keyword group that matches */
const CATEGORY_KEYWORDS: Record<NewsItem['category'], string[]> = {
  dividend: ['ปันผล', 'เงินปันผล', 'XD', 'จ่ายปันผล', 'dividend'],
  fund:     ['กองทุน', 'ETF', 'กองทุนรวม', 'NAV', 'fund'],
  macro:    ['ดอกเบี้ย', 'กนง', 'เงินเฟ้อ', 'ค่าเงิน', 'GDP', 'เศรษฐกิจ', 'นโยบาย', 'ธนาคาร'],
  equity:   ['หุ้น', 'SET', 'ตลาดหลักทรัพย์', 'ดัชนี', 'Index', 'stock', 'market'],
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function stripHtml(html: string): string {
  return html
    .replace(/<!\[CDATA\[|\]\]>/g, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#\d+;/g, '')
    .replace(/&[a-z]+;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function scoreItem(text: string): number {
  const lower = text.toLowerCase()
  return INVESTMENT_KEYWORDS.reduce(
    (score, kw) => score + (lower.includes(kw.toLowerCase()) ? 1 : 0),
    0
  )
}

function categorise(text: string): NewsItem['category'] {
  const lower = text.toLowerCase()
  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS) as [NewsItem['category'], string[]][]) {
    if (keywords.some((kw) => lower.includes(kw.toLowerCase()))) return cat
  }
  return 'macro'
}

/** Parse an RSS 2.0 or Atom feed and return raw items */
function parseFeed(xml: string, sourceName: string): NewsItem[] {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    isArray: (tag) => tag === 'item' || tag === 'entry',
    cdataPropName: '__cdata',
  })

  let parsed: Record<string, unknown>
  try {
    parsed = parser.parse(xml) as Record<string, unknown>
  } catch {
    return []
  }

  // RSS 2.0
  const rssItems = (parsed?.rss as Record<string, unknown>)
    ?.channel as Record<string, unknown>
  const atomFeed = parsed?.feed as Record<string, unknown>

  const rawItems: Record<string, unknown>[] = (
    (rssItems?.item as Record<string, unknown>[]) ??
    (atomFeed?.entry as Record<string, unknown>[]) ??
    []
  )

  return rawItems.flatMap((item) => {
    try {
      // Title: may be plain string, CDATA object, or nested
      const rawTitle = item.title ?? ''
      const title = stripHtml(
        typeof rawTitle === 'object'
          ? String((rawTitle as Record<string, unknown>).__cdata ?? (rawTitle as Record<string, unknown>)['#text'] ?? '')
          : String(rawTitle)
      )

      // Link: RSS uses <link>, Atom uses <link href="...">
      const linkVal = item.link
      const link =
        typeof linkVal === 'string'
          ? linkVal
          : (linkVal as Record<string, unknown>)?.['@_href'] as string ?? ''

      // Excerpt: <description> (RSS) or <summary>/<content> (Atom)
      const rawDesc = item.description ?? item.summary ?? item['content:encoded'] ?? ''
      const excerpt = stripHtml(
        typeof rawDesc === 'object'
          ? String((rawDesc as Record<string, unknown>).__cdata ?? (rawDesc as Record<string, unknown>)['#text'] ?? '')
          : String(rawDesc)
      ).slice(0, 300)

      // Date: <pubDate> (RSS) or <updated>/<published> (Atom)
      const rawDate = item.pubDate ?? item.updated ?? item.published ?? ''
      const date = new Date(String(rawDate)).toISOString()

      // Skip items with invalid dates
      if (isNaN(new Date(date).getTime())) return []

      const combined = `${title} ${excerpt}`
      const score = scoreItem(combined)

      return [{
        title,
        excerpt,
        link: String(link),
        date,
        source: sourceName,
        category: categorise(combined),
        _score: score,
      } as NewsItem & { _score: number }]
    } catch {
      return []
    }
  })
}

// ─── Route handler ─────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  if (!verifyCronSecret(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const cutoff = Date.now() - 24 * 60 * 60 * 1000   // last 24 hours

  // ── 1. Fetch all RSS sources in parallel ──────────────────────────────────
  const fetches = await Promise.allSettled(
    RSS_SOURCES.map(async ({ url, source }) => {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; AC-Invest-Cron/1.0)' },
        signal: AbortSignal.timeout(10_000),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status} from ${source}`)
      const xml = await res.text()
      return { source, xml }
    })
  )

  const fetchErrors: string[] = []
  const allItems: (NewsItem & { _score: number })[] = []

  for (const result of fetches) {
    if (result.status === 'rejected') {
      const msg = String(result.reason)
      console.warn('[cron/news] Feed fetch failed:', msg)
      fetchErrors.push(msg)
      continue
    }
    const { source, xml } = result.value
    const items = parseFeed(xml, source) as (NewsItem & { _score: number })[]
    console.info(`[cron/news] ${source}: ${items.length} items parsed`)
    allItems.push(...items)
  }

  // ── 2. Filter: last 24h only ─────────────────────────────────────────────
  const recent = allItems.filter((item) => {
    try {
      return new Date(item.date).getTime() > cutoff
    } catch {
      return false
    }
  })

  // ── 3. Remove items with no investment keywords ───────────────────────────
  const relevant = recent.filter((item) => item._score > 0)

  // ── 4. Sort by score descending, keep top 10 ─────────────────────────────
  const top10 = relevant
    .sort((a, b) => b._score - a._score)
    .slice(0, 10)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    .map(({ _score, ...item }) => item)   // strip internal _score field

  // ── 5. Write news.json to Vercel Blob ─────────────────────────────────────
  let blobError: string | undefined

  try {
    await writeBlob('news.json', top10)
    console.info(`[cron/news] Wrote news.json (${top10.length} items)`)
  } catch (err) {
    blobError = String(err)
    console.error('[cron/news] Blob write failed:', err)
  }

  return NextResponse.json({
    ok: !blobError,
    total_fetched: allItems.length,
    recent_24h: recent.length,
    relevant: relevant.length,
    stored: top10.length,
    ...(fetchErrors.length > 0 && { fetch_errors: fetchErrors }),
    ...(blobError && { blob_error: blobError }),
  })
}
