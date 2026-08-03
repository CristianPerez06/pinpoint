import type { PinpointClient } from '@pinpoint/supabase'
import { describe, expect, it, vi } from 'vitest'

import { signIn, signOut, signUp } from './operations'

/**
 * A client that records what it was asked to do.
 *
 * The point of these tests is the contract around the service, not the service:
 * that nothing is called when input is invalid, and that whatever comes back is
 * translated into our own vocabulary before a caller sees it.
 */
function stubClient(responses: {
  signInWithPassword?: unknown
  signUp?: unknown
  signOut?: unknown
}) {
  const calls = {
    signInWithPassword: vi.fn().mockResolvedValue(
      responses.signInWithPassword ?? { data: {}, error: null },
    ),
    signUp: vi.fn().mockResolvedValue(
      responses.signUp ?? { data: { user: { identities: [{}] } }, error: null },
    ),
    signOut: vi.fn().mockResolvedValue(responses.signOut ?? { error: null }),
  }
  return {
    client: { auth: calls } as unknown as PinpointClient,
    calls,
  }
}

describe('signIn', () => {
  it('does not contact the service when input is invalid', async () => {
    const { client, calls } = stubClient({})

    const outcome = await signIn(client, { email: 'nope', password: '' })

    expect(outcome.ok).toBe(false)
    expect(calls.signInWithPassword).not.toHaveBeenCalled()
  })

  it('reports invalid input per field', async () => {
    const { client } = stubClient({})

    const outcome = await signIn(client, { email: 'nope', password: '' })

    expect(outcome).toMatchObject({ ok: false, kind: 'invalid-input' })
    if (outcome.ok || outcome.kind !== 'invalid-input') throw new Error('unreachable')
    expect(Object.keys(outcome.fieldErrors).sort()).toEqual(['email', 'password'])
  })

  it('succeeds on valid credentials', async () => {
    const { client, calls } = stubClient({})

    const outcome = await signIn(client, {
      email: 'traveller@example.com',
      password: 'kyoto2026',
    })

    expect(outcome).toEqual({ ok: true })
    expect(calls.signInWithPassword).toHaveBeenCalledWith({
      email: 'traveller@example.com',
      password: 'kyoto2026',
    })
  })

  it('maps a known service error to our identifier', async () => {
    const { client } = stubClient({
      signInWithPassword: { data: {}, error: { code: 'invalid_credentials' } },
    })

    const outcome = await signIn(client, {
      email: 'traveller@example.com',
      password: 'kyoto2026',
    })

    expect(outcome).toMatchObject({
      ok: false,
      kind: 'rejected',
      failure: 'invalid-credentials',
    })
  })

  it('maps an unknown service error to generic', async () => {
    const { client } = stubClient({
      signInWithPassword: {
        data: {},
        error: { code: 'a_code_we_have_never_seen', message: 'raw service text' },
      },
    })

    const outcome = await signIn(client, {
      email: 'traveller@example.com',
      password: 'kyoto2026',
    })

    expect(outcome).toMatchObject({ ok: false, kind: 'rejected', failure: 'generic' })
    if (outcome.ok || outcome.kind !== 'rejected') throw new Error('unreachable')
    expect(outcome.message).not.toContain('raw service text')
  })
})

describe('signUp', () => {
  const VALID = {
    email: 'traveller@example.com',
    password: 'kyoto2026',
    confirmPassword: 'kyoto2026',
  }

  it('does not contact the service when the passwords differ', async () => {
    const { client, calls } = stubClient({})

    const outcome = await signUp(client, { ...VALID, confirmPassword: 'kyoto2027' })

    expect(outcome).toMatchObject({ ok: false, kind: 'invalid-input' })
    expect(calls.signUp).not.toHaveBeenCalled()
  })

  it('does not send the confirmation field to the service', async () => {
    const { client, calls } = stubClient({})

    await signUp(client, VALID)

    expect(calls.signUp).toHaveBeenCalledWith({
      email: VALID.email,
      password: VALID.password,
    })
  })

  it('treats a user with no identities as an existing account', async () => {
    // What Supabase returns for a duplicate when email confirmation is on: no
    // error, because an error would confirm the address is registered.
    const { client } = stubClient({
      signUp: { data: { user: { identities: [] } }, error: null },
    })

    const outcome = await signUp(client, VALID)

    expect(outcome).toMatchObject({ ok: false, failure: 'email-taken' })
  })

  it('maps a duplicate reported as an error', async () => {
    const { client } = stubClient({
      signUp: { data: {}, error: { code: 'user_already_exists' } },
    })

    expect(await signUp(client, VALID)).toMatchObject({ failure: 'email-taken' })
  })
})

describe('signOut', () => {
  it('succeeds', async () => {
    const { client, calls } = stubClient({})

    expect(await signOut(client)).toEqual({ ok: true })
    expect(calls.signOut).toHaveBeenCalled()
  })

  it('maps a failure', async () => {
    const { client } = stubClient({ signOut: { error: { code: 'unexpected' } } })

    expect(await signOut(client)).toMatchObject({ ok: false, failure: 'generic' })
  })
})
