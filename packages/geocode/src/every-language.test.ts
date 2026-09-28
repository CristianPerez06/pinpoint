import { describe, expect, it } from 'vitest'

import { createEveryLanguageSearch, MIN_INTERVAL_MS } from './every-language'
import { SEARCH_FAILED_MESSAGE } from './search'
import type { Fetcher } from './types'

const eiffel = {
  osm_type: 'way',
  osm_id: 5013364,
  lat: '48.8582599',
  lon: '2.2945006',
  category: 'man_made',
  type: 'tower',
  name: 'Eiffel Tower',
  address: { city: 'Paris', country: 'France' },
}

/**
 * A clock that only moves when told to, and a wait that moves it.
 *
 * Every wait is recorded, so a test can say how long a request was held back
 * without any real time passing and without replacing a global timer.
 */
function harness(respond: (url: string) => Promise<unknown> = () => Promise.resolve([eiffel])) {
  let clock = 10_000
  const waits: number[] = []
  const sent: { url: string; at: number }[] = []

  const fetcher: Fetcher = async (url, init) => {
    if (init?.signal?.aborted) {
      const error = new Error('Aborted')
      error.name = 'AbortError'
      throw error
    }
    sent.push({ url, at: clock })
    const payload = await respond(url)
    return { ok: true, status: 200, json: () => Promise.resolve(payload) }
  }

  const search = createEveryLanguageSearch(fetcher, {
    now: () => clock,
    // Wakes at the moment it was asked to, so two waits begun together end a
    // second apart rather than adding up.
    wait: async (ms, signal) => {
      const wakeAt = clock + ms
      waits.push(ms)
      // A real wait returns before any time passes; so does this one.
      await Promise.resolve()
      if (signal?.aborted) {
        const error = new Error('Aborted')
        error.name = 'AbortError'
        throw error
      }
      clock = Math.max(clock, wakeAt)
    },
  })

  return {
    search,
    waits,
    sent,
    advance: (ms: number) => {
      clock += ms
    },
  }
}

describe('createEveryLanguageSearch', () => {
  it('finds a place by a name Photon does not know', async () => {
    const { search } = harness()
    const result = await search('Torre Eiffel')
    expect(result.status).toBe('ready')
    if (result.status === 'ready') expect(result.candidates[0]?.name).toBe('Eiffel Tower')
  })

  it('does not call the service for a blank query', async () => {
    const { search, sent } = harness()
    expect((await search('   ')).status).toBe('empty')
    expect(sent).toHaveLength(0)
  })

  it('holds a second request until a second has passed', async () => {
    const { search, sent, waits, advance } = harness()
    await search('Torre Eiffel')
    advance(300)
    await search('Coliseo')

    expect(waits).toEqual([MIN_INTERVAL_MS - 300])
    expect(sent).toHaveLength(2)
    expect(sent[1]!.at - sent[0]!.at).toBeGreaterThanOrEqual(MIN_INTERVAL_MS)
  })

  it('spaces submits waiting at the same time from each other', async () => {
    // Three at once: the first leaves now, and the other two are held one and
    // two seconds — not both one, which would send them together.
    const { search, sent, waits } = harness()
    await Promise.all([search('a'), search('b'), search('c')])
    expect(waits).toEqual([MIN_INTERVAL_MS, 2 * MIN_INTERVAL_MS])
    expect(sent).toHaveLength(3)
  })

  it('does not wait when a second has already passed', async () => {
    const { search, waits, advance } = harness()
    await search('Torre Eiffel')
    advance(MIN_INTERVAL_MS + 1)
    await search('Coliseo')
    expect(waits).toEqual([])
  })

  it('answers a query it has already answered without asking again', async () => {
    const { search, sent } = harness()
    await search('Torre Eiffel')
    const again = await search('  torre eiffel ')
    expect(sent).toHaveLength(1)
    expect(again.status).toBe('ready')
  })

  it('measures a remembered answer from where the person is working now', async () => {
    const { search } = harness()
    const near = await search('Torre Eiffel', { bias: { lng: 2.35, lat: 48.85 } })
    const far = await search('Torre Eiffel', { bias: { lng: 135.5, lat: 34.7 } })
    if (near.status !== 'ready' || far.status !== 'ready') throw new Error('expected ready')
    expect(near.candidates[0]!.distanceKm).toBeLessThan(10)
    expect(far.candidates[0]!.distanceKm).toBeGreaterThan(9000)
  })

  it('reports an abort during the wait as aborted, and sends nothing', async () => {
    const { search, sent } = harness()
    await search('Torre Eiffel')
    const controller = new AbortController()
    controller.abort()
    const result = await search('Coliseo', { signal: controller.signal })
    expect(result.status).toBe('aborted')
    expect(sent).toHaveLength(1)
  })

  it('reports a failure as unavailable and asks again next time', async () => {
    let calls = 0
    const { search, sent } = harness(() => {
      calls += 1
      return calls === 1 ? Promise.reject(new Error('offline')) : Promise.resolve([eiffel])
    })

    const first = await search('Torre Eiffel')
    expect(first).toEqual({ status: 'failed', reason: SEARCH_FAILED_MESSAGE })

    const second = await search('Torre Eiffel')
    expect(second.status).toBe('ready')
    expect(sent).toHaveLength(2)
  })

  it('reports a refused request as unavailable', async () => {
    const search = createEveryLanguageSearch(() =>
      Promise.resolve({ ok: false, status: 429, json: () => Promise.resolve([]) }),
    )
    expect((await search('Torre Eiffel')).status).toBe('failed')
  })

  it('reports an answer with no rows as no matches', async () => {
    const { search } = harness(() => Promise.resolve([]))
    expect((await search('asdfgh')).status).toBe('empty')
  })
})
