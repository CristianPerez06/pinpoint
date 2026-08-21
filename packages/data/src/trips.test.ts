import type { PinpointClient } from '@pinpoint/supabase'
import { describe, expect, it, vi } from 'vitest'

import {
  createTrip,
  fetchTrips,
  TRIP_CREATE_FAILED_MESSAGE,
  TRIP_SAVE_FAILED_MESSAGE,
  TRIPS_FAILED_MESSAGE,
  updateTrip,
} from './trips'

function stubClient(response: { data?: unknown[] | null; error?: unknown }) {
  const result = {
    data: response.data === undefined ? [] : response.data,
    error: response.error ?? null,
  }

  const builder: Record<string, unknown> = {
    then: (resolve: (value: typeof result) => unknown) =>
      Promise.resolve(result).then(resolve),
  }
  const order = vi.fn(() => builder)
  builder.order = order

  const select = vi.fn(() => builder)
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

  it('orders deterministically — the first row is the trip the map draws', () => {
    const { client, calls } = stubClient({ data: [ROW] })
    void fetchTrips(client)

    expect(calls.order).toHaveBeenNthCalledWith(1, 'created_at', { ascending: true })
    expect(calls.order).toHaveBeenNthCalledWith(2, 'id', { ascending: true })
  })
})

/**
 * A client for the write paths, which read a single row back rather than a list.
 *
 * `rpc` is separate from `from` because creating a trip is the one write in this
 * package that does not go through a table at all — it calls a function, and the
 * point of the test is that it does.
 */
function stubWriteClient(options: {
  rpc?: { data?: unknown; error?: unknown }
  row?: { data?: unknown; error?: unknown }
}) {
  const rpcResult = {
    data: options.rpc?.data ?? null,
    error: options.rpc?.error ?? null,
  }
  const rowResult = {
    data: options.row?.data ?? null,
    error: options.row?.error ?? null,
  }

  const single = vi.fn(() => Promise.resolve(rowResult))
  const builder: Record<string, unknown> = { single }
  const eq = vi.fn(() => builder)
  const select = vi.fn(() => builder)
  builder.eq = eq
  builder.select = select

  const update = vi.fn(() => builder)
  const from = vi.fn(() => ({ select, update, eq }))
  const rpc = vi.fn(() => Promise.resolve(rpcResult))

  return {
    client: { from, rpc } as unknown as PinpointClient,
    calls: { from, rpc, update, select, eq, single },
  }
}

describe('createTrip', () => {
  it('creates through the database function, not an insert', async () => {
    const { client, calls } = stubWriteClient({
      rpc: { data: ROW.id },
      row: { data: ROW },
    })

    const outcome = await createTrip(client, {
      name: 'Japan',
      displayName: 'Cristian',
    })

    expect(outcome.ok).toBe(true)
    expect(calls.rpc).toHaveBeenCalledWith('create_trip', {
      trip_name: 'Japan',
      member_name: 'Cristian',
    })
    // The whole design in one assertion: `trips` has no insert policy, so a
    // trip that arrived by insert would mean the function had been bypassed.
    expect(calls.from).not.toHaveBeenCalledWith('trip_members')
  })

  it('never sends an email address', async () => {
    const { client, calls } = stubWriteClient({
      rpc: { data: ROW.id },
      row: { data: ROW },
    })

    await createTrip(client, { name: 'Japan', displayName: 'Cristian' })

    // The function reads the address from the verified session. Passing one
    // would make creating a trip as somebody else a matter of typing.
    const [, args] = calls.rpc.mock.calls[0] as [string, Record<string, unknown>]
    expect(Object.keys(args).sort()).toEqual(['member_name', 'trip_name'])
  })

  it('rejects a trip with no name for the creator', async () => {
    const { client, calls } = stubWriteClient({ rpc: { data: ROW.id } })

    const outcome = await createTrip(client, { name: 'Japan' })

    expect(outcome.ok).toBe(false)
    if (outcome.ok) throw new Error('unreachable')
    expect(outcome.kind).toBe('invalid-input')
    expect(calls.rpc).not.toHaveBeenCalled()
  })

  it('treats a null trip id as a refusal', async () => {
    // What the function returns when there is no session: no error, no row.
    const { client } = stubWriteClient({ rpc: { data: null } })

    const outcome = await createTrip(client, {
      name: 'Japan',
      displayName: 'Cristian',
    })

    expect(outcome).toEqual({
      ok: false,
      kind: 'rejected',
      message: TRIP_CREATE_FAILED_MESSAGE,
    })
  })

  it('reports a failure to read the created trip back', async () => {
    const { client } = stubWriteClient({
      rpc: { data: ROW.id },
      row: { error: { message: 'nope' } },
    })

    const outcome = await createTrip(client, {
      name: 'Japan',
      displayName: 'Cristian',
    })

    expect(outcome.ok).toBe(false)
  })
})

describe('updateTrip', () => {
  it('renames a trip', async () => {
    const { client, calls } = stubWriteClient({
      row: { data: { ...ROW, name: 'Japan 2027' } },
    })

    const outcome = await updateTrip(client, ROW.id, { name: 'Japan 2027' })

    expect(outcome.ok).toBe(true)
    if (!outcome.ok) throw new Error('unreachable')
    expect(outcome.data.name).toBe('Japan 2027')
    expect(calls.update).toHaveBeenCalledWith({ name: 'Japan 2027' })
  })

  it('rejects an empty name', async () => {
    const { client, calls } = stubWriteClient({ row: { data: ROW } })

    const outcome = await updateTrip(client, ROW.id, { name: '' })

    expect(outcome.ok).toBe(false)
    expect(calls.update).not.toHaveBeenCalled()
  })

  it('does not write archived, even when asked', async () => {
    const { client, calls } = stubWriteClient({ row: { data: ROW } })

    await updateTrip(client, ROW.id, { name: 'Japan', archived: true })

    // Archiving is the answer to removing a trip and is its own change. The
    // schema permits it; nothing here offers it yet.
    expect(calls.update).toHaveBeenCalledWith({ name: 'Japan' })
  })

  it('reports a refusal', async () => {
    const { client } = stubWriteClient({ row: { error: { message: 'nope' } } })

    const outcome = await updateTrip(client, ROW.id, { name: 'Japan 2027' })

    expect(outcome).toEqual({
      ok: false,
      kind: 'rejected',
      message: TRIP_SAVE_FAILED_MESSAGE,
    })
  })
})
