import { FALLBACK_MARKER_TYPE, isMarkerType } from '@pinpoint/map'
import { describe, expect, it } from 'vitest'

import { guessMarkerType } from './type-guess'

describe('guessMarkerType', () => {
  it('prefers the specific classification over the coarse one', () => {
    // `amenity` alone would say nothing useful; `restaurant` says everything.
    expect(guessMarkerType('amenity', 'restaurant')).toBe('food')
    expect(guessMarkerType('tourism', 'museum')).toBe('culture')
  })

  it('falls back to the coarse classification when the specific one is unknown', () => {
    expect(guessMarkerType('tourism', 'wilderness_hut')).toBe('culture')
    expect(guessMarkerType('shop', 'fishmonger')).toBe('shopping')
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

  it('sends a zoo and an aquarium to nature, not to culture', () => {
    // The one place the type collapse gained precision. Both were flattened
    // into `attraction` because the old list had nowhere better for them, and
    // `attraction` now resolves to `culture` — so a zoo saved before this change
    // and one saved after it disagree. Nothing can reconcile that: the stored
    // value never recorded that it was a zoo. Asserted so the sharper answer is
    // not quietly lost the next time this table is edited.
    expect(guessMarkerType('tourism', 'zoo')).toBe('nature')
    expect(guessMarkerType('tourism', 'aquarium')).toBe('nature')
    expect(guessMarkerType('tourism', 'attraction')).toBe('culture')
  })

  it('groups leisure with nature, which is where park already sent it', () => {
    // Not a decision so much as the same grouping under a new name: `leisure`
    // resolved to `park`, and `park` is one of the two types `nature` absorbs.
    expect(guessMarkerType('leisure', 'pitch')).toBe('nature')
    expect(guessMarkerType('natural', 'peak')).toBe('nature')
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
