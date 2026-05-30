import { getTranslations } from 'next-intl/server'
import type { Metadata } from 'next'
import { ExternalLink, Landmark } from 'lucide-react'
import { getBonds } from '@/lib/content'
import type { BondIPO } from '@/lib/types'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('bonds')
  return {
    title: t('title'),
    description: (await getTranslations('metadata'))('bondsDescription'),
  }
}

// ── Rating badge ──────────────────────────────────────────────────────────────

function ratingStyle(rating: string): string {
  const r = rating.toUpperCase()
  if (r.startsWith('AAA') || r.startsWith('AA')) return 'bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800'
  if (r.startsWith('A'))                           return 'bg-blue-50  dark:bg-blue-950/40  text-blue-700  dark:text-blue-300  border-blue-200  dark:border-blue-800'
  if (r.startsWith('BBB'))                         return 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
  return 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700'
}

// ── Bond status helpers ───────────────────────────────────────────────────────

type BondStatus = 'open' | 'upcoming' | 'closed'

function bondStatus(bond: BondIPO): { status: BondStatus; daysLeft: number; daysUntil: number } {
  const now = Date.now()
  const start = new Date(bond.offer_start).getTime()
  const end   = new Date(bond.offer_end).getTime()
  const daysLeft  = Math.ceil((end - now)   / 86_400_000)
  const daysUntil = Math.ceil((start - now) / 86_400_000)

  if (now < start) return { status: 'upcoming', daysLeft: 0, daysUntil }
  if (now > end)   return { status: 'closed',   daysLeft: 0, daysUntil: 0 }
  return { status: 'open', daysLeft, daysUntil: 0 }
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function BondsPage() {
  const t = await getTranslations('bonds')
  const allBonds = await getBonds()

  // Sort: open first, then upcoming, then closed
  const ORDER: Record<BondStatus, number> = { open: 0, upcoming: 1, closed: 2 }
  const bonds = [...allBonds].sort((a, b) => {
    const sa = bondStatus(a).status
    const sb = bondStatus(b).status
    return ORDER[sa] - ORDER[sb]
  })

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{t('title')}</h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">{t('subtitle')}</p>

      {bonds.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-700 py-16 text-center">
          <Landmark className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">{t('noBonds')}</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {bonds.map((bond) => {
            const { status, daysLeft, daysUntil } = bondStatus(bond)

            const statusBadge = {
              open:     'bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-300',
              upcoming: 'bg-blue-50  dark:bg-blue-950/40  text-blue-700  dark:text-blue-300',
              closed:   'bg-gray-100 dark:bg-gray-800     text-gray-500  dark:text-gray-400',
            }[status]

            const statusLabel = {
              open:     t('statusOpen'),
              upcoming: t('statusUpcoming'),
              closed:   t('statusClosed'),
            }[status]

            const daysLabel =
              status === 'open'     ? t('daysLeft', { days: daysLeft }) :
              status === 'upcoming' ? t('opensIn',  { days: daysUntil }) :
              null

            return (
              <div
                key={bond.id}
                className={`flex flex-col rounded-2xl border bg-white dark:bg-gray-900 p-5 ${status === 'closed' ? 'border-gray-200 dark:border-gray-800 opacity-70' : 'border-gray-200 dark:border-gray-700'}`}
              >
                {/* Top row: status + rating */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusBadge}`}>
                      {statusLabel}
                    </span>
                    {daysLabel && (
                      <span className="text-xs text-gray-400 dark:text-gray-500">{daysLabel}</span>
                    )}
                  </div>
                  {bond.rating && (
                    <span className={`shrink-0 rounded-md border px-2 py-0.5 text-xs font-bold tabular-nums ${ratingStyle(bond.rating)}`}>
                      {bond.rating}
                    </span>
                  )}
                </div>

                {/* Name + issuer */}
                <p className="font-semibold text-gray-900 dark:text-white text-sm leading-snug mb-0.5">
                  {bond.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">{bond.issuer}</p>

                {/* Coupon rate — hero number */}
                <div className="flex items-baseline gap-1 mb-4">
                  <span className="text-3xl font-bold text-green-600 dark:text-green-400 tabular-nums">
                    {bond.coupon_rate.toFixed(2)}
                  </span>
                  <span className="text-base font-semibold text-green-600 dark:text-green-400">%</span>
                  <span className="text-xs text-gray-400 dark:text-gray-500 ml-1">{t('couponRate')}</span>
                </div>

                {/* Details grid */}
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs mb-4">
                  <div>
                    <p className="text-gray-400 dark:text-gray-500">{t('maturityDate')}</p>
                    <p className="font-medium text-gray-700 dark:text-gray-300 tabular-nums">{bond.maturity_date}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 dark:text-gray-500">{t('minInvestment')}</p>
                    <p className="font-medium text-gray-700 dark:text-gray-300 tabular-nums">
                      ฿{bond.min_investment.toLocaleString('th-TH')}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400 dark:text-gray-500">{t('offerStart')}</p>
                    <p className="font-medium text-gray-700 dark:text-gray-300 tabular-nums">{bond.offer_start}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 dark:text-gray-500">{t('offerEnd')}</p>
                    <p className="font-medium text-gray-700 dark:text-gray-300 tabular-nums">{bond.offer_end}</p>
                  </div>
                </div>

                {/* Link */}
                {bond.link && (
                  <a
                    href={bond.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-auto inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    {t('viewDetails')}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
