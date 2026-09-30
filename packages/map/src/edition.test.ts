import { describe, expect, it } from 'vitest'

import type { StyleDocument } from './basemap-theme'
import {
  editionName,
  editionOf,
  pinnedStyle,
  STREETS_SOURCE,
  streetsIndexUrl,
  type StreetEdition,
} from './edition'

const INDEX = {
  tilejson: '3.0.0',
  tiles: ['https://tiles.openfreemap.org/planet/20260927_080001_pt/{z}/{x}/{y}.pbf'],
  minzoom: 0,
  maxzoom: 14,
  attribution: '© OpenMapTiles',
}

const DOCUMENT: StyleDocument = {
  version: 8,
  sources: {
    ne2_shaded: { type: 'raster', tiles: ['https://example.org/{z}/{x}/{y}.png'], maxzoom: 6 },
    [STREETS_SOURCE]: { type: 'vector', url: 'https://tiles.openfreemap.org/planet' },
  },
  layers: [{ id: 'background', type: 'background' }],
}

const EDITION = editionOf(INDEX) as StreetEdition

describe('editionOf', () => {
  it('reads the tiles, zooms and attribution from a tile index', () => {
    expect(EDITION).toEqual({
      tiles: INDEX.tiles,
      minzoom: 0,
      maxzoom: 14,
      attribution: '© OpenMapTiles',
    })
  })

  it('refuses something that is not a tile index', () => {
    expect(editionOf(null)).toBeNull()
    expect(editionOf({ tiles: [] , minzoom: 0, maxzoom: 14 })).toBeNull()
    expect(editionOf({ tiles: ['a'] })).toBeNull()
  })
})

describe('streetsIndexUrl', () => {
  it('finds the address the style reaches its streets through', () => {
    expect(streetsIndexUrl(DOCUMENT)).toBe('https://tiles.openfreemap.org/planet')
  })
})

describe('pinnedStyle', () => {
  const pinned = pinnedStyle(DOCUMENT, EDITION)
  const sources = pinned.sources as Record<string, Record<string, unknown>>

  it('replaces the index with the edition itself', () => {
    expect(sources[STREETS_SOURCE]).toEqual({
      type: 'vector',
      tiles: INDEX.tiles,
      minzoom: 0,
      maxzoom: 14,
      attribution: '© OpenMapTiles',
    })
  })

  it('leaves the other sources and the layers alone', () => {
    expect(sources.ne2_shaded).toBe((DOCUMENT.sources as Record<string, unknown>).ne2_shaded)
    expect(pinned.layers).toBe(DOCUMENT.layers)
  })

  it('does not change the document it was given', () => {
    expect(streetsIndexUrl(DOCUMENT)).toBe('https://tiles.openfreemap.org/planet')
  })

  it('returns a document without that source unchanged', () => {
    const bare: StyleDocument = { version: 8, sources: {}, layers: [] }
    expect(pinnedStyle(bare, EDITION)).toBe(bare)
  })
})

describe('editionName', () => {
  it('is safe in a file name and names the week', () => {
    expect(editionName(EDITION)).toBe('tiles-openfreemap-org-planet-20260927-080001-pt-pbf')
  })
})
