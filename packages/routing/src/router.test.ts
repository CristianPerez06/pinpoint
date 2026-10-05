import { describe, expect, it, vi } from 'vitest'

import osrmWalk from './fixtures/osrm-walk.json'
import valhallaWalk from './fixtures/valhalla-walk.json'
import {
  createRouter,
  MIN_INTERVAL_MS,
  osrmService,
  roundStart,
  stadiaService,
  valhallaService,
} from './router'
import type { Fetcher } from './types'

const PERSON = { lng: 135.785, lat: 34.9948 }
const PLACE = { lng: 135.7727, lat: 34.9671 }

function reply(status: number, body: unknown) {
  return { ok: status >= 200 && status < 300, status, json: async () => body }
}

type Service = 'stadia' | 'valhalla' | 'osrm'

function serviceOf(url: string): Service {
  if (url.includes('stadiamaps')) return 'stadia'
  return url.includes('valhalla') ? 'valhalla' : 'osrm'
}

/** A fetcher answering per service, recording every call. */
function services(answers: Partial<Record<Service, () => unknown>>) {
  const calls: { url: string; service: Service; headers?: Record<string, string> }[] = []
  const fetcher = vi.fn<Fetcher>(async (url, init) => {
    calls.push({ url, service: serviceOf(url), headers: init?.headers })
    const answer = answers[serviceOf(url)]
    if (!answer) throw new Error('network down')
    return answer() as ReturnType<typeof reply>
  })
  return { fetcher, calls }
}

/** The order both applications ask in, with the headers they send. */
const ALL = [
  stadiaService({ apiKey: 'key' }),
  valhallaService({ headers: { 'X-Client-Id': 'pinpoint' } }),
  osrmService(),
]

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
  it('returns Stadia’s route and asks nobody else', async () => {
    const { fetcher, calls } = services({ stadia: () => reply(200, valhallaWalk) })
    const result = await createRouter(fetcher, { ...clock(), services: ALL })(PERSON, PLACE, 'walk')
    expect(result.kind).toBe('ready')
    expect(calls.map((call) => call.service)).toEqual(['stadia'])
    expect(calls[0].url).toContain('api_key=key')
    expect(calls[0].headers).toEqual({})
  })

  it.each([
    ['a bad key', () => reply(401, { error: 'No valid authentication provided.' })],
    ['a used-up allowance', () => reply(429, null)],
    ['an outage', () => reply(503, null)],
  ])('falls back to Valhalla on %s, with Valhalla’s own headers', async (_name, stadia) => {
    const { fetcher, calls } = services({ stadia, valhalla: () => reply(200, valhallaWalk) })
    const result = await createRouter(fetcher, { ...clock(), services: ALL })(PERSON, PLACE, 'walk')
    expect(result.kind).toBe('ready')
    expect(calls.map((call) => call.service)).toEqual(['stadia', 'valhalla'])
    expect(calls[1].headers).toEqual({ 'X-Client-Id': 'pinpoint' })
  })

  it('falls back to OSRM when Stadia and Valhalla both fail, a second apart each time', async () => {
    const { fetcher, calls } = services({
      stadia: () => reply(503, null),
      valhalla: () => reply(503, null),
      osrm: () => reply(200, osrmWalk),
    })
    const time = clock()
    const result = await createRouter(fetcher, { ...time, services: ALL })(PERSON, PLACE, 'walk')
    expect(result.kind === 'ready' && Math.round(result.route.minutes)).toBe(58)
    expect(calls.map((call) => call.service)).toEqual(['stadia', 'valhalla', 'osrm'])
    expect(calls[2].headers).toEqual({})
    expect(time.waits).toEqual([MIN_INTERVAL_MS, MIN_INTERVAL_MS])
  })

  it('takes Stadia’s "no way" as the answer', async () => {
    const { fetcher, calls } = services({
      stadia: () => reply(400, { error_code: 154, error: 'Path distance exceeds the max distance limit' }),
      valhalla: () => reply(200, valhallaWalk),
    })
    const result = await createRouter(fetcher, { ...clock(), services: ALL })(PERSON, PLACE, 'car')
    expect(result).toEqual({ kind: 'none' })
    expect(calls).toHaveLength(1)
  })

  it('takes Valhalla’s "no way" as the answer', async () => {
    const { fetcher, calls } = services({
      valhalla: () => reply(400, { error_code: 442, error: 'No path could be found for input' }),
      osrm: () => reply(200, osrmWalk),
    })
    const result = await createRouter(fetcher, { ...clock(), services: ALL })(PERSON, PLACE, 'car')
    expect(result).toEqual({ kind: 'none' })
    expect(calls.map((call) => call.service)).toEqual(['stadia', 'valhalla'])
  })

  it('reports failure when none answers', async () => {
    const { fetcher, calls } = services({})
    expect(await createRouter(fetcher, { ...clock(), services: ALL })(PERSON, PLACE, 'bike')).toEqual({
      kind: 'failed',
    })
    expect(calls).toHaveLength(3)
  })

  it('spaces requests at least a second apart', async () => {
    const { fetcher } = services({ stadia: () => reply(200, valhallaWalk) })
    const time = clock()
    const route = createRouter(fetcher, { ...time, services: ALL })
    await route(PERSON, PLACE, 'walk')
    time.advance(300)
    await route(PERSON, PLACE, 'bike')
    expect(time.waits).toEqual([700])
  })

  it('does not ask again for a route it was given, from a few metres away', async () => {
    const { fetcher, calls } = services({ stadia: () => reply(200, valhallaWalk) })
    const route = createRouter(fetcher, { ...clock(), services: ALL })
    // From the middle of a 50 m square, so ten metres cannot cross its edge.
    const middle = roundStart(PERSON)
    await route(middle, PLACE, 'walk')
    // About 10 metres north: the same square.
    const second = await route({ ...middle, lat: middle.lat + 0.00009 }, PLACE, 'walk')
    expect(second.kind).toBe('ready')
    expect(calls).toHaveLength(1)
  })

  it('asks again for another way of travelling', async () => {
    const { fetcher, calls } = services({ stadia: () => reply(200, valhallaWalk) })
    const route = createRouter(fetcher, { ...clock(), services: ALL })
    await route(PERSON, PLACE, 'walk')
    await route(PERSON, PLACE, 'car')
    expect(calls).toHaveLength(2)
  })

  it('asks again after a failure, but not after "no way"', async () => {
    let stadia = () => reply(503, null)
    const { fetcher, calls } = services({ stadia: () => stadia() })
    const route = createRouter(fetcher, { ...clock(), services: ALL })
    await route(PERSON, PLACE, 'walk') // Stadia 503, the others throw: failed
    stadia = () => reply(400, { error_code: 442 })
    await route(PERSON, PLACE, 'walk') // asked again: none
    await route(PERSON, PLACE, 'walk') // remembered
    expect(calls.filter((call) => call.service === 'stadia')).toHaveLength(2)
  })

  it('gives up at the deadline', async () => {
    vi.useFakeTimers()
    const fetcher: Fetcher = (_url, init) =>
      new Promise((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => reject(new Error('aborted')))
      })
    const pending = createRouter(fetcher, { timeoutMs: 8000, services: ALL })(PERSON, PLACE, 'walk')
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
    const pending = createRouter(fetcher, { ...clock(), services: ALL })(PERSON, PLACE, 'walk', { signal: controller.signal })
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
