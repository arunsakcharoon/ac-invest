# Skill: scaffold-feature-page

Creates a complete new feature page following the project's conventions. Run this checklist whenever adding a new route under `src/app/[locale]/`.

## Checklist

### 1. Create the page file
```
src/app/[locale]/{feature}/page.tsx
```

**Auth-gated page template** (requires sign-in):
```tsx
import { redirect } from 'next/navigation'
import { getLocale, getTranslations } from 'next-intl/server'
import type { Metadata } from 'next'
import { createServerClient } from '@/lib/supabase-server'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('{feature}')
  return { title: t('title') }
}

export default async function FeaturePage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  const locale = await getLocale()

  if (!user) redirect(`/${locale}/auth/signin`)

  const t = await getTranslations('{feature}')
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">{t('title')}</h1>
    </div>
  )
}
```

**Public page template** (no auth):
```tsx
import { getTranslations } from 'next-intl/server'
import type { Metadata } from 'next'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('{feature}')
  return { title: t('title') }
}

export default async function FeaturePage() {
  const t = await getTranslations('{feature}')
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">{t('title')}</h1>
    </div>
  )
}
```

### 2. Create components folder
```
src/components/{feature}/
```
Add feature-specific components here. Keep them server components by default; add `'use client'` only for interactive parts.

### 3. Add i18n keys
Run the `add-i18n-key` skill to add at minimum:
- `{feature}.title` — page heading

### 4. Add nav links
In **both** files:
- `src/components/layout/header.tsx` — add to `navLinks` array
- `src/components/layout/mobile-nav.tsx` — receives `navLinks` as props from header, no change needed

### 5. Add to CLAUDE.md
Under "Project structure", note the new page path.

## Notes
- All pages are async Server Components by default
- Use `getTranslations` (not `useTranslations`) in async server components
- Use `createServerClient` from `@/lib/supabase-server` (NOT `@/lib/supabase`)
- Use `createBrowserClient` from `@/lib/supabase-browser` in Client Components
