import type { PinpointClient } from '@pinpoint/supabase'
import { describe, expect, it, vi } from 'vitest'

import { claimTripMemberships, signIn, signOut, signUp } from './operations'

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
  rpc?: unknown
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
  const rpc = vi.fn().mockResolvedValue(responses.rpc ?? { data: 1, error: null })

  return {
    client: { auth: calls, rpc } as unknown as PinpointClient,
    calls: { ...calls, rpc },
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

/**
 * The regression these guard is not "the claim function works" — it is that
 * authenticating claims at all. Claiming used to happen only at sign-up, which
 * made an ordinary sequence (sign up, then get invited) produce an invitation
 * that no action in the product could ever claim. The person saw an empty trip
 * list, indistinguishable from having been invited to nothing.
 *
 * Deleting the `claimTripMemberships` call from `signIn` must fail a test here.
 */
describe('claiming memberships on authentication', () => {
  it('claims when signing in, not only when signing up', async () => {
    const { client, calls } = stubClient({})

    await signIn(client, { email: 'traveller@example.com', password: 'kyoto2026' })

    expect(calls.rpc).toHaveBeenCalledWith('claim_trip_memberships')
  })

  it('claims when signing up', async () => {
    const { client, calls } = stubClient({})

    await signUp(client, {
      email: 'traveller@example.com',
      password: 'kyoto2026',
      confirmPassword: 'kyoto2026',
    })

    expect(calls.rpc).toHaveBeenCalledWith('claim_trip_memberships')
  })

  it('does not claim when the credentials were rejected', async () => {
    // Nothing has been proved about who is asking, so there is no verified
    // address to claim against.
    const { client, calls } = stubClient({
      signInWithPassword: { data: {}, error: { code: 'invalid_credentials' } },
    })

    await signIn(client, { email: 'traveller@example.com', password: 'wrong' })

    expect(calls.rpc).not.toHaveBeenCalled()
  })

  it('does not claim when the input never reached the service', async () => {
    const { client, calls } = stubClient({})

    await signIn(client, { email: 'nope', password: '' })

    expect(calls.rpc).not.toHaveBeenCalled()
  })

  it('succeeds anyway when the claim itself fails', async () => {
    // Somebody with nothing waiting is not in an error state, and a claim that
    // could not run must not cost them their session.
    const { client } = stubClient({ rpc: { data: null, error: { message: 'nope' } } })

    const outcome = await signIn(client, {
      email: 'traveller@example.com',
      password: 'kyoto2026',
    })

    expect(outcome.ok).toBe(true)
  })

  it('passes no address to the database', async () => {
    // The match is on the address the identity provider verified, read inside
    // the function from the token. An email argument here would turn claiming
    // into "name any address and take their invitation".
    const { client, calls } = stubClient({})

    await claimTripMemberships(client)

    expect(calls.rpc).toHaveBeenCalledWith('claim_trip_memberships')
    expect(calls.rpc.mock.calls[0]).toHaveLength(1)
  })

  it('reports nothing claimed as zero rather than as a failure', async () => {
    const { client } = stubClient({ rpc: { data: 0, error: null } })

    expect(await claimTripMemberships(client)).toBe(0)
  })
})
