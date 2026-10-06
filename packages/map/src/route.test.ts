import { COLOUR } from '@pinpoint/tokens'
import { describe, expect, it } from 'vitest'

import {
  bearingAhead,
  bearingDifference,
  isTravelMode,
  ROUTE_SOURCE,
  routeFeature,
  routeLayers,
  TRAVEL_MODES,
  walkingMinutes,
} from './route'

describe('walkingMinutes', () => {
  it('is never said as less than five minutes', () => {
    expect(walkingMinutes(0.12)).toBe(5)
    expect(walkingMinutes(0)).toBe(5)
  })

  it('a temple across town', () => {
    expect(walkingMinutes(1.34)).toBe(25)
  })

  it('a day trip', () => {
    expect(walkingMinutes(35.46)).toBe(615)
  })

  it('rounds to the nearest five minutes', () => {
    // 1 km → 17.3 min → 15; 1.1 km → 19.1 min → 20.
    expect(walkingMinutes(1)).toBe(15)
    expect(walkingMinutes(1.1)).toBe(20)
  })

  it('says nothing past where Nearby calls it a day trip', () => {
    expect(walkingMinutes(50)).not.toBeNull()
    expect(walkingMinutes(50.01)).toBeNull()
    expect(walkingMinutes(120)).toBeNull()
  })
})

describe('routeFeature', () => {
  it('runs from the person to the place', () => {
    const feature = routeFeature({ lng: 135.7745, lat: 35.0034 }, { lng: 135.785, lat: 34.9949 })
    expect(feature.geometry).toEqual({
      type: 'LineString',
      coordinates: [
        [135.7745, 35.0034],
        [135.785, 34.9949],
      ],
    })
  })

  it('follows every point of a street route', () => {
    const feature = routeFeature([
      { lng: 1, lat: 2 },
      { lng: 3, lat: 4 },
      { lng: 5, lat: 6 },
    ])
    expect(feature.geometry.coordinates).toEqual([
      [1, 2],
      [3, 4],
      [5, 6],
    ])
  })
})

describe('routeLayers', () => {
  it.each(['light', 'dark'] as const)('draws only in ink and surface on %s', (mode) => {
    const layers = routeLayers(mode)
    expect(layers.map((layer) => layer.id)).toEqual([`${ROUTE_SOURCE}-casing`, `${ROUTE_SOURCE}-line`])
    expect(layers.map((layer) => layer.paint['line-color'])).toEqual([
      COLOUR.surface[mode],
      COLOUR.ink[mode],
    ])
  })

  it.each(['light', 'dark'] as const)('draws the street route in ink and surface on %s', (mode) => {
    const layers = routeLayers(mode, 'street')
    expect(layers.map((layer) => layer.id)).toEqual([`${ROUTE_SOURCE}-casing`, `${ROUTE_SOURCE}-line`])
    expect(layers.map((layer) => layer.paint['line-color'])).toEqual([
      COLOUR.surface[mode],
      COLOUR.ink[mode],
    ])
  })

  it('dots only the straight line', () => {
    expect(routeLayers('light', 'straight')[1].paint['line-dasharray']).toBeDefined()
    expect(routeLayers('light', 'street')[1].paint['line-dasharray']).toBeUndefined()
  })
})

describe('isTravelMode', () => {
  it('knows the three ways of travelling and nothing else', () => {
    expect(TRAVEL_MODES.every(isTravelMode)).toBe(true)
    expect(isTravelMode('bus')).toBe(false)
    expect(isTravelMode(null)).toBe(false)
  })
})

describe('bearingAhead', () => {
  // About 11 m per 0.0001° of latitude; a little less across at Kyoto's latitude.
  const here = { lng: 135.77, lat: 35.0 }
  const east = (m: number) => ({ lng: here.lng + m / (111_320 * Math.cos((35 * Math.PI) / 180)), lat: here.lat })
  const north = (from: { lng: number; lat: number }, m: number) => ({ lng: from.lng, lat: from.lat + m / 111_320 })

  it('reads a straight line heading east as 90', () => {
    expect(bearingAhead([here, east(200)], here)).toBeCloseTo(90, 5)
  })

  it('reads a straight line heading south as 180', () => {
    expect(bearingAhead([here, north(here, -200)], here)).toBeCloseTo(180, 5)
  })

  it('looks past a corner that comes within the look-ahead', () => {
    // East for 20 m, then north: 40 m ahead lands 20 m up the northern leg.
    const bend = east(20)
    const bearing = bearingAhead([here, bend, north(bend, 200)], here, 40)!
    expect(bearing).toBeGreaterThan(0)
    expect(bearing).toBeLessThan(90)
    expect(bearing).toBeCloseTo(45, 0)
  })

  it('does not see a corner beyond the look-ahead', () => {
    const bend = east(100)
    expect(bearingAhead([here, bend, north(bend, 200)], here, 40)).toBeCloseTo(90, 5)
  })

  it('reads from the point of the line nearest a person standing beside it', () => {
    const beside = north(here, 15)
    expect(bearingAhead([here, east(200)], beside)).toBeCloseTo(90, 3)
  })

  it('has no direction for a line too short to have one', () => {
    expect(bearingAhead([here], here)).toBeNull()
    expect(bearingAhead([here, here], here)).toBeNull()
  })
})

describe('bearingDifference', () => {
  it('is the smaller angle, across north as well', () => {
    expect(bearingDifference(10, 350)).toBe(20)
    expect(bearingDifference(90, 270)).toBe(180)
    expect(bearingDifference(45, 45)).toBe(0)
  })
})
