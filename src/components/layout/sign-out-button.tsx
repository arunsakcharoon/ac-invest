'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { LogOut } from 'lucide-react'
import { createBrowserClient } from '@/lib/supabase-browser'

interface SignOutButtonProps {
  variant?: 'desktop' | 'mobile'
}

export default function SignOutButton({ variant = 'desktop' }: SignOutButtonProps) {
  const t = useTranslations('auth')
  const router = useRouter()
  const locale = useLocale()
  const [isPending, startTransition] = useTransition()

  function handleSignOut() {
    startTransition(async () => {
      const supabase = createBrowserClient()
      await supabase.auth.signOut()
      router.push(`/${locale}`)
      router.refresh()
    })
  }

  if (variant === 'mobile') {
    return (
      <button
        onClick={handleSignOut}
        disabled={isPending}
        className="flex items-center gap-1.5 text-sm text-gray-700 dark:text-gray-300 disabled:opacity-50"
      >
        <LogOut className="w-4 h-4" />
        {t('signOut')}
      </button>
    )
  }

  return (
    <button
      onClick={handleSignOut}
      disabled={isPending}
      className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white disabled:opacity-50 transition-colors"
    >
      <LogOut className="w-3.5 h-3.5" />
      {t('signOut')}
    </button>
  )
}
