import { redirect } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'

/**
 * Session checks for server components.
 *
 * Both use `getUser()`, which validates the token against the auth server,
 * rather than `getSession()`, which trusts the cookie. A guard that trusts the
 * cookie is not a guard.
 *
 * The cost is a round-trip per protected render. Verifying the JWT locally
 * against the project's signing key would avoid it, at the price of a revoked
 * session staying valid until its access token expires. Not worth trading
 * correctness for latency at two users; revisit if it ever shows up in a page
 * load.
 */

async function currentUserId(): Promise<string | null> {
  const supabase = await createClient()
  const { data } = await supabase.auth.getUser()
  return data.user?.id ?? null
}

/**
 * Gate for a protected screen. Redirects to sign-in when there is no valid
 * session, so the screen's data is never fetched, rendered, or sent.
 */
export async function requireUserId(): Promise<string> {
  const userId = await currentUserId()
  if (!userId) redirect('/login')
  return userId
}

/** Keeps a signed-in visitor out of the sign-in and sign-up screens. */
export async function redirectIfAuthenticated(target = '/'): Promise<void> {
  if (await currentUserId()) redirect(target)
}
