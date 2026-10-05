import { describe, expect, it } from 'vitest'

import walk from './fixtures/osrm-walk.json'
import { buildOsrmUrl, isOsrmNoRoute, parseOsrm } from './osrm'

const KIYOMIZU = { lng: 135.785, lat: 34.9948 }
const INARI = { lng: 135.7727, lat: 34.9671 }

describe('buildOsrmUrl', () => {
  it.each([
    ['walk', 'routed-foot/route/v1/foot'],
    ['bike', 'routed-bike/route/v1/bike'],
    ['car', 'routed-car/route/v1/car'],
  ] as const)('asks the %s server', (mode, path) => {
    expect(buildOsrmUrl(KIYOMIZU, INARI, mode)).toBe(
      `https://routing.openstreetmap.de/${path}/135.785,34.9948;135.7727,34.9671?overview=full&geometries=geojson`,
    )
  })
})

describe('parseOsrm', () => {
  it('reads the measured walk from Kiyomizu-dera to Fushimi Inari', () => {
    const route = parseOsrm(walk)
    expect(route?.km).toBeCloseTo(4.339, 3)
    expect(Math.round(route?.minutes ?? 0)).toBe(58)
    expect(route?.line.length).toBeGreaterThan(100)
  })

  it('reads nothing from an answer that is not Ok', () => {
    expect(parseOsrm({ code: 'NoRoute' })).toBeNull()
    expect(parseOsrm({ code: 'Ok', routes: [] })).toBeNull()
  })
})

describe('isOsrmNoRoute', () => {
  it('reads its own word for no way', () => {
    // As answered on 2026-10-04 for Kyoto to Honolulu by car.
    expect(isOsrmNoRoute({ message: 'Impossible route between points', code: 'NoRoute' })).toBe(true)
    expect(isOsrmNoRoute({ code: 'Ok' })).toBe(false)
  })
})
