/**
 * The single place this app reads configuration.
 *
 * Nothing else may touch `process.env` — a direct read at a call site skips the
 * validation below and reintroduces the failure mode this module exists to
 * remove.
 *
 * VISIBILITY
 *
 *   publishable  Inlined into the client bundle by Next and readable by anyone
 *                who loads the site. Only values that are safe published may
 *                carry the NEXT_PUBLIC_ prefix.
 *   secret       Never prefixed, never read from code that can reach the
 *                client. There are none yet; when one arrives (a service_role
 *                key, say) it goes in a separate server-only module.
 *
 * Every variable below is publishable. The Supabase publishable key is designed
 * to ship in clients and is constrained by row-level security. The Stadia Maps
 * key is publishable because its free plan stops at its allowance rather than
 * billing: a key read out of the bundle can spend that month's routes and
 * nothing else. The secret
 * (service_role) key bypasses row-level security entirely and MUST NOT be given
 * a NEXT_PUBLIC_ prefix under any circumstances.
 */

function required(name: string, value: string | undefined): string {
  if (value === undefined || value.trim() === '') {
    throw new Error(
      `Missing required configuration: ${name}\n` +
        `Copy apps/web/.env.example to apps/web/.env and fill it in.`,
    )
  }
  return value
}

/**
 * An optional switch: on only when set to exactly `on`, and off otherwise.
 *
 * Off is the default because what these gate is unfinished somewhere: a switch
 * nobody set must never turn a feature on.
 */
function switchedOn(value: string | undefined): boolean {
  return value?.trim() === 'on'
}

// Each variable is read as a literal property access. Next only inlines
// NEXT_PUBLIC_* values it can see statically, so `process.env[name]` would
// silently produce undefined in the browser.
export const config = {
  supabase: {
    url: required(
      'NEXT_PUBLIC_SUPABASE_URL',
      process.env.NEXT_PUBLIC_SUPABASE_URL,
    ),
    publishableKey: required(
      'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    ),
  },
  /**
   * Stadia Maps, the first service asked for a street route (`place-route`).
   * The same key as the phone's. Stadia could recognise the live site by its
   * address instead, but a key also covers previews and any other address.
   */
  stadia: {
    apiKey: required(
      'NEXT_PUBLIC_STADIA_API_KEY',
      process.env.NEXT_PUBLIC_STADIA_API_KEY,
    ),
  },
  /**
   * Whether a password can be changed: "Forgot password?" on sign-in, and
   * "Change password" in settings. One switch for both, on purpose.
   *
   * Off on the live project until a real email service is connected: a new
   * free project cannot put the code in Supabase's built-in email, so a reset
   * started there could never finish. The change goes with it because changing
   * a password where a forgotten one cannot be reset is a way to lock oneself
   * out for good. On locally, where `supabase/templates/` is used.
   */
  passwordChanges: switchedOn(process.env.NEXT_PUBLIC_PASSWORD_CHANGES),
} as const
