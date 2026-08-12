import { BASEMAP_COLOUR } from '@pinpoint/tokens'
import { describe, expect, it } from 'vitest'

import {
  BasemapThemeError,
  themeStyle,
  type StyleDocument,
} from './basemap-theme'
import positron from './fixtures/positron.json'

/**
 * The fixture is a copy of OpenFreeMap's positron document, taken once.
 *
 * It can drift from what the applications actually fetch, and nothing here
 * would notice — a fixture is a record of the shape at a moment, not a
 * subscription to it. What protects the running map is the assertion inside
 * `themeStyle`, which runs against the live document every time it loads and
 * throws naming the category that matched nothing.
 *
 * These tests are what stop that assertion from being wrong, which is a
 * different job and still worth doing.
 */

const document = positron as unknown as StyleDocument

function layerById(style: StyleDocument, id: string) {
  const layer = style.layers.find((each) => each.id === id)
  if (!layer) throw new Error(`no layer ${id} in the fixture`)
  return layer
}

describe('themeStyle', () => {
  it('repaints every category from the shared basemap tokens', () => {
    const themed = themeStyle(document, 'light')

    expect(layerById(themed, 'background').paint?.['background-color']).toBe(
      BASEMAP_COLOUR.land.light,
    )
    expect(layerById(themed, 'water').paint?.['fill-color']).toBe(BASEMAP_COLOUR.water.light)
    expect(layerById(themed, 'park').paint?.['fill-color']).toBe(BASEMAP_COLOUR.park.light)
    expect(layerById(themed, 'building').paint?.['fill-color']).toBe(BASEMAP_COLOUR.block.light)
    expect(layerById(themed, 'highway_minor').paint?.['line-color']).toBe(
      BASEMAP_COLOUR.road.light,
    )
    expect(layerById(themed, 'highway_major_casing').paint?.['line-color']).toBe(
      BASEMAP_COLOUR.roadCasing.light,
    )
    expect(layerById(themed, 'label_city').paint?.['text-color']).toBe(
      BASEMAP_COLOUR.label.light,
    )
  })

  it('produces different colours for the two grounds', () => {
    const light = themeStyle(document, 'light')
    const dark = themeStyle(document, 'dark')

    expect(layerById(light, 'background').paint?.['background-color']).not.toBe(
      layerById(dark, 'background').paint?.['background-color'],
    )
    expect(layerById(dark, 'background').paint?.['background-color']).toBe(
      BASEMAP_COLOUR.land.dark,
    )
  })

  it('leaves widths and opacities alone, because they carry the cartography', () => {
    const before = layerById(document, 'highway_minor').paint
    const after = layerById(themeStyle(document, 'dark'), 'highway_minor').paint

    expect(after?.['line-width']).toEqual(before?.['line-width'])
    expect(after?.['line-opacity']).toEqual(before?.['line-opacity'])
  })

  it('gives a label a halo of the ground, so it stays readable in dark', () => {
    const themed = themeStyle(document, 'dark')

    expect(layerById(themed, 'label_city').paint?.['text-halo-color']).toBe(
      BASEMAP_COLOUR.land.dark,
    )
  })

  it('does not modify the document it was given', () => {
    const original = JSON.stringify(document)
    themeStyle(document, 'dark')

    expect(JSON.stringify(document)).toBe(original)
  })

  it('leaves a route shield alone — its colours mean something', () => {
    const themed = themeStyle(document, 'dark')
    const shield = layerById(themed, 'highway-shield-non-us')

    expect(shield.paint).toEqual(layerById(document, 'highway-shield-non-us').paint)
  })

  it('throws naming the category when upstream restructures it away', () => {
    // What a rename that defeats classification actually looks like: the water
    // layers stop declaring the source layer this transformation recognises.
    const restructured: StyleDocument = {
      ...document,
      layers: document.layers.map((layer) =>
        layer['source-layer'] === 'water' ||
        layer['source-layer'] === 'waterway' ||
        layer['source-layer'] === 'water_name'
          ? { ...layer, 'source-layer': 'hydrography' }
          : layer,
      ),
    }

    expect(() => themeStyle(restructured, 'light')).toThrow(BasemapThemeError)
    expect(() => themeStyle(restructured, 'light')).toThrow(/water/)
  })

  it('names every missing category, not just the first', () => {
    const stripped: StyleDocument = { ...document, layers: [] }

    try {
      themeStyle(stripped, 'light')
      expect.unreachable('expected a BasemapThemeError')
    } catch (error) {
      expect(error).toBeInstanceOf(BasemapThemeError)
      expect((error as BasemapThemeError).missing).toEqual([
        'land',
        'water',
        'park',
        'block',
        'road',
        'roadCasing',
        'label',
        'boundary',
      ])
    }
  })

  it('classifies every layer of the real document that carries a colour', () => {
    // A layer with a paint colour that no category claims would keep its
    // upstream value and read as a patch that missed a spot.
    const themed = themeStyle(document, 'light')
    const ourColours = new Set<string>(
      Object.values(BASEMAP_COLOUR).flatMap((token) => [token.light, token.dark]),
    )

    const unpainted = themed.layers.filter((layer) => {
      const paint = layer.paint ?? {}
      const colours = Object.entries(paint)
        .filter(([key]) => key.endsWith('color'))
        .map(([, value]) => value)
        .filter((value): value is string => typeof value === 'string')
      return colours.length > 0 && !colours.every((value) => ourColours.has(value))
    })

    expect(unpainted.map((layer) => layer.id)).toEqual([])
  })
})
