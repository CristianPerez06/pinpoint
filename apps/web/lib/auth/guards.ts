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

/**
 * The account, as the auth server describes it.
 *
 * `email` is optional on Supabase's own type — an account can exist against a
 * phone number or a provider that returns none — and is kept optional here
 * rather than asserted away. Every account in this product has one today
 * because both sign-up forms ask for one, which is a fact about the forms and
 * not a guarantee the auth server makes.
 */
type Account = { id: string; email: string | null }

async function currentUser(): Promise<Account | null> {
  const supabase = await createClient()
  const { data } = await supabase.auth.getUser()
  return data.user ? { id: data.user.id, email: data.user.email ?? null } : null
}

/**
 * Gate for a protected screen. Redirects to sign-in when there is no valid
 * session, so the screen's data is never fetched, rendered, or sent.
 */
export async function requireUserId(): Promise<string> {
  return (await requireUser()).id
}

/**
 * The same gate, for a screen that needs to say *which* account this is.
 *
 * Account-scoped and deliberately so. The name a person is shown by elsewhere in
 * this product — in the menu, in the filter, beside a place they want to go — is
 * `trip_members.display_name`, which belongs to a membership rather than to an
 * account: the same person can be `Cris` on one trip and `Cristian` on another.
 * A screen about the account therefore has the address and nothing else to
 * identify itself with, and showing a name borrowed from whichever trip happened
 * to be open would be showing something that changes for reasons the screen does
 * not mention.
 */
export async function requireUser(): Promise<Account> {
  const user = await currentUser()
  if (!user) redirect('/login')
  return user
}

/** Keeps a signed-in visitor out of the sign-in and sign-up screens. */
export async function redirectIfAuthenticated(target = '/'): Promise<void> {
  if (await currentUser()) redirect(target)
}
