import { describe, expect, it, vi } from 'vitest'

import osrmWalk from './fixtures/osrm-walk.json'
import valhallaWalk from './fixtures/valhalla-walk.json'
import { createRouter, MIN_INTERVAL_MS, roundStart } from './router'
import type { Fetcher } from './types'

const PERSON = { lng: 135.785, lat: 34.9948 }
const PLACE = { lng: 135.7727, lat: 34.9671 }

function reply(status: number, body: unknown) {
  return { ok: status >= 200 && status < 300, status, json: async () => body }
}

/** A fetcher answering per service, recording every call. */
function services(answers: { valhalla?: () => unknown; osrm?: () => unknown }) {
  const calls: { url: string; headers?: Record<string, string> }[] = []
  const fetcher = vi.fn<Fetcher>(async (url, init) => {
    calls.push({ url, headers: init?.headers })
    const answer = url.includes('valhalla') ? answers.valhalla : answers.osrm
    if (!answer) throw new Error('network down')
    return answer() as ReturnType<typeof reply>
  })
  return { fetcher, calls }
}

/** A clock the test moves, and a wait that moves it. */
function clock() {
  let time = 0
  const waits: number[] = []
  return {
    now: () => time,
    wait: async (ms: number) => {
      waits.push(ms)
      time += ms
    },
    advance: (ms: number) => {
      time += ms
    },
    waits,
  }
}

describe('createRouter', () => {
  it('returns Valhalla’s route and does not ask OSRM', async () => {
    const { fetcher, calls } = services({ valhalla: () => reply(200, valhallaWalk) })
    const route = createRouter(fetcher, { ...clock(), valhallaHeaders: { 'X-Client-Id': 'pinpoint' } })
    const result = await route(PERSON, PLACE, 'walk')
    expect(result.kind).toBe('ready')
    expect(calls).toHaveLength(1)
    expect(calls[0].headers).toEqual({ 'X-Client-Id': 'pinpoint' })
  })

  it('falls back to OSRM when Valhalla fails, with OSRM’s own headers', async () => {
    const { fetcher, calls } = services({
      valhalla: () => reply(503, null),
      osrm: () => reply(200, osrmWalk),
    })
    const time = clock()
    const route = createRouter(fetcher, { ...time, valhallaHeaders: { 'X-Client-Id': 'pinpoint' } })
    const result = await route(PERSON, PLACE, 'walk')
    expect(result.kind === 'ready' && Math.round(result.route.minutes)).toBe(58)
    expect(calls.map((call) => call.url.includes('valhalla'))).toEqual([true, false])
    expect(calls[1].headers).toEqual({})
    // The second request waited out the rest of the second.
    expect(time.waits).toEqual([MIN_INTERVAL_MS])
  })

  it('takes Valhalla’s "no way" as the answer', async () => {
    const { fetcher, calls } = services({
      valhalla: () => reply(400, { error_code: 442, error: 'No path could be found for input' }),
      osrm: () => reply(200, osrmWalk),
    })
    const result = await createRouter(fetcher, clock())(PERSON, PLACE, 'car')
    expect(result).toEqual({ kind: 'none' })
    expect(calls).toHaveLength(1)
  })

  it('reports failure when neither answers', async () => {
    const { fetcher } = services({})
    expect(await createRouter(fetcher, clock())(PERSON, PLACE, 'bike')).toEqual({ kind: 'failed' })
  })

  it('spaces requests at least a second apart', async () => {
    const { fetcher } = services({ valhalla: () => reply(200, valhallaWalk) })
    const time = clock()
    const route = createRouter(fetcher, time)
    await route(PERSON, PLACE, 'walk')
    time.advance(300)
    await route(PERSON, PLACE, 'bike')
    expect(time.waits).toEqual([700])
  })

  it('does not ask again for a route it was given, from a few metres away', async () => {
    const { fetcher, calls } = services({ valhalla: () => reply(200, valhallaWalk) })
    const route = createRouter(fetcher, clock())
    // From the middle of a 50 m square, so ten metres cannot cross its edge.
    const middle = roundStart(PERSON)
    await route(middle, PLACE, 'walk')
    // About 10 metres north: the same square.
    const second = await route({ ...middle, lat: middle.lat + 0.00009 }, PLACE, 'walk')
    expect(second.kind).toBe('ready')
    expect(calls).toHaveLength(1)
  })

  it('asks again for another way of travelling', async () => {
    const { fetcher, calls } = services({ valhalla: () => reply(200, valhallaWalk) })
    const route = createRouter(fetcher, clock())
    await route(PERSON, PLACE, 'walk')
    await route(PERSON, PLACE, 'car')
    expect(calls).toHaveLength(2)
  })

  it('asks again after a failure, but not after "no way"', async () => {
    let valhalla = () => reply(503, null)
    const { fetcher, calls } = services({ valhalla: () => valhalla() })
    const route = createRouter(fetcher, clock())
    await route(PERSON, PLACE, 'walk') // Valhalla 503, OSRM throws: failed
    valhalla = () => reply(400, { error_code: 442 })
    await route(PERSON, PLACE, 'walk') // asked again: none
    await route(PERSON, PLACE, 'walk') // remembered
    expect(calls.filter((call) => call.url.includes('valhalla'))).toHaveLength(2)
  })

  it('gives up at the deadline', async () => {
    vi.useFakeTimers()
    const fetcher: Fetcher = (_url, init) =>
      new Promise((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => reject(new Error('aborted')))
      })
    const pending = createRouter(fetcher, { timeoutMs: 8000 })(PERSON, PLACE, 'walk')
    await vi.advanceTimersByTimeAsync(8000)
    expect(await pending).toEqual({ kind: 'failed' })
    vi.useRealTimers()
  })

  it('says aborted, not failed, when the caller stops wanting it', async () => {
    const controller = new AbortController()
    const fetcher: Fetcher = (_url, init) =>
      new Promise((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => reject(new Error('aborted')))
      })
    const pending = createRouter(fetcher, clock())(PERSON, PLACE, 'walk', { signal: controller.signal })
    controller.abort()
    expect(await pending).toEqual({ kind: 'aborted' })
  })
})

describe('roundStart', () => {
  it('moves the start by at most about 35 metres', () => {
    const rounded = roundStart(PERSON)
    const dLat = (rounded.lat - PERSON.lat) * 111_320
    const dLng = (rounded.lng - PERSON.lng) * 111_320 * Math.cos((PERSON.lat * Math.PI) / 180)
    expect(Math.hypot(dLat, dLng)).toBeLessThan(36)
  })
})
