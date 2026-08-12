import { FALLBACK_MARKER_TYPE, isMarkerType } from '@pinpoint/map'
import { describe, expect, it } from 'vitest'

import { guessMarkerType } from './type-guess'

describe('guessMarkerType', () => {
  it('prefers the specific classification over the coarse one', () => {
    // `amenity` alone would say nothing useful; `restaurant` says everything.
    expect(guessMarkerType('amenity', 'restaurant')).toBe('restaurant')
    expect(guessMarkerType('tourism', 'museum')).toBe('museum')
  })

  it('falls back to the coarse classification when the specific one is unknown', () => {
    expect(guessMarkerType('tourism', 'wilderness_hut')).toBe('attraction')
    expect(guessMarkerType('shop', 'fishmonger')).toBe('shop')
  })

  it('falls back to the fallback type when nothing matches', () => {
    expect(guessMarkerType('emergency', 'defibrillator')).toBe(
      FALLBACK_MARKER_TYPE,
    )
  })

  it('handles a classification being absent entirely', () => {
    expect(guessMarkerType(null, null)).toBe(FALLBACK_MARKER_TYPE)
    expect(guessMarkerType(undefined, undefined)).toBe(FALLBACK_MARKER_TYPE)
  })

  it('only ever returns a type that actually exists', () => {
    // The guard that matters. A renamed type in @pinpoint/map would otherwise
    // leave a stale identifier here, get written to a marker, and render as the
    // fallback anyway — silently, for as long as nobody looked.
    const classifications: [string, string][] = [
      ['amenity', 'restaurant'],
      ['amenity', 'cafe'],
      ['amenity', 'place_of_worship'],
      ['amenity', 'marketplace'],
      ['tourism', 'hotel'],
      ['tourism', 'museum'],
      ['tourism', 'viewpoint'],
      ['historic', 'castle'],
      ['leisure', 'park'],
      ['shop', 'mall'],
      ['railway', 'station'],
      ['aeroway', 'aerodrome'],
      ['natural', 'peak'],
      ['nonsense', 'nonsense'],
    ]

    for (const [key, value] of classifications) {
      expect(isMarkerType(guessMarkerType(key, value))).toBe(true)
    }
  })
})
