// Convenience barrel. Do NOT import this in Client Components —
// it will pull in next/headers and break client bundles.
// Client Components: import { createBrowserClient } from '@/lib/supabase-browser'
// Server Components / Route Handlers: import { createServerClient } from '@/lib/supabase-server'
export { createServerClient } from './supabase-server'
