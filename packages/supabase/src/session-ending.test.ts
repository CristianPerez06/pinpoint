import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { createPinpointClient, type SessionStorage } from './client'

/**
 * What the client does when a session ends, pinned against the version installed.
 *
 * The phone forgets every trip it kept when the client emits `SIGNED_OUT`
 * (`apps/mobile/lib/sign-out.ts`). That is only safe while the event means the
 * service said the session is over. If an upgrade ever emitted it for a phone
 * that simply had no signal, the trip would be erased at the moment it is needed
 * most — so the three answers that matter are asserted here, against the real
 * client with only `fetch` faked.
 */

const URL = 'https://pinpoint.supabase.co'
const STORAGE_KEY = 'sb-pinpoint-auth-token'

function storedSession(expiresInSeconds: number): string {
  const now = Math.floor(Date.now() / 1000)
  return JSON.stringify({
    access_token: 'access',
    refresh_token: 'refresh',
    token_type: 'bearer',
    expires_in: expiresInSeconds,
    expires_at: now + expiresInSeconds,
    user: { id: 'user-1', aud: 'authenticated', email: 'traveller@example.com' },
  })
}

function memoryStorage(initial: string): SessionStorage & { value(): string | null } {
  let stored: string | null = initial
  return {
    getItem: (key) => (key === STORAGE_KEY ? stored : null),
    setItem: (key, value) => {
      if (key === STORAGE_KEY) stored = value
    },
    removeItem: (key) => {
      if (key === STORAGE_KEY) stored = null
    },
    value: () => stored,
  }
}

function refusal(status: number, code: string): Response {
  return new Response(JSON.stringify({ code, error_code: code, msg: code }), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}

async function clientWith(session: string, answer: (url: string) => Promise<Response>) {
  vi.stubGlobal('fetch', vi.fn((input: RequestInfo | URL) => answer(String(input))))
  const storage = memoryStorage(session)
  const client = createPinpointClient(
    { url: URL, publishableKey: 'publishable' },
    { storage, detectSessionInUrl: false, persistSession: true, autoRefreshToken: false },
  )
  const events: string[] = []
  client.auth.onAuthStateChange((event) => {
    events.push(event)
  })
  // Let the client read the stored session before anything is asked of it.
  await client.auth.getSession()
  return { client, storage, events }
}

// The client logs every refusal it handles; the assertions are what matter here.
beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {})
  vi.spyOn(console, 'warn').mockImplementation(() => {})
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('a session ending', () => {
  it('is signed out when the service says the session is gone', async () => {
    const { client, storage, events } = await clientWith(storedSession(3600), async () =>
      refusal(403, 'session_not_found'),
    )

    await client.auth.getUser()

    expect(events).toContain('SIGNED_OUT')
    expect(storage.value()).toBeNull()
  })

  it('is signed out when an expired session cannot be refreshed', async () => {
    const { client, storage, events } = await clientWith(storedSession(-60), async (url) =>
      url.includes('/token')
        ? refusal(400, 'refresh_token_not_found')
        : refusal(403, 'session_not_found'),
    )

    await client.auth.getUser()

    expect(events).toContain('SIGNED_OUT')
    expect(storage.value()).toBeNull()
  })

  it('is kept when the service cannot be reached', async () => {
    const { client, storage, events } = await clientWith(storedSession(3600), async () => {
      throw new TypeError('Network request failed')
    })

    const { error } = await client.auth.getUser()

    expect(error).not.toBeNull()
    expect(events).not.toContain('SIGNED_OUT')
    expect(storage.value()).not.toBeNull()
  })
})
