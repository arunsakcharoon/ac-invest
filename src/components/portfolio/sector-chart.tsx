'use client'

import { useTranslations } from 'next-intl'
import { useMemo } from 'react'
import type { HoldingWithMetrics } from '@/lib/types'

interface SectorChartProps {
  holdings: HoldingWithMetrics[]
}

const SECTOR_COLORS = [
  'bg-blue-500',
  'bg-purple-500',
  'bg-green-500',
  'bg-amber-500',
  'bg-rose-500',
  'bg-cyan-500',
  'bg-orange-500',
  'bg-teal-500',
]

export default function SectorChart({ holdings }: SectorChartProps) {
  const t = useTranslations('portfolio')

  const sectors = useMemo(() => {
    const map = new Map<string, number>()
    const total = holdings.reduce((s, h) => s + h.current_value, 0)

    for (const h of holdings) {
      const sector = h.stock.sector ?? 'Other'
      map.set(sector, (map.get(sector) ?? 0) + h.current_value)
    }

    return Array.from(map.entries())
      .map(([sector, value]) => ({
        sector,
        value,
        pct: total > 0 ? (value / total) * 100 : 0,
      }))
      .sort((a, b) => b.value - a.value)
  }, [holdings])

  if (holdings.length === 0) return null

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 mb-6">
      <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
        {t('sectorAllocation')}
      </h2>

      {/* Stacked bar */}
      <div className="flex h-5 rounded-full overflow-hidden mb-4 gap-px">
        {sectors.map(({ sector, pct }, i) => (
          <div
            key={sector}
            className={`${SECTOR_COLORS[i % SECTOR_COLORS.length]} transition-all`}
            style={{ width: `${pct}%` }}
            title={`${sector}: ${pct.toFixed(1)}%`}
          />
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {sectors.map(({ sector, pct }, i) => (
          <div key={sector} className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
            <span className={`inline-block w-2.5 h-2.5 rounded-full ${SECTOR_COLORS[i % SECTOR_COLORS.length]}`} />
            <span>{sector}</span>
            <span className="font-medium tabular-nums">{pct.toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}
