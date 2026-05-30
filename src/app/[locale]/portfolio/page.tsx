import { redirect } from 'next/navigation'
import { getLocale, getTranslations } from 'next-intl/server'
import type { Metadata } from 'next'
import { createServerClient } from '@/lib/supabase-server'
import { getOrCreatePortfolio, getHoldings } from './actions'
import PortfolioSummary from '@/components/portfolio/portfolio-summary'
import SectorChart from '@/components/portfolio/sector-chart'
import HoldingsSection from '@/components/portfolio/holdings-section'
import DividendCalendar from '@/components/portfolio/dividend-calendar'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('metadata')
  return { title: t('portfolioDescription') }
}

export default async function PortfolioPage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  const locale = await getLocale()

  if (!user) {
    redirect(`/${locale}/auth/signin?next=/${locale}/portfolio`)
  }

  const t = await getTranslations('portfolio')

  const portfolio = await getOrCreatePortfolio()
  if (!portfolio) {
    redirect(`/${locale}/auth/signin`)
  }

  const holdings = await getHoldings(portfolio.id)
  const hasHoldings = holdings.length > 0

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        {t('title')}
      </h1>

      {/* Summary cards — only when there are holdings */}
      {hasHoldings && <PortfolioSummary holdings={holdings} />}

      {/* Sector + Calendar row */}
      {hasHoldings && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          <SectorChart holdings={holdings} />
          <DividendCalendar holdings={holdings} />
        </div>
      )}

      {/* Holdings table with add/edit/delete */}
      <HoldingsSection portfolioId={portfolio.id} initialHoldings={holdings} />
    </div>
  )
}
