import type { PinpointClient } from '@pinpoint/supabase'
import { describe, expect, it, vi } from 'vitest'

import { createCity, updateCity } from './cities'
import { inviteMember, MEMBER_DUPLICATE_MESSAGE } from './interest'
import { createMarker, deleteMarker, updateMarker } from './markers'

/**
 * A client that records what it was asked to write and answers with a fixed
 * response.
 *
 * What these tests are for is the contract around the database rather than the
 * database: that bad input never reaches the network, that a refusal arrives as
 * words a person can read rather than as the database's own error text, and that
 * a success hands back the stored row so a caller need not re-read anything.
 */
function stubClient(
  response: { data?: unknown; error?: unknown } = {},
  /**
   * What the row looks like when the write is asked about afterwards.
   *
   * `updateMarker` re-reads on a failed match to tell "somebody changed this"
   * from "this is gone", and the two answers are the presence or absence of a
   * row here. Defaults to absent, which is the older and more common case.
   */
  recheck: { data?: unknown; error?: unknown } = {},
) {
  const result = {
    data: response.data === undefined ? null : response.data,
    error: response.error ?? null,
  }
  const recheckResult = {
    data: recheck.data === undefined ? null : recheck.data,
    error: recheck.error ?? null,
  }

  const single = vi.fn(() => Promise.resolve(result))
  const maybeSingle = vi.fn(() => Promise.resolve(recheckResult))

  /*
   * A filter that can be applied any number of times and still be followed by
   * a select or a terminator. `updateMarker` now applies two — the id and the
   * version it expects — so a stub that allowed exactly one would fail for the
   * shape of the chain rather than for anything the test is about.
   */
  const filterable: Record<string, unknown> = {}
  const eqAfterUpdate = vi.fn(() => filterable)
  const select = vi.fn(() => filterable)
  Object.assign(filterable, { eq: eqAfterUpdate, select, single, maybeSingle })

  const insert = vi.fn(() => ({ select: vi.fn(() => ({ single })) }))
  const update = vi.fn(() => filterable)
  const eqAfterDelete = vi.fn(() => Promise.resolve(result))
  const del = vi.fn(() => ({ eq: eqAfterDelete }))
  const from = vi.fn(() => ({ insert, update, delete: del, select }))

  return {
    client: { from } as unknown as PinpointClient,
    calls: {
      from,
      insert,
      update,
      del,
      select,
      single,
      maybeSingle,
      eqAfterUpdate,
      eqAfterDelete,
    },
  }
}

const TRIP_ID = '22222222-2222-4222-8222-222222222222'
const CITY_ID = '33333333-3333-4333-8333-333333333333'
const MARKER_ID = '11111111-1111-4111-8111-111111111111'

/** The version an edit says it started from. */
const VERSION = '2026-08-10T00:00:00.000Z'

const MARKER_ROW = {
  id: MARKER_ID,
  trip_id: TRIP_ID,
  city_id: CITY_ID,
  name: 'Nishiki Market',
  note: null,
  lng: 135.7649,
  lat: 35.005,
  type: 'market',
  link: null,
  price: null,
  visited: false,
  created_at: '2026-08-10T00:00:00.000Z',
  updated_at: '2026-08-10T00:00:00.000Z',
}

const CITY_ROW = {
  id: CITY_ID,
  trip_id: TRIP_ID,
  name: 'Kyoto',
  currency: 'JPY',
  created_at: '2026-08-10T00:00:00.000Z',
}

const VALID_MARKER = {
  tripId: TRIP_ID,
  cityId: CITY_ID,
  name: 'Nishiki Market',
  note: null,
  lng: 135.7649,
  lat: 35.005,
  type: 'market',
  link: null,
  price: null,
}

