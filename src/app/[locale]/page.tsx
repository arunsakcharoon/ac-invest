import { useTranslations, useLocale } from 'next-intl'
import Link from 'next/link'
import { TrendingUp, BarChart3, Newspaper, Landmark, Heart } from 'lucide-react'

export default function HomePage() {
  const t = useTranslations('home')
  const locale = useLocale()

  const features = [
    {
      icon: TrendingUp,
      title: t('feat1Title'),
      desc: t('feat1Desc'),
      href: `/${locale}/dividends`,
      cta: t('feat1Cta'),
      color: 'bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400',
      border: 'hover:border-blue-200 dark:hover:border-blue-800',
    },
    {
      icon: BarChart3,
      title: t('feat2Title'),
      desc: t('feat2Desc'),
      href: `/${locale}/auth/signup`,
      cta: t('feat2Cta'),
      color: 'bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400',
      border: 'hover:border-purple-200 dark:hover:border-purple-800',
    },
    {
      icon: Newspaper,
      title: t('feat3Title'),
      desc: t('feat3Desc'),
      href: `/${locale}/news`,
      cta: t('feat3Cta'),
      color: 'bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400',
      border: 'hover:border-green-200 dark:hover:border-green-800',
    },
    {
      icon: Landmark,
      title: t('feat4Title'),
      desc: t('feat4Desc'),
      href: `/${locale}/bonds`,
      cta: t('feat4Cta'),
      color: 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400',
      border: 'hover:border-amber-200 dark:hover:border-amber-800',
    },
  ]

  const stats = [
    { value: t('statsStocks'),  label: t('statsStocksDesc') },
    { value: t('statsDaily'),   label: t('statsDailyDesc') },
    { value: t('statsFree'),    label: t('statsFreeDesc') },
  ]

  return (
    <div className="flex flex-col">

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950 px-4 py-20 text-center">
        <div className="container mx-auto max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900 px-4 py-1.5 text-xs font-medium text-blue-700 dark:text-blue-300 mb-6">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            อัปเดตทุกวันทำการ — ฟรี ไม่มีโฆษณา
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-gray-900 dark:text-white mb-4 leading-tight">
            {t('title')}
          </h1>
          <p className="text-lg text-gray-500 dark:text-gray-400 mb-10 max-w-xl mx-auto leading-relaxed">
            {t('subtitle')}
          </p>

          <div className="flex flex-wrap gap-3 justify-center">
            <Link
              href={`/${locale}/dividends`}
              className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors"
            >
              {t('ctaDividends')}
            </Link>
            <Link
              href={`/${locale}/auth/signup`}
              className="inline-flex items-center justify-center rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-6 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              {t('ctaSignUp')}
            </Link>
          </div>
        </div>
      </section>

      {/* ── Stats bar ─────────────────────────────────────────────────────── */}
      <section className="border-y border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-4 py-8">
        <div className="container mx-auto max-w-3xl">
          <div className="grid grid-cols-3 gap-4 text-center divide-x divide-gray-200 dark:divide-gray-800">
            {stats.map((s) => (
              <div key={s.value} className="px-4">
                <p className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">{s.value}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Feature cards ─────────────────────────────────────────────────── */}
      <section className="px-4 py-16 bg-white dark:bg-gray-950">
        <div className="container mx-auto max-w-5xl">
          <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-10">
            {t('featuresTitle')}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {features.map((f) => (
              <div
                key={f.title}
                className={`group rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 transition-all duration-200 ${f.border}`}
              >
                <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl ${f.color} mb-4`}>
                  <f.icon className="w-5 h-5" />
                </div>
                <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 leading-relaxed">{f.desc}</p>
                <Link
                  href={f.href}
                  className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
                >
                  {f.cta} →
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Donate ────────────────────────────────────────────────────────── */}
      <section className="px-4 py-16 bg-gray-50 dark:bg-gray-900/50">
        <div className="container mx-auto max-w-sm text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-rose-50 dark:bg-rose-950/30 mb-4">
            <Heart className="w-5 h-5 text-rose-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{t('donateTitle')}</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">{t('donateSubtitle')}</p>
        </div>
      </section>

    </div>
  )
}
