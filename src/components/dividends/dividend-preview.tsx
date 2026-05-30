import { getTranslations, getLocale } from 'next-intl/server'
import Link from 'next/link'
import type { DividendRow } from '@/lib/types'
import FrequencyBadge from './frequency-badge'

type Props = {
  rows: DividendRow[]
  totalCount: number
}

function formatDate(dateStr: string | null, locale: string): string {
  if (!dateStr) return '—'
  return new Intl.DateTimeFormat(locale === 'th' ? 'th-TH' : 'en-GB', {
    day: 'numeric',
    month: 'short',
    year: '2-digit',
  }).format(new Date(dateStr))
}

export default async function DividendPreview({ rows, totalCount }: Props) {
  const t = await getTranslations('dividends')
  const tNav = await getTranslations('nav')
  const locale = await getLocale()
  const lockedCount = totalCount - rows.length

  const frequencyLabel = (f: string) => {
    if (f === 'annual') return t('annual')
    if (f === 'semi-annual') return t('semiAnnual')
    if (f === 'quarterly') return t('quarterly')
    return f
  }

  return (
    <div>
      {/* Visible top 3 rows */}
      <div className="rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-muted-foreground text-xs uppercase tracking-wide">
            <tr>
              <th className="px-4 py-3 text-left font-medium">{t('ticker')}</th>
              <th className="px-4 py-3 text-left font-medium hidden md:table-cell">{t('name')}</th>
              <th className="px-4 py-3 text-left font-medium hidden lg:table-cell">{t('sector')}</th>
              <th className="px-4 py-3 text-right font-medium">{t('dividendYield')}</th>
              <th className="px-4 py-3 text-right font-medium hidden sm:table-cell">{t('exDate')}</th>
              <th className="px-4 py-3 text-center font-medium hidden md:table-cell">{t('frequency')}</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.map((row) => (
              <tr key={row.ticker} className="hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3 font-semibold">{row.ticker}</td>
                <td className="px-4 py-3 text-muted-foreground hidden md:table-cell truncate max-w-[200px]">
                  {row.name}
                </td>
                <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">{row.sector}</td>
                <td className="px-4 py-3 text-right font-semibold text-green-600">
                  {row.dividend_yield.toFixed(2)}%
                </td>
                <td className="px-4 py-3 text-right text-muted-foreground hidden sm:table-cell">
                  {formatDate(row.ex_date, locale)}
                </td>
                <td className="px-4 py-3 text-center hidden md:table-cell">
                  <FrequencyBadge frequency={row.frequency} label={frequencyLabel(row.frequency)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Locked rows with blur + sign-up overlay */}
      {lockedCount > 0 && (
        <div className="relative mt-0 rounded-b-xl overflow-hidden border border-t-0">
          {/* Ghost blurred rows */}
          <div className="blur-sm pointer-events-none select-none opacity-60" aria-hidden>
            <table className="w-full text-sm">
              <tbody className="divide-y">
                {Array.from({ length: Math.min(lockedCount, 5) }).map((_, idx) => (
                  <tr key={idx} className="bg-muted/10">
                    <td className="px-4 py-3 font-semibold w-20">
                      <span className="inline-block bg-muted rounded w-12 h-4" />
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="inline-block bg-muted rounded w-40 h-4" />
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="inline-block bg-muted rounded w-24 h-4" />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="inline-block bg-muted rounded w-12 h-4 ml-auto" />
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className="inline-block bg-muted rounded w-20 h-4 ml-auto" />
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-center">
                      <span className="inline-block bg-muted rounded-full w-16 h-5" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Gradient fade */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/60 to-background pointer-events-none" />

          {/* Sign-up CTA */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center bg-background/95 border rounded-2xl shadow-lg px-6 py-5 mx-4 max-w-sm w-full">
              <p className="text-sm font-semibold mb-1">{t('signUpPrompt')}</p>
              <p className="text-xs text-muted-foreground mb-4">
                {t('lockedRows', { count: lockedCount })}
              </p>
              <div className="flex gap-2 justify-center">
                <Link
                  href={`/${locale}/auth/signup`}
                  className="inline-flex items-center justify-center rounded-lg bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  {t('signUpCta')}
                </Link>
                <Link
                  href={`/${locale}/auth/signin`}
                  className="inline-flex items-center justify-center rounded-lg border px-5 py-2 text-sm font-medium hover:bg-accent transition-colors"
                >
                  {tNav('signIn')}
                </Link>
              </div>
            </div>
          </div>

          {/* Bottom padding to give the CTA room */}
          <div className="h-32" />
        </div>
      )}

      {/* Last updated */}
      {rows[0]?.updated_at && (
        <p className="text-xs text-muted-foreground mt-3 text-right">
          {t('lastUpdated')}: {formatDate(rows[0].updated_at, locale)}
        </p>
      )}
    </div>
  )
}
