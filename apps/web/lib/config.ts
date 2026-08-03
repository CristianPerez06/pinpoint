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
 * to ship in clients and is constrained by row-level security. The secret
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
} as const
