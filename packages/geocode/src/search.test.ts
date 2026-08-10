import { describe, expect, it, vi } from 'vitest'

import { searchPlaces, SEARCH_FAILED_MESSAGE } from './search'
import type { Fetcher } from './types'

/** A fetcher that answers from a fixture. No network, no stubbed global. */
function respondWith(payload: unknown, ok = true, status = 200): Fetcher {
  return () => Promise.resolve({ ok, status, json: () => Promise.resolve(payload) })
}

const oneResult = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: { name: 'Nishiki Market', osm_key: 'amenity', osm_value: 'marketplace' },
      geometry: { type: 'Point', coordinates: [135.7649, 35.005] },
    },
  ],
}

describe('searchPlaces', () => {
  it('returns candidates when the service answers', async () => {
    const result = await searchPlaces(respondWith(oneResult), 'nishiki')
    expect(result.status).toBe('ready')
    if (result.status === 'ready') {
      expect(result.candidates[0]?.name).toBe('Nishiki Market')
      expect(result.candidates[0]?.typeGuess).toBe('market')
    }
  })

  it('reports empty when the service matched nothing', async () => {
    const result = await searchPlaces(
      respondWith({ type: 'FeatureCollection', features: [] }),
      'asdfgh',
    )
    expect(result.status).toBe('empty')
  })

  it('does not call the service for a blank query', async () => {
    const fetcher = vi.fn(respondWith(oneResult))
    const result = await searchPlaces(fetcher, '   ')
    expect(result.status).toBe('empty')
    expect(fetcher).not.toHaveBeenCalled()
  })

  it('reports failure when the service refuses', async () => {
    const result = await searchPlaces(respondWith(null, false, 503), 'ramen')
    expect(result).toEqual({ status: 'failed', message: SEARCH_FAILED_MESSAGE })
  })

  it('reports failure when the request throws', async () => {
    const fetcher: Fetcher = () => Promise.reject(new Error('network down'))
    const result = await searchPlaces(fetcher, 'ramen')
    expect(result.status).toBe('failed')
  })

  it('reports aborted, not failed, when the caller supersedes the request', async () => {
    // The distinction that keeps "search unavailable" from flashing at somebody
    // who is simply still typing. Aborts happen on almost every keystroke.
    const controller = new AbortController()
    const fetcher: Fetcher = () => {
      controller.abort()
      const error = new Error('aborted')
      error.name = 'AbortError'
      return Promise.reject(error)
    }

    const result = await searchPlaces(fetcher, 'ram', {
      signal: controller.signal,
    })
    expect(result.status).toBe('aborted')
  })

  it('reports empty rather than failure when the body is unreadable', async () => {
    // The request succeeded, so claiming the service is down would be a lie.
    const result = await searchPlaces(respondWith('not geojson'), 'ramen')
    expect(result.status).toBe('empty')
  })

  it('reports failure when the body cannot be parsed as JSON at all', async () => {
    const fetcher: Fetcher = () =>
      Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.reject(new SyntaxError('unexpected token')),
      })
    const result = await searchPlaces(fetcher, 'ramen')
    expect(result.status).toBe('failed')
  })

  it('passes the abort signal through to the fetcher', async () => {
    const controller = new AbortController()
    const fetcher = vi.fn(respondWith(oneResult))
    await searchPlaces(fetcher, 'ramen', { signal: controller.signal })
    expect(fetcher).toHaveBeenCalledWith(
      expect.any(String),
      { signal: controller.signal },
    )
  })

  it('accepts the global fetch without a cast', async () => {
    // The type is structural precisely so this holds. If it stops holding, the
    // applications cannot pass their runtime's fetch and the injection is
    // ceremony rather than design.
    const asFetcher: Fetcher = globalThis.fetch
    expect(typeof asFetcher).toBe('function')
  })
})
