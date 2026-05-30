import { useTranslations } from 'next-intl'
import { formatThb, formatPct } from '@/lib/utils'
import type { HoldingWithMetrics } from '@/lib/types'

interface PortfolioSummaryProps {
  holdings: HoldingWithMetrics[]
}

export default function PortfolioSummary({ holdings }: PortfolioSummaryProps) {
  const t = useTranslations('portfolio')

  const totalValue = holdings.reduce((s, h) => s + h.current_value, 0)
  const totalCost = holdings.reduce((s, h) => s + h.shares * h.cost_per_share, 0)
  const totalGainLoss = totalValue - totalCost
  const totalGainLossPct = totalCost > 0 ? (totalGainLoss / totalCost) * 100 : 0
  const totalAnnualIncome = holdings.reduce((s, h) => s + h.annual_income, 0)
  const blendedYield = totalCost > 0 ? (totalAnnualIncome / totalCost) * 100 : 0

  const gainLossColor =
    totalGainLoss > 0
      ? 'text-green-600 dark:text-green-400'
      : totalGainLoss < 0
        ? 'text-red-600 dark:text-red-400'
        : 'text-gray-600 dark:text-gray-400'

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 mb-8">
      <SummaryCard label={t('totalValue')} value={formatThb(totalValue)} />
      <SummaryCard label={t('totalCost')} value={formatThb(totalCost)} />
      <SummaryCard
        label={t('totalGainLoss')}
        value={`${totalGainLoss >= 0 ? '+' : ''}${formatThb(totalGainLoss)}`}
        subValue={`${totalGainLoss >= 0 ? '+' : ''}${formatPct(totalGainLossPct)}`}
        valueClass={gainLossColor}
      />
      <SummaryCard label={t('annualDividendIncome')} value={formatThb(totalAnnualIncome)} />
      <SummaryCard
        label={t('blendedYield')}
        value={formatPct(blendedYield)}
        span
      />
    </div>
  )
}

function SummaryCard({
  label,
  value,
  subValue,
  valueClass,
  span,
}: {
  label: string
  value: string
  subValue?: string
  valueClass?: string
  span?: boolean
}) {
  return (
    <div
      className={`rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 ${span ? 'col-span-2 sm:col-span-1' : ''}`}
    >
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 truncate">{label}</p>
      <p className={`text-lg font-semibold tabular-nums ${valueClass ?? 'text-gray-900 dark:text-white'}`}>
        {value}
      </p>
      {subValue && (
        <p className={`text-sm tabular-nums ${valueClass ?? 'text-gray-500'}`}>{subValue}</p>
      )}
    </div>
  )
}
