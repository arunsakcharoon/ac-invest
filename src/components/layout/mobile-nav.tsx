'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { X, Menu } from 'lucide-react'
import SignOutButton from './sign-out-button'
import ThemeToggle from './theme-toggle'

type NavLink = { href: string; label: string }

interface MobileNavProps {
  navLinks: NavLink[]
  isLoggedIn: boolean
  userEmail?: string
}

export default function MobileNav({ navLinks, isLoggedIn, userEmail }: MobileNavProps) {
  const tAuth = useTranslations('auth')
  const locale = useLocale()
  const [open, setOpen] = useState(false)

  return (
    <div className="md:hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Toggle menu"
        className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
      >
        {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {open && (
        <div className="absolute top-14 left-0 right-0 bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800 shadow-md z-50 px-4 py-4 flex flex-col gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="px-2 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg"
              onClick={() => setOpen(false)}
            >
              {link.label}
            </Link>
          ))}

          <div className="flex items-center justify-between pt-3 mt-2 border-t border-gray-100 dark:border-gray-800">
            {isLoggedIn ? (
              <div className="flex flex-col gap-1 w-full">
                {userEmail && (
                  <p className="px-2 text-xs text-gray-400 dark:text-gray-500 truncate">{userEmail}</p>
                )}
                <div className="px-2" onClick={() => setOpen(false)}>
                  <SignOutButton variant="mobile" />
                </div>
              </div>
            ) : (
              <div className="flex gap-3">
                <Link
                  href={`/${locale}/auth/signin`}
                  className="text-sm text-gray-700 dark:text-gray-300"
                  onClick={() => setOpen(false)}
                >
                  {tAuth('signIn')}
                </Link>
                <Link
                  href={`/${locale}/auth/signup`}
                  className="text-sm font-medium text-blue-600 dark:text-blue-400"
                  onClick={() => setOpen(false)}
                >
                  {tAuth('signUp')}
                </Link>
              </div>
            )}
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Link
                href={locale === 'th' ? '/en' : '/th'}
                className="text-xs border border-gray-300 dark:border-gray-600 rounded px-2 py-0.5 text-gray-500"
                onClick={() => setOpen(false)}
              >
                {locale === 'th' ? 'EN' : 'TH'}
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
