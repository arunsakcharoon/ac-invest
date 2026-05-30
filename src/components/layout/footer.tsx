import Link from 'next/link'
import { useLocale } from 'next-intl'

export default function Footer() {
  const locale = useLocale()
  return (
    <footer className="border-t py-6 text-center text-xs text-muted-foreground">
      <p>
        © {new Date().getFullYear()} AC Invest · ฟรี ไม่มีโฆษณา ·{' '}
        <Link href={locale === 'th' ? '/en' : '/th'} className="underline">
          {locale === 'th' ? 'English' : 'ภาษาไทย'}
        </Link>
      </p>
    </footer>
  )
}
