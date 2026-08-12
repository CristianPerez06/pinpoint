import { describe, expect, it } from 'vitest'

import { distanceKm } from './distance'

const OSAKA = { lng: 135.5023, lat: 34.6937 }
const KYOTO = { lng: 135.7681, lat: 35.0116 }
const MADRID = { lng: -3.7038, lat: 40.4168 }

describe('distanceKm', () => {
  it('measures a short hop', () => {
    // Osaka to Kyoto is about 43 km as the crow flies.
    expect(distanceKm(OSAKA, KYOTO)).toBeGreaterThan(40)
    expect(distanceKm(OSAKA, KYOTO)).toBeLessThan(46)
  })

  it('measures the distance that made this necessary', () => {
    // The failure this was added for: a query for an Osaka place resolving to
    // somewhere in Spain, presented identically to a correct match.
    const far = distanceKm(OSAKA, MADRID)
    expect(far).toBeGreaterThan(10_000)
    expect(far).toBeLessThan(11_000)
  })

  it('is zero for the same point', () => {
    expect(distanceKm(OSAKA, { ...OSAKA })).toBe(0)
  })

  it('does not care which way round it is asked', () => {
    expect(distanceKm(OSAKA, MADRID)).toBeCloseTo(distanceKm(MADRID, OSAKA), 9)
  })

  it('takes the short way across the antimeridian', () => {
    // Two points 20 km apart either side of 180°. Subtracting longitudes
    // naively gives 359.8 degrees and an answer most of the way round the
    // planet — which would mark a neighbouring result as intercontinental.
    const west = { lng: 179.9, lat: 0 }
    const east = { lng: -179.9, lat: 0 }
    expect(distanceKm(west, east)).toBeLessThan(30)
  })

  it('handles antipodal points without producing NaN', () => {
    // Floating point can push the haversine term a hair above 1 here, and
    // `asin` of that is NaN — which would render as an empty distance rather
    // than the largest one possible.
    const north = { lng: 0, lat: 90 }
    const south = { lng: 0, lat: -90 }
    const half = distanceKm(north, south)
    expect(Number.isNaN(half)).toBe(false)
    expect(half).toBeGreaterThan(20_000)
  })

  it('measures across the equator', () => {
    expect(distanceKm({ lng: 0, lat: -1 }, { lng: 0, lat: 1 })).toBeCloseTo(222.4, 0)
  })
})
