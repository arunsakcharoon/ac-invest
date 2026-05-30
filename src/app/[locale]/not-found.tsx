import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { getLocale } from 'next-intl/server'

export default async function NotFound() {
  const t = await getTranslations('notFound')
  const locale = await getLocale()

  return (
    <div className="container mx-auto px-4 py-24 text-center">
      <p className="text-6xl font-bold text-muted-foreground mb-4">404</p>
      <h1 className="text-2xl font-semibold mb-2">{t('title')}</h1>
      <p className="text-muted-foreground mb-8">{t('subtitle')}</p>
      <Link
        href={`/${locale}`}
        className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
      >
        {t('backHome')}
      </Link>
    </div>
  )
}
