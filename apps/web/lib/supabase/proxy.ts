import { createServerClient } from '@supabase/ssr'
import type { Database } from '@pinpoint/supabase'
import { NextResponse, type NextRequest } from 'next/server'

import { config } from '@/lib/config'

/**
 * Refresh the session on every request and write the refreshed cookies back.
 *
 * Server components cannot set cookies, so without this an access token expires
 * mid-session and the person is signed out at an arbitrary moment. Running it
 * in the proxy is what makes "the session survives a reload" true.
 *
 * `getUser()` rather than `getSession()`: the former validates the token with
 * the auth server, the latter trusts whatever is in the cookie. This runs
 * before protected pages render, so it is the wrong place to trust a cookie.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient<Database>(
    config.supabase.url,
    config.supabase.publishableKey,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value)
          }
          response = NextResponse.next({ request })
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options)
          }
        },
      },
    },
  )

  // Do not remove. Calling this is what triggers the refresh; the result is
  // deliberately unused here because the guards re-read it where it matters.
  await supabase.auth.getUser()

  return response
}
