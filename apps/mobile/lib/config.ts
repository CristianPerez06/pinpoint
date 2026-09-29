/**
 * The single place this app reads configuration. Mirrors apps/web/lib/config.ts
 * — same contract, different prefix.
 *
 * VISIBILITY
 *
 *   publishable  Inlined into the JS bundle by Expo and therefore extractable
 *                from any installed build. Only EXPO_PUBLIC_ values are.
 *   secret       Never prefixed, never read here. A native app has no server
 *                side, so a secret has nowhere safe to live in this app at all.
 *
 * Both variables below are publishable. The Supabase publishable key is meant
 * to ship in clients and is constrained by row-level security; the secret
 * (service_role) key bypasses it entirely and MUST NOT be given an
 * EXPO_PUBLIC_ prefix.
 */

function required(name: string, value: string | undefined): string {
  if (value === undefined || value.trim() === '') {
    throw new Error(
      `Missing required configuration: ${name}\n` +
        `Copy apps/mobile/.env.example to apps/mobile/.env and fill it in.`,
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

// Literal property access, not process.env[name]: Expo only inlines
// EXPO_PUBLIC_* references it can see statically.
export const config = {
  supabase: {
    url: required(
      'EXPO_PUBLIC_SUPABASE_URL',
      process.env.EXPO_PUBLIC_SUPABASE_URL,
    ),
    publishableKey: required(
      'EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
      process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
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
  passwordChanges: switchedOn(process.env.EXPO_PUBLIC_PASSWORD_CHANGES),
} as const
