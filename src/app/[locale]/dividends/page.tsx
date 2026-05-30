import { getTranslations } from 'next-intl/server'
import type { Metadata } from 'next'
import { createServerClient } from '@/lib/supabase-server'
import { getDividendRows } from '@/lib/content'
import DividendTable from '@/components/dividends/dividend-table'
import DividendPreview from '@/components/dividends/dividend-preview'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('dividends')
  return {
    title: t('title'),
    description: (await getTranslations('metadata'))('dividendsDescription'),
  }
}

export default async function DividendsPage() {
  const [rows, t] = await Promise.all([
    getDividendRows(),
    getTranslations('dividends'),
  ])

  let user = null
  try {
    const supabase = await createServerClient()
    const { data } = await supabase.auth.getUser()
    user = data.user
  } catch {
    // Supabase not configured — show public preview
  }

  // Sort by yield descending as the default server-side sort
  const sorted = [...rows].sort((a, b) => b.dividend_yield - a.dividend_yield)

  // Unique sectors for the filter dropdown (authenticated table only)
  const sectors = [...new Set(sorted.map((r) => r.sector).filter(Boolean))].sort()

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-1">{t('title')}</h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{t('subtitle')}</p>

      {user ? (
        <DividendTable rows={sorted} sectors={sectors} />
      ) : (
        <DividendPreview rows={sorted.slice(0, 3)} totalCount={sorted.length} />
      )}
    </div>
  )
}
