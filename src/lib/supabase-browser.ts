import { createBrowserClient as _createBrowserClient } from '@supabase/ssr'

// Use only in Client Components ("use client")
export function createBrowserClient() {
  return _createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
