import { describe, expect, it } from 'vitest'

import { RETIRED_TYPES } from './marker-migrate'
import {
  FALLBACK_MARKER_TYPE,
  isKnownMarkerType,
  isMarkerType,
  MARKER_ICONS,
  MARKER_TYPE_IDS,
  MARKER_TYPES,
  markerTypeOf,
} from './marker-type'

describe('the type list', () => {
  it('has unique ids', () => {
    const ids = MARKER_TYPES.map((type) => type.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('gives every type a declared icon name', () => {
    for (const type of MARKER_TYPES) {
      expect(MARKER_ICONS).toContain(type.icon)
    }
  })

  it('gives each type its own icon', () => {
    // The icon no longer has to carry a distinction on its own — colour does
    // that — but two types sharing a glyph would make the reinforcement lie.
    const icons = MARKER_TYPES.map((type) => type.icon)

    expect(new Set(icons).size).toBe(icons.length)
  })

  it('declares no icon it does not use', () => {
    // Retired with the nine types that went. An icon nothing names is a glyph
    // both applications must map and nothing can draw.
    const used = new Set(MARKER_TYPES.map((type) => type.icon))

    expect([...MARKER_ICONS].filter((icon) => !used.has(icon))).toEqual([])
  })

  it('includes the fallback type', () => {
    expect(isMarkerType(FALLBACK_MARKER_TYPE)).toBe(true)
  })

  it('keeps the type count within what a map can distinguish', () => {
    // Colour is now carried by the type itself, so this bound is the whole
    // budget rather than the family channel's. A map stops being readable
    // somewhere around eight distinguishable colours, and the amber accent and
    // `danger` are already two of them.
    //
    // Inverted from what this file used to assert. It bounded MARKER_FAMILIES
    // and let the type list grow freely, which is exactly how sixteen types
    // ended up sharing five colours. Retired on purpose, not deleted: a guard
    // that fires when a decision is reversed is a guard working.
    expect(MARKER_TYPES.length).toBeLessThanOrEqual(8)
  })
})

describe('markerTypeOf', () => {
  it('resolves a live type', () => {
    expect(markerTypeOf('culture').id).toBe('culture')
  })

  it.each([
    ['an unknown id', 'onsen'],
    ['null', null],
    ['undefined', undefined],
  ])('falls back for %s rather than returning nothing', (_label, value) => {
    // The database column is unconstrained text, so a value no version of this
    // app ever wrote must still render.
    expect(markerTypeOf(value).id).toBe(FALLBACK_MARKER_TYPE)
  })
})

describe('retired identifiers', () => {
  // This is the test that would have caught the silent version of this change.
  // Letting a retired identifier fall through to the fallback draws every saved
  // temple as a generic `place` pin: no error, no failing test, nothing a
  // typecheck can see, and a map that is quietly wrong.

  it.each(Object.keys(RETIRED_TYPES))('resolves %s to a live type', (retired) => {
    expect(isMarkerType(markerTypeOf(retired).id)).toBe(true)
  })

  it.each(
    Object.entries(RETIRED_TYPES).filter(([, live]) => live !== FALLBACK_MARKER_TYPE),
  )('does not let %s reach the fallback', (retired) => {
    expect(markerTypeOf(retired).id).not.toBe(FALLBACK_MARKER_TYPE)
  })

  it('maps each retired identifier to the type recorded for it', () => {
    for (const [retired, live] of Object.entries(RETIRED_TYPES)) {
      expect(markerTypeOf(retired).id).toBe(live)
    }
  })

  it('covers every identifier the sixteen-type list defined', () => {
    // Frozen on purpose: this is what was on disk before the collapse, and it
    // is the set rows in the database can hold. It never changes.
    const BEFORE = [
      'other', 'attraction', 'temple', 'castle', 'museum', 'park', 'viewpoint',
      'restaurant', 'cafe', 'bar', 'street-food', 'shop', 'market', 'lodging',
      'station', 'airport',
    ]

    for (const id of BEFORE) {
      expect(isKnownMarkerType(id)).toBe(true)
    }
  })

  it('retires only identifiers that are no longer types', () => {
    for (const retired of Object.keys(RETIRED_TYPES)) {
      expect(MARKER_TYPE_IDS).not.toContain(retired)
    }
  })

  it('knows a live type and a retired one, and nothing else', () => {
    expect(isKnownMarkerType('culture')).toBe(true)
    expect(isKnownMarkerType('temple')).toBe(true)
    expect(isKnownMarkerType('onsen')).toBe(false)
  })
})
