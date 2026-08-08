import type { PinpointClient } from '@pinpoint/supabase'
import { describe, expect, it, vi } from 'vitest'

import { fetchTrips, TRIPS_FAILED_MESSAGE } from './trips'

function stubClient(response: { data?: unknown[] | null; error?: unknown }) {
  const order = vi.fn().mockResolvedValue({
    data: response.data === undefined ? [] : response.data,
    error: response.error ?? null,
  })
  const select = vi.fn(() => ({ order }))
  const from = vi.fn(() => ({ select }))

  return {
    client: { from } as unknown as PinpointClient,
    calls: { from, select, order },
  }
}

const ROW = {
  id: '22222222-2222-4222-8222-222222222222',
  name: 'Japan',
  archived: false,
  created_at: '2026-08-03T00:00:00.000Z',
}

describe('fetchTrips', () => {
  it('returns the trips the account is a member of', async () => {
    const { client } = stubClient({ data: [ROW] })

    const state = await fetchTrips(client)

    expect(state.status).toBe('ready')
    if (state.status !== 'ready') throw new Error('unreachable')
    expect(state.data[0]).toEqual({
      id: ROW.id,
      name: 'Japan',
      archived: false,
      createdAt: ROW.created_at,
    })
  })

  it('reports an account on no trips as empty, not as a failure', async () => {
    const { client } = stubClient({ data: [] })

    expect(await fetchTrips(client)).toEqual({ status: 'empty' })
  })

  it('reports a failure as failed', async () => {
    const { client } = stubClient({ data: null, error: { message: 'nope' } })

    expect(await fetchTrips(client)).toEqual({
      status: 'failed',
      message: TRIPS_FAILED_MESSAGE,
    })
  })

  it('does not filter by the reader — that is what policy is for', async () => {
    const { client, calls } = stubClient({ data: [ROW] })

    await fetchTrips(client)

    expect(calls.from).toHaveBeenCalledWith('trips')
    // No `.eq()` in the chain at all: the stub would throw if one were called.
    expect(calls.select).toHaveBeenCalledTimes(1)
  })
})
