import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import SignInForm from './sign-in-form'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('auth')
  return { title: t('signIn') }
}

interface Props {
  searchParams: Promise<{ next?: string }>
}

export default async function SignInPage({ searchParams }: Props) {
  const { next } = await searchParams
  return <SignInForm next={next} />
}
