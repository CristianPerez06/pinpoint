import { createServerClient } from '@supabase/ssr'
import type { Database } from '@pinpoint/supabase'
import { cookies } from 'next/headers'

import { config } from '@/lib/config'

/**
 * Supabase client for server components, server actions, and route handlers.
 *
 * Session lives in cookies so that server-rendered code can read it — that is
 * the whole reason web uses `@supabase/ssr` rather than the plain client the
 * mobile app uses. Which storage a platform picks is the app's decision;
 * `@pinpoint/supabase` and `@pinpoint/auth` stay out of it.
 *
 * Credentials come from the config module, never `process.env` directly.
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    config.supabase.url,
    config.supabase.publishableKey,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options)
            }
          } catch {
            // Server components cannot set cookies. The middleware refreshes
            // the session on every request, so there is nothing to recover
            // here — this is the documented shape of the integration, not a
            // swallowed error.
          }
        },
      },
    },
  )
}
