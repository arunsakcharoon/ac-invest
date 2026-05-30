import { readBlob } from './data-store'
import type { DividendRow, BondIPO, NewsItem } from './types'

// Local JSON imports — used as fallback when NEXT_PUBLIC_BLOB_BASE_URL is not set (dev)
import localDividends from '../../content/dividends/set50-dividends.json'
import localBonds from '../../content/bonds/bonds.json'
import localNews from '../../content/news.json'

export async function getDividendRows(): Promise<DividendRow[]> {
  const blob = await readBlob<DividendRow[]>('dividends.json')
  if (blob && blob.length > 0) return blob
  return localDividends as DividendRow[]
}

export async function getBonds(): Promise<BondIPO[]> {
  const blob = await readBlob<BondIPO[]>('bonds.json')
  if (blob && blob.length > 0) return blob
  return localBonds as BondIPO[]
}

export async function getNews(): Promise<NewsItem[]> {
  const blob = await readBlob<NewsItem[]>('news.json')
  if (blob && blob.length > 0) return blob
  return localNews as NewsItem[]
}
