import { COLOUR } from '@pinpoint/tokens'
import { describe, expect, it } from 'vitest'

import {
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
