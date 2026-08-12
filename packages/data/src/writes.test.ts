import type { PinpointClient } from '@pinpoint/supabase'
import { describe, expect, it, vi } from 'vitest'

import { createCity, updateCity } from './cities'
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
function stubClient(response: { data?: unknown; error?: unknown } = {}) {
  const result = {
    data: response.data === undefined ? null : response.data,
    error: response.error ?? null,
  }

  const single = vi.fn(() => Promise.resolve(result))
  const select = vi.fn(() => ({ single }))
  const insert = vi.fn(() => ({ select }))
  const eqAfterUpdate = vi.fn(() => ({ select }))
  const update = vi.fn(() => ({ eq: eqAfterUpdate }))
  const eqAfterDelete = vi.fn(() => Promise.resolve(result))
  const del = vi.fn(() => ({ eq: eqAfterDelete }))
  const from = vi.fn(() => ({ insert, update, delete: del, select }))

  return {
    client: { from } as unknown as PinpointClient,
    calls: { from, insert, update, del, select, single, eqAfterUpdate, eqAfterDelete },
  }
}

const TRIP_ID = '22222222-2222-4222-8222-222222222222'
const CITY_ID = '33333333-3333-4333-8333-333333333333'
const MARKER_ID = '11111111-1111-4111-8111-111111111111'

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

    await updateMarker(client, MARKER_ID, { name: 'Nishiki' })

    expect(calls.update).toHaveBeenCalledWith({ name: 'Nishiki' })
  })

  it('distinguishes clearing a field from leaving it alone', async () => {
    const { client, calls } = stubClient({ data: MARKER_ROW })

    await updateMarker(client, MARKER_ID, { note: null })

    expect(calls.update).toHaveBeenCalledWith({ note: null })
  })

  it('refuses to move a marker to another trip', async () => {
    // Every access rule resolves to the trip a row belongs to, so an edit that
    // could change it is an edit that could put the row out of reach.
    const { client, calls } = stubClient({ data: MARKER_ROW })

    await updateMarker(client, MARKER_ID, { tripId: CITY_ID, name: 'Nishiki' })

    expect(calls.update).toHaveBeenCalledWith({ name: 'Nishiki' })
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
