'use client'

import { useState, useMemo } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import type { DividendRow } from '@/lib/types'
import FrequencyBadge from './frequency-badge'

type SortCol = 'ticker' | 'dividend_yield' | 'last_price' | 'trailing_annual_dividend' | 'ex_date' | 'sector'
type SortDir = 'asc' | 'desc'

type Props = {
  rows: DividendRow[]
  sectors: string[]
}

function formatDate(dateStr: string | null, locale: string): string {
  if (!dateStr) return '—'
  return new Intl.DateTimeFormat(locale === 'th' ? 'th-TH' : 'en-GB', {
    day: 'numeric',
    month: 'short',
    year: '2-digit',
  }).format(new Date(dateStr))
}

function SortIcon({ col, sortCol, sortDir }: { col: SortCol; sortCol: SortCol; sortDir: SortDir }) {
  if (sortCol !== col) return <span className="ml-1 text-muted-foreground/40">↕</span>
  return <span className="ml-1">{sortDir === 'asc' ? '↑' : '↓'}</span>
}

export default function DividendTable({ rows, sectors }: Props) {
  const t = useTranslations('dividends')
  const locale = useLocale()

  const [sortCol, setSortCol] = useState<SortCol>('dividend_yield')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [sector, setSector] = useState('')
  const [search, setSearch] = useState('')

  function handleSort(col: SortCol) {
    if (sortCol === col) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortCol(col)
      setSortDir('desc')
    }
  }

  const frequencyLabel = (f: string) => {
    if (f === 'annual') return t('annual')
    if (f === 'semi-annual') return t('semiAnnual')
    if (f === 'quarterly') return t('quarterly')
    return f
  }

  const filtered = useMemo(() => {
    let result = rows
    if (sector) result = result.filter((r) => r.sector === sector)
    if (search.trim()) {
      const q = search.trim().toUpperCase()
      result = result.filter(
        (r) => r.ticker.includes(q) || r.name.toLowerCase().includes(search.toLowerCase())
      )
    }
    return [...result].sort((a, b) => {
      const av: string | number = a[sortCol] ?? ''
      const bv: string | number = b[sortCol] ?? ''
      if (typeof av === 'string' && typeof bv === 'string') {
        return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av)
      }
      return sortDir === 'asc' ? (av as number) - (bv as number) : (bv as number) - (av as number)
    })
  }, [rows, sector, search, sortCol, sortDir])

  const lastUpdated = rows[0]?.updated_at

  return (
    <div>
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <input
          type="search"
          placeholder={t('search')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
        <select
          value={sector}
          onChange={(e) => setSector(e.target.value)}
          className="rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 bg-background"
        >
          <option value="">{t('allSectors')}</option>
          {sectors.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {/* Stats row */}
      <div className="flex justify-between items-center mb-2 text-xs text-muted-foreground">
        <span>{t('showingRows', { count: filtered.length })}</span>
        {lastUpdated && (
          <span>
            {t('lastUpdated')}: {formatDate(lastUpdated, locale)}
          </span>
        )}
      </div>

      {/* Table */}
      <div className="rounded-xl border overflow-x-auto">
        {filtered.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground text-sm">{t('noResults')}</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-muted-foreground text-xs uppercase tracking-wide">
              <tr>
                <th
                  className="px-4 py-3 text-left font-medium cursor-pointer select-none hover:text-foreground"
                  onClick={() => handleSort('ticker')}
                >
                  {t('ticker')}
                  <SortIcon col="ticker" sortCol={sortCol} sortDir={sortDir} />
                </th>
                <th className="px-4 py-3 text-left font-medium hidden lg:table-cell">{t('name')}</th>
                <th
                  className="px-4 py-3 text-left font-medium hidden md:table-cell cursor-pointer select-none hover:text-foreground"
                  onClick={() => handleSort('sector')}
                >
                  {t('sector')}
                  <SortIcon col="sector" sortCol={sortCol} sortDir={sortDir} />
                </th>
                <th
                  className="px-4 py-3 text-right font-medium cursor-pointer select-none hover:text-foreground"
                  onClick={() => handleSort('last_price')}
                >
                  {t('lastPrice')}
                  <SortIcon col="last_price" sortCol={sortCol} sortDir={sortDir} />
                </th>
                <th
                  className="px-4 py-3 text-right font-medium hidden sm:table-cell cursor-pointer select-none hover:text-foreground"
                  onClick={() => handleSort('trailing_annual_dividend')}
                >
                  {t('trailingDividend')}
                  <SortIcon col="trailing_annual_dividend" sortCol={sortCol} sortDir={sortDir} />
                </th>
                <th
                  className="px-4 py-3 text-right font-medium cursor-pointer select-none hover:text-foreground"
                  onClick={() => handleSort('dividend_yield')}
                >
                  {t('dividendYield')}
                  <SortIcon col="dividend_yield" sortCol={sortCol} sortDir={sortDir} />
                </th>
                <th
                  className="px-4 py-3 text-right font-medium hidden sm:table-cell cursor-pointer select-none hover:text-foreground"
                  onClick={() => handleSort('ex_date')}
                >
                  {t('exDate')}
                  <SortIcon col="ex_date" sortCol={sortCol} sortDir={sortDir} />
                </th>
                <th className="px-4 py-3 text-right font-medium hidden md:table-cell">{t('payDate')}</th>
                <th className="px-4 py-3 text-center font-medium hidden md:table-cell">{t('frequency')}</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((row) => (
                <tr key={row.ticker} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-semibold">{row.ticker}</td>
                  <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell truncate max-w-[180px]">
                    {row.name}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{row.sector}</td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {row.last_price.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums hidden sm:table-cell">
                    {row.trailing_annual_dividend.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-green-600 tabular-nums">
                    {row.dividend_yield.toFixed(2)}%
                  </td>
                  <td className="px-4 py-3 text-right text-muted-foreground hidden sm:table-cell tabular-nums">
                    {formatDate(row.ex_date, locale)}
                  </td>
                  <td className="px-4 py-3 text-right text-muted-foreground hidden md:table-cell tabular-nums">
                    {formatDate(row.pay_date, locale)}
                  </td>
                  <td className="px-4 py-3 text-center hidden md:table-cell">
                    <FrequencyBadge frequency={row.frequency} label={frequencyLabel(row.frequency)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
