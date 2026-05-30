# Skill: add-i18n-key

Adds a new translation key to **both** `messages/th.json` and `messages/en.json` simultaneously. This is required for every user-facing string in the project.

## When to use
- Adding any text that appears in the UI
- Adding page titles, error messages, labels, or prompts
- Before adding a `useTranslations` or `getTranslations` call in code

## Rules
- **Never** hardcode Thai or English UI strings in components — always use translation keys
- Both files must be updated in the same commit; the build will fail if keys are missing
- Key naming: `camelCase` nested under a section (`portfolio.yieldOnCost`, `auth.signInError`)
- Sections mirror features: `nav`, `home`, `dividends`, `portfolio`, `news`, `bonds`, `auth`, `common`, `notFound`, `errors`

## Steps

### 1. Identify the section
Match the key to its nearest feature section. Use `common.*` for generic UI (loading, save, cancel). Use `errors.*` for runtime/API errors.

### 2. Add to `messages/th.json`
Open the file and add the Thai text at the correct path:
```json
{
  "portfolio": {
    "existingKey": "...",
    "newKey": "ข้อความภาษาไทย"
  }
}
```

### 3. Add the same key to `messages/en.json`
```json
{
  "portfolio": {
    "existingKey": "...",
    "newKey": "English text"
  }
}
```

### 4. Use in code
**Async Server Component:**
```ts
import { getTranslations } from 'next-intl/server'
const t = await getTranslations('portfolio')
return <p>{t('newKey')}</p>
```

**Sync Server Component or Client Component:**
```ts
import { useTranslations } from 'next-intl'
const t = useTranslations('portfolio')
return <p>{t('newKey')}</p>
```

## Verification
Run `npm run build` — next-intl type-checks all keys at build time and will error if a key used in code is missing from either message file.
