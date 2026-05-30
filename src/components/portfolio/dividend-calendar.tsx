import { getTranslations } from 'next-intl/server'
import { getDividendRows } from '@/lib/content'
import type { HoldingWithMetrics } from '@/lib/types'

interface DividendCalendarProps {
  holdings: HoldingWithMetrics[]
}

interface CalendarEntry {
  ticker: string
  name: string | null
  ex_date: string
  pay_date: string | null
  amount: number
  daysUntil: number
}

export default async function DividendCalendar({ holdings }: DividendCalendarProps) {
  const t = await getTranslations('portfolio')

  if (holdings.length === 0) return null

  const heldTickers = new Set(holdings.map((h) => h.ticker))
  const rows = await getDividendRows()
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const upcoming: CalendarEntry[] = rows
    .filter((r) => heldTickers.has(r.ticker) && r.ex_date)
    .map((r) => {
      const exDate = new Date(r.ex_date!)
      const daysUntil = Math.ceil((exDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      return {
        ticker: r.ticker,
        name: r.name,
        ex_date: r.ex_date!,
        pay_date: r.pay_date ?? null,
        amount: r.trailing_annual_dividend,
        daysUntil,
      }
    })
    .filter((e) => e.daysUntil >= 0 && e.daysUntil <= 90)
    .sort((a, b) => a.daysUntil - b.daysUntil)

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 mb-6">
      <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
        {t('dividendCalendar')} <span className="text-gray-400 font-normal">(90 วัน)</span>
      </h2>

      {upcoming.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">{t('noDividends')}</p>
      ) : (
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {upcoming.map((entry) => (
            <div key={`${entry.ticker}-${entry.ex_date}`} className="flex items-center justify-between py-2">
              <div>
                <span className="font-medium text-sm text-gray-900 dark:text-white">{entry.ticker}</span>
                {entry.name && (
                  <span className="text-xs text-gray-500 ml-2">{entry.name}</span>
                )}
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  XD: {entry.ex_date}
                  {entry.pay_date && <span> · Pay: {entry.pay_date}</span>}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs font-medium text-blue-600 dark:text-blue-400">
                  {t('daysUntil', { days: entry.daysUntil === 0 ? 'today' : entry.daysUntil })}
                </div>
                <div className="text-xs text-gray-500 tabular-nums">
                  ฿{entry.amount.toFixed(2)}/year
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
