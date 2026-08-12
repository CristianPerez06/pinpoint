import { describe, expect, it } from 'vitest'

import { buildSearchUrl, PHOTON_ENDPOINT } from './request'

function paramsOf(url: string): Record<string, string> {
  const [, search = ''] = url.split('?')
  const entries = search
    .split('&')
    .filter(Boolean)
    .map((pair) => {
      const [key = '', value = ''] = pair.split('=')
      return [key, decodeURIComponent(value)] as const
    })
  return Object.fromEntries(entries)
}

describe('buildSearchUrl', () => {
  it('asks the free instance for the query', () => {
    const url = buildSearchUrl('kiyomizu dera')
    expect(url.startsWith(`${PHOTON_ENDPOINT}?`)).toBe(true)
    expect(paramsOf(url).q).toBe('kiyomizu dera')
  })

  it('escapes a query that would otherwise break the URL', () => {
    const url = buildSearchUrl('café & bar 100%')
    expect(paramsOf(url).q).toBe('café & bar 100%')
  })

  it('sends a focus point when there is one to send', () => {
    const params = paramsOf(
      buildSearchUrl('ramen', { bias: { lng: 135.7681, lat: 35.0116 } }),
    )
    expect(params.lat).toBe('35.0116')
    expect(params.lon).toBe('135.7681')
    expect(params.zoom).toBeDefined()
    expect(params.location_bias_scale).toBeDefined()
  })

  it('sends no focus point when there is none', () => {
    const params = paramsOf(buildSearchUrl('ramen'))
    expect(params.lat).toBeUndefined()
    expect(params.lon).toBeUndefined()
  })

  it('never sends a bounding box', () => {
    // The distinction this whole function turns on. A focus point reorders
    // results; a bounding box excludes everything outside it. A trip contains
    // day trips, and the place an hour away has to stay findable.
    const withBias = buildSearchUrl('nara', {
      bias: { lng: 135.7681, lat: 35.0116 },
    })
    expect(paramsOf(withBias).bbox).toBeUndefined()
    expect(withBias).not.toContain('bbox')
  })

  it('asks for a small number of results by default', () => {
    const limit = Number(paramsOf(buildSearchUrl('ramen')).limit)
    expect(limit).toBeGreaterThan(0)
    expect(limit).toBeLessThanOrEqual(10)
  })

  it('lets the caller override the tuning values', () => {
    const params = paramsOf(
      buildSearchUrl('ramen', {
        bias: { lng: 1, lat: 2 },
        limit: 3,
        zoom: 16,
        biasScale: 0.9,
        lang: 'ja',
      }),
    )
    expect(params).toMatchObject({
      limit: '3',
      zoom: '16',
      location_bias_scale: '0.9',
      lang: 'ja',
    })
  })
})