describe('createMarker', () => {
  it('returns the stored row so the map need not re-read the trip', async () => {
    const { client } = stubClient({ data: MARKER_ROW })

    const outcome = await createMarker(client, VALID_MARKER)

    expect(outcome.ok).toBe(true)
    if (!outcome.ok) throw new Error('unreachable')
    expect(outcome.data).toMatchObject({
      id: MARKER_ID,
      name: 'Nishiki Market',
      cityId: CITY_ID,
      type: 'market',
    })
  })

  it('translates the domain names into the column names', async () => {
    const { client, calls } = stubClient({ data: MARKER_ROW })

    await createMarker(client, VALID_MARKER)

    expect(calls.insert).toHaveBeenCalledWith(
      expect.objectContaining({ trip_id: TRIP_ID, city_id: CITY_ID }),
    )
  })

  it('rejects bad input without contacting the database at all', async () => {
    // A blank name should be reported immediately, not after a round trip that
    // was always going to be refused.
    const { client, calls } = stubClient({ data: MARKER_ROW })

    const outcome = await createMarker(client, { ...VALID_MARKER, name: '' })

    expect(outcome.ok).toBe(false)
    if (outcome.ok) throw new Error('unreachable')
    expect(outcome.kind).toBe('invalid-input')
    if (outcome.kind !== 'invalid-input') throw new Error('unreachable')
    expect(outcome.fieldErrors.name).toBeDefined()
    expect(calls.from).not.toHaveBeenCalled()
  })

  it('names the offending field for a position outside the valid range', async () => {
    const { client } = stubClient({ data: MARKER_ROW })

    const outcome = await createMarker(client, { ...VALID_MARKER, lat: 120 })

    if (outcome.ok || outcome.kind !== 'invalid-input') {
      throw new Error('expected invalid input')
    }
    expect(outcome.fieldErrors.lat).toBeDefined()
  })

  it('reports a refusal in words rather than in the database’s own text', async () => {
    const { client } = stubClient({
      error: { message: 'new row violates row-level security policy for table "markers"' },
    })

    const outcome = await createMarker(client, VALID_MARKER)

    if (outcome.ok || outcome.kind !== 'rejected') {
      throw new Error('expected a rejection')
    }
    expect(outcome.message).not.toContain('row-level security')
    expect(outcome.message).not.toContain('markers')
  })
})

