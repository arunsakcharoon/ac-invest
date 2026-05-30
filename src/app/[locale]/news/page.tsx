import { getTranslations } from 'next-intl/server'
import type { Metadata } from 'next'
import { ExternalLink } from 'lucide-react'
import { getNews } from '@/lib/content'
import type { NewsItem } from '@/lib/types'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('news')
  return {
    title: t('title'),
    description: (await getTranslations('metadata'))('newsDescription'),
  }
}

// ── Category badge ────────────────────────────────────────────────────────────

const CATEGORY_STYLES: Record<NewsItem['category'], string> = {
  macro:    'bg-gray-100  dark:bg-gray-800  text-gray-600  dark:text-gray-300',
  equity:   'bg-blue-50   dark:bg-blue-950/40  text-blue-700  dark:text-blue-300',
  dividend: 'bg-green-50  dark:bg-green-950/40 text-green-700 dark:text-green-300',
  fund:     'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300',
}

function CategoryBadge({ category, label }: { category: NewsItem['category']; label: string }) {
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${CATEGORY_STYLES[category]}`}>
      {label}
    </span>
  )
}

// ── Relative date ─────────────────────────────────────────────────────────────

function relativeDate(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const h = Math.floor(diff / 3_600_000)
  const d = Math.floor(diff / 86_400_000)
  if (h < 1)  return 'เมื่อกี้'
  if (h < 24) return `${h} ชม. ที่แล้ว`
  if (d < 7)  return `${d} วันที่แล้ว`
  return new Date(dateStr).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function NewsPage() {
  const t = await getTranslations('news')
  const items = await getNews()

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{t('title')}</h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">{t('subtitle')}</p>

      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-700 py-16 text-center">
          <p className="text-gray-500 dark:text-gray-400">{t('noNews')}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((item, i) => (
            <a
              key={i}
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col gap-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm transition-all"
            >
              {/* Meta row */}
              <div className="flex items-center gap-2 flex-wrap">
                <CategoryBadge category={item.category} label={t(item.category)} />
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">{item.source}</span>
                <span className="text-xs text-gray-400 dark:text-gray-500">·</span>
                <span className="text-xs text-gray-400 dark:text-gray-500">{relativeDate(item.date)}</span>
              </div>

              {/* Title */}
              <p className="text-sm font-semibold text-gray-900 dark:text-white leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {item.title}
              </p>

              {/* Excerpt */}
              {item.excerpt && (
                <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">
                  {item.excerpt}
                </p>
              )}

              {/* Read more */}
              <div className="flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400 mt-0.5">
                {t('readMore')}
                <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
