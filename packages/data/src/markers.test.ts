import type { PinpointClient } from '@pinpoint/supabase'
import { describe, expect, it, vi } from 'vitest'

import { fetchTripMarkers, MARKERS_FAILED_MESSAGE } from './markers'

/**
 * A client that records the query it was handed and answers with a fixed
 * response. The point of these tests is the contract around the database, not
 * the database: that emptiness, failure and data are three distinguishable
 * answers, and that no filtering is done here that policy should be doing.
 */
function stubClient(response: { data?: unknown[] | null; error?: unknown }) {
  const result = {
    data: response.data === undefined ? [] : response.data,
    error: response.error ?? null,
  }

  // `.order()` chains and the chain is also awaitable, which is what a real
  // query builder does. A stub whose `.order()` resolved could not tell a
  // single ordering from two.
  const builder: Record<string, unknown> = {
    then: (resolve: (value: typeof result) => unknown) =>
      Promise.resolve(result).then(resolve),
  }
  const order = vi.fn(() => builder)
  builder.order = order

  const eq = vi.fn(() => builder)
  const select = vi.fn(() => ({ eq }))
  const from = vi.fn(() => ({ select }))

  return {
    client: { from } as unknown as PinpointClient,
    calls: { from, select, eq, order },
  }
}

const ROW = {
  id: '11111111-1111-4111-8111-111111111111',
  trip_id: '22222222-2222-4222-8222-222222222222',
  city_id: null,
  name: 'Fushimi Inari Taisha',
  note: 'The torii gates.',
  lng: 135.7727,
  lat: 34.9671,
  type: 'temple',
  link: null,
  price: 0,
  visited: false,
  created_at: '2026-08-08T00:00:00.000Z',
  updated_at: '2026-08-09T00:00:00.000Z',
}

describe('fetchTripMarkers', () => {
  it('returns the markers of the trip', async () => {
    const { client } = stubClient({ data: [ROW] })

    const state = await fetchTripMarkers(client, ROW.trip_id)

    expect(state.status).toBe('ready')
    if (state.status !== 'ready') throw new Error('unreachable')
    expect(state.data).toHaveLength(1)
    expect(state.data[0]).toMatchObject({
      id: ROW.id,
      tripId: ROW.trip_id,
      cityId: null,
      name: 'Fushimi Inari Taisha',
      lng: 135.7727,
      lat: 34.9671,
      type: 'temple',
      createdAt: ROW.created_at,
      // Deliberately a different value from `created_at`, so this asserts the
      // column made it through rather than passing on a coincidence. With
      // `toMatchObject` a missing field is simply absent, so a fixture without
      // one would have gone on passing after the column was added.
      updatedAt: ROW.updated_at,
    })
  })

  it('reports a trip with no markers as empty, not as a failure', async () => {
    const { client } = stubClient({ data: [] })

    expect(await fetchTripMarkers(client, ROW.trip_id)).toEqual({ status: 'empty' })
  })

  it('reports a failure as failed, not as empty', async () => {
    const { client } = stubClient({ data: null, error: { message: 'connection reset' } })

    const state = await fetchTripMarkers(client, ROW.trip_id)

    expect(state.status).toBe('failed')
    if (state.status !== 'failed') throw new Error('unreachable')
    expect(state.message).toBe(MARKERS_FAILED_MESSAGE)
    // The database's own words are for whoever reads logs, not for whoever is
    // looking at a map that will not load.
    expect(state.message).not.toContain('connection reset')
  })

  it('keeps a marker whose stored type is unknown', async () => {
    // The column is unconstrained text. Validating on read would take the whole
    // trip down over one row written by a newer version of the app.
    const { client } = stubClient({ data: [{ ...ROW, type: 'onsen' }] })

    const state = await fetchTripMarkers(client, ROW.trip_id)

    expect(state.status).toBe('ready')
    if (state.status !== 'ready') throw new Error('unreachable')
    expect(state.data[0]!.type).toBe('onsen')
  })

  it('asks the database for one trip and nothing else', async () => {
    const { client, calls } = stubClient({ data: [ROW] })

    await fetchTripMarkers(client, ROW.trip_id)

    expect(calls.from).toHaveBeenCalledWith('markers')
    expect(calls.eq).toHaveBeenCalledWith('trip_id', ROW.trip_id)
  })

  it('orders deterministically, so two platforms cannot disagree', () => {
    // A bulk import writes every row in one statement, so `created_at` ties to
    // the microsecond and alone leaves the order to the planner.
    const { client, calls } = stubClient({ data: [ROW] })
    void fetchTripMarkers(client, ROW.trip_id)

    expect(calls.order).toHaveBeenNthCalledWith(1, 'created_at', { ascending: true })
    expect(calls.order).toHaveBeenNthCalledWith(2, 'id', { ascending: true })
  })
})
