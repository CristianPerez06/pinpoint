import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@pinpoint/supabase'

import { config } from '@/lib/config'

/** Supabase client for browser components. Reads the same cookie session. */
export function createClient() {
  return createBrowserClient<Database>(
    config.supabase.url,
    config.supabase.publishableKey,
  )
}
