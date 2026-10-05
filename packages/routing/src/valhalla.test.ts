import { describe, expect, it } from 'vitest'

import walk from './fixtures/valhalla-walk.json'
import { buildValhallaUrl, isValhallaNoRoute, parseValhalla } from './valhalla'

const KIYOMIZU = { lng: 135.785, lat: 34.9948 }
const INARI = { lng: 135.7727, lat: 34.9671 }

describe('buildValhallaUrl', () => {
  it.each([
    ['walk', 'pedestrian'],
    ['bike', 'bicycle'],
    ['car', 'auto'],
  ] as const)('asks for %s as %s', (mode, costing) => {
    const url = buildValhallaUrl(KIYOMIZU, INARI, mode)
    const query = JSON.parse(decodeURIComponent(url.split('?json=')[1]))
    expect(query).toEqual({
      locations: [
        { lat: 34.9948, lon: 135.785 },
        { lat: 34.9671, lon: 135.7727 },
      ],
      costing,
      units: 'kilometers',
    })
  })
})

describe('parseValhalla', () => {
  it('reads the measured walk from Kiyomizu-dera to Fushimi Inari', () => {
    const route = parseValhalla(walk)
    expect(route?.km).toBeCloseTo(4.383, 3)
    expect(Math.round(route?.minutes ?? 0)).toBe(53)
    // The line runs from near the start to near the place.
    const first = route?.line[0]
    const last = route?.line.at(-1)
    expect(first?.lat).toBeCloseTo(KIYOMIZU.lat, 2)
    expect(last?.lat).toBeCloseTo(INARI.lat, 2)
    expect(last?.lng).toBeCloseTo(INARI.lng, 2)
  })

  it('reads nothing from an answer that is not a trip', () => {
    expect(parseValhalla({ trip: { status: 1 } })).toBeNull()
    expect(parseValhalla(null)).toBeNull()
    expect(parseValhalla({ trip: { status: 0, summary: { length: 1, time: 2 }, legs: [] } })).toBeNull()
  })
})

describe('isValhallaNoRoute', () => {
  it('reads a coded refusal as no way', () => {
    // As answered on 2026-10-04 for Kyoto to Honolulu by car.
    const body = { error_code: 154, error: 'Path distance exceeds the max distance limit', status_code: 400 }
    expect(isValhallaNoRoute(400, body)).toBe(true)
  })

  it('does not read a server error as no way', () => {
    expect(isValhallaNoRoute(500, { error_code: 154 })).toBe(false)
    expect(isValhallaNoRoute(400, null)).toBe(false)
  })
})
