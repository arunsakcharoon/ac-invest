import Link from 'next/link'
import { getTranslations, getLocale } from 'next-intl/server'
import { createServerClient } from '@/lib/supabase-server'
import MobileNav from './mobile-nav'
import SignOutButton from './sign-out-button'
import ThemeToggle from './theme-toggle'

export default async function Header() {
  const [t, locale] = await Promise.all([getTranslations('nav'), getLocale()])
  let user = null
  try {
    const supabase = await createServerClient()
    const { data } = await supabase.auth.getUser()
    user = data.user
  } catch {
    // Supabase not configured (local dev) — render as logged-out
  }

  const navLinks = [
    { href: `/${locale}/dividends`, label: t('dividends') },
    { href: `/${locale}/news`,      label: t('news') },
    { href: `/${locale}/bonds`,     label: t('bonds') },
    { href: `/${locale}/portfolio`, label: t('portfolio') },
  ]

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 dark:border-gray-800 bg-white/95 dark:bg-gray-950/95 backdrop-blur">
      <div className="container mx-auto px-4 flex h-14 items-center justify-between">
        <Link href={`/${locale}`} className="font-bold text-lg text-gray-900 dark:text-white">
          AC Invest
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6 text-sm">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Desktop auth + locale */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <>
              <span className="text-xs text-gray-400 dark:text-gray-500 max-w-[140px] truncate">
                {user.email}
              </span>
              <SignOutButton variant="desktop" />
            </>
          ) : (
            <>
              <Link
                href={`/${locale}/auth/signin`}
                className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                {t('signIn')}
              </Link>
              <Link
                href={`/${locale}/auth/signup`}
                className="text-sm bg-blue-600 text-white rounded-lg px-3 py-1.5 hover:bg-blue-700 transition-colors"
              >
                {t('signUp')}
              </Link>
            </>
          )}
          <ThemeToggle />
          <Link
            href={locale === 'th' ? '/en' : '/th'}
            className="text-xs border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          >
            {locale === 'th' ? 'EN' : 'TH'}
          </Link>
        </div>

        <MobileNav navLinks={navLinks} isLoggedIn={!!user} userEmail={user?.email} />
      </div>
    </header>
  )
}