describe('updateMarker', () => {
  it('sends only the fields that changed', async () => {
    const { client, calls } = stubClient({ data: MARKER_ROW })

    await updateMarker(client, MARKER_ID, { name: 'Nishiki' }, VERSION)

    expect(calls.update).toHaveBeenCalledWith({ name: 'Nishiki' })
  })

  it('distinguishes clearing a field from leaving it alone', async () => {
    const { client, calls } = stubClient({ data: MARKER_ROW })

    await updateMarker(client, MARKER_ID, { note: null }, VERSION)

    expect(calls.update).toHaveBeenCalledWith({ note: null })
  })

  it('refuses to move a marker to another trip', async () => {
    // Every access rule resolves to the trip a row belongs to, so an edit that
    // could change it is an edit that could put the row out of reach.
    const { client, calls } = stubClient({ data: MARKER_ROW })

    await updateMarker(client, MARKER_ID, { tripId: CITY_ID, name: 'Nishiki' }, VERSION)

    expect(calls.update).toHaveBeenCalledWith({ name: 'Nishiki' })
  })

  it('asks the database to match the version it is editing from', async () => {
    // The point of the filter rather than a check beforehand: Postgres matches
    // and writes in one statement, so nothing can change in between.
    const { client, calls } = stubClient({ data: MARKER_ROW })

    await updateMarker(client, MARKER_ID, { name: 'Nishiki' }, VERSION)

    expect(calls.eqAfterUpdate).toHaveBeenCalledWith('id', MARKER_ID)
    expect(calls.eqAfterUpdate).toHaveBeenCalledWith('updated_at', VERSION)
  })

  it('reports a conflict when the row is still there but has moved on', async () => {
    // Nothing matched, and asking afterwards finds the row present — so
    // somebody else changed it.
    const { client } = stubClient(
      { error: { message: 'no rows' } },
      { data: { updated_at: '2026-08-11T00:00:00.000Z' } },
    )

    const outcome = await updateMarker(client, MARKER_ID, { name: 'Nishiki' }, VERSION)

    if (outcome.ok) throw new Error('expected a refusal')
    expect(outcome.kind).toBe('conflict')
  })

  it('does not call a deleted marker a conflict', async () => {
    // The same failed match, and asking afterwards finds nothing. Telling
    // somebody to go and look at another version of a place that no longer
    // exists would send them after something unfindable.
    const { client } = stubClient({ error: { message: 'no rows' } }, { data: null })

    const outcome = await updateMarker(client, MARKER_ID, { name: 'Nishiki' }, VERSION)

    if (outcome.ok) throw new Error('expected a refusal')
    expect(outcome.kind).toBe('rejected')
  })

  it('leaves an uncontested edit alone', async () => {
    const { client } = stubClient({ data: MARKER_ROW })

    const outcome = await updateMarker(client, MARKER_ID, { name: 'Nishiki' }, VERSION)

    expect(outcome.ok).toBe(true)
  })

  it('tells the three refusals apart without reading a message', async () => {
    // The reason `conflict` is its own kind rather than a `rejected` with
    // recognisable wording: matching on a string puts the meaning in prose, and
    // the first reword breaks the branch silently.
    const invalid = await updateMarker(
      stubClient({ data: MARKER_ROW }).client,
      MARKER_ID,
      { name: '' },
      VERSION,
    )
    const conflict = await updateMarker(
      stubClient({ error: { message: 'no rows' } }, { data: { updated_at: 'x' } }).client,
      MARKER_ID,
      { name: 'Nishiki' },
      VERSION,
    )
    const refused = await updateMarker(
      stubClient({ error: { message: 'permission denied' } }).client,
      MARKER_ID,
      { name: 'Nishiki' },
      VERSION,
    )

    const kinds = [invalid, conflict, refused].map((o) => (o.ok ? 'ok' : o.kind))
    expect(kinds).toEqual(['invalid-input', 'conflict', 'rejected'])
    expect(new Set(kinds).size).toBe(3)
  })
})

describe('deleteMarker', () => {
  it('returns the id so a caller can drop the right row', async () => {
    const { client } = stubClient()

    const outcome = await deleteMarker(client, MARKER_ID)

    expect(outcome).toEqual({ ok: true, data: MARKER_ID })
  })

  it('reports a refusal', async () => {
    const { client } = stubClient({ error: { message: 'permission denied' } })

    const outcome = await deleteMarker(client, MARKER_ID)

    if (outcome.ok) throw new Error('expected a rejection')
    expect(outcome.kind).toBe('rejected')
  })
})

describe('createCity', () => {
  it('returns the stored row so the form can select it immediately', async () => {
    const { client } = stubClient({ data: CITY_ROW })

    const outcome = await createCity(client, {
      tripId: TRIP_ID,
      name: 'Kyoto',
      currency: 'JPY',
    })

    if (!outcome.ok) throw new Error('unreachable')
    expect(outcome.data).toMatchObject({ id: CITY_ID, name: 'Kyoto', currency: 'JPY' })
  })

  it('accepts a city with no currency', async () => {
    const { client } = stubClient({ data: { ...CITY_ROW, currency: null } })

    const outcome = await createCity(client, {
      tripId: TRIP_ID,
      name: 'Kyoto',
      currency: null,
    })

    if (!outcome.ok) throw new Error('unreachable')
    expect(outcome.data.currency).toBeNull()
  })

  it('rejects a currency that is not a three-letter code', async () => {
    const { client, calls } = stubClient({ data: CITY_ROW })

    const outcome = await createCity(client, {
      tripId: TRIP_ID,
      name: 'Kyoto',
      currency: 'yen',
    })

    if (outcome.ok || outcome.kind !== 'invalid-input') {
      throw new Error('expected invalid input')
    }
    expect(outcome.fieldErrors.currency).toBeDefined()
    expect(calls.from).not.toHaveBeenCalled()
  })
})

