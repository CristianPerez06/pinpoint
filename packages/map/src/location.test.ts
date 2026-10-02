import { COLOUR, LOCATION_DOT_SIZE } from '@pinpoint/tokens'
import { describe, expect, it } from 'vitest'

import { accuracyRadiusPx } from './camera'
import { locationFeature, locationLayers } from './location'

const HERE = { lng: 135.773, lat: 35.001 }

describe('locationLayers', () => {
  it('draws the dot in ink with a surface ring, on each theme', () => {
    for (const mode of ['light', 'dark'] as const) {
      const dot = locationLayers({ ...HERE, accuracy: null }, mode).at(-1)!
      expect(dot.paint['circle-color']).toBe(COLOUR.ink[mode])
      expect(dot.paint['circle-stroke-color']).toBe(COLOUR.surface[mode])
      expect(
        (dot.paint['circle-radius'] as number) + (dot.paint['circle-stroke-width'] as number),
      ).toBe(LOCATION_DOT_SIZE / 2)
    }
  })

  it('draws the uncertainty beneath the dot, sized by the shared conversion', () => {
    const layers = locationLayers({ ...HERE, accuracy: 1500 }, 'light')
    expect(layers.map((layer) => layer.id)).toEqual(['you-accuracy', 'you-halo', 'you-dot'])
    const radius = layers[0]!.paint['circle-radius'] as unknown[]
    expect(radius[4]).toBe(accuracyRadiusPx(1500, HERE.lat, 0))
    expect(radius[6]).toBe(accuracyRadiusPx(1500, HERE.lat, 24))
  })

  it('draws no uncertainty when the device reported none', () => {
    const layers = locationLayers({ ...HERE, accuracy: null }, 'dark')
    expect(layers.map((layer) => layer.id)).toEqual(['you-halo', 'you-dot'])
  })
})

describe('locationFeature', () => {
  it('is a point in longitude, latitude order', () => {
    expect(locationFeature(HERE).geometry.coordinates).toEqual([135.773, 35.001])
  })
})