describe('updateCity', () => {
  it('sets a currency on a city that had none', async () => {
    const { client, calls } = stubClient({ data: CITY_ROW })

    const outcome = await updateCity(client, CITY_ID, { currency: 'JPY' })

    expect(calls.update).toHaveBeenCalledWith({ currency: 'JPY' })
    expect(outcome.ok).toBe(true)
  })

  it('refuses to move a city to another trip', async () => {
    const { client, calls } = stubClient({ data: CITY_ROW })

    await updateCity(client, CITY_ID, { tripId: MARKER_ID, name: 'Osaka' })

    expect(calls.update).toHaveBeenCalledWith({ name: 'Osaka' })
  })
})

const MEMBER_ROW = {
  id: '44444444-4444-4444-8444-444444444444',
  trip_id: '22222222-2222-4222-8222-222222222222',
  display_name: 'Julieta',
  email: 'julieta@example.com',
  user_id: null,
  created_at: '2026-08-21T00:00:00.000Z',
}

describe('inviteMember', () => {
  it('adds a member with no account attached', async () => {
    const { client, calls } = stubClient({ data: MEMBER_ROW })

    const outcome = await inviteMember(client, {
      tripId: MEMBER_ROW.trip_id,
      displayName: 'Julieta',
      email: 'julieta@example.com',
    })

    expect(outcome.ok).toBe(true)
    if (!outcome.ok) throw new Error('unreachable')
    // `user_id` null is the invitation. Nothing is sent, and nothing is
    // pending anywhere else — the address is the whole mechanism, and
    // `claim_trip_memberships()` links it at the next sign-in.
    expect(outcome.data.userId).toBeNull()
    expect(calls.insert).toHaveBeenCalledWith({
      trip_id: MEMBER_ROW.trip_id,
      display_name: 'Julieta',
      email: 'julieta@example.com',
    })
  })

  it('rejects an address that is not one', async () => {
    const { client, calls } = stubClient({ data: MEMBER_ROW })

    const outcome = await inviteMember(client, {
      tripId: MEMBER_ROW.trip_id,
      displayName: 'Julieta',
      email: 'not-an-address',
    })

    expect(outcome.ok).toBe(false)
    if (outcome.ok) throw new Error('unreachable')
    expect(outcome.kind).toBe('invalid-input')
    expect(calls.insert).not.toHaveBeenCalled()
  })

  it('names the email field when the address is already on the trip', async () => {
    // 23505 is the unique index on (trip_id, lower(email)). Matched on the
    // code, never on the message: a string is not a contract.
    const { client } = stubClient({ error: { code: '23505', message: 'dup' } })

    const outcome = await inviteMember(client, {
      tripId: MEMBER_ROW.trip_id,
      displayName: 'Julieta',
      email: 'julieta@example.com',
    })

    expect(outcome).toEqual({
      ok: false,
      kind: 'invalid-input',
      fieldErrors: { email: MEMBER_DUPLICATE_MESSAGE },
    })
  })

  it('reports any other refusal as a message, not as a field error', async () => {
    // What a non-member attempting to invite looks like from here: the insert
    // policy refuses it, and that is not something to mark a field up about.
    const { client } = stubClient({ error: { code: '42501', message: 'denied' } })

    const outcome = await inviteMember(client, {
      tripId: MEMBER_ROW.trip_id,
      displayName: 'Julieta',
      email: 'julieta@example.com',
    })

    expect(outcome.ok).toBe(false)
    if (outcome.ok) throw new Error('unreachable')
    expect(outcome.kind).toBe('rejected')
  })
})
