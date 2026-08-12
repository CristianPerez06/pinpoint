import { describe, expect, it } from 'vitest'

import {
  FALLBACK_MARKER_TYPE,
  isMarkerType,
  MARKER_FAMILIES,
  MARKER_ICONS,
  MARKER_TYPES,
  markerTypeOf,
} from './marker-type'

describe('the type list', () => {
  it('has unique ids', () => {
    const ids = MARKER_TYPES.map((type) => type.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('assigns every type to a declared family', () => {
    for (const type of MARKER_TYPES) {
      expect(MARKER_FAMILIES).toContain(type.family)
    }
  })

  it('gives every type a declared icon name', () => {
    for (const type of MARKER_TYPES) {
      expect(MARKER_ICONS).toContain(type.icon)
    }
  })

  it('gives each type its own icon, because type is what the icon channel carries', () => {
    // Family carries colour and stays small; type carries icon and may grow.
    // Two types sharing an icon collapses the only channel that distinguishes
    // them, since they may also share a family — a temple and a castle would
    // then be identical pins.
    const icons = MARKER_TYPES.map((type) => type.icon)

    expect(new Set(icons).size).toBe(icons.length)
  })

  it('includes the fallback type', () => {
    expect(isMarkerType(FALLBACK_MARKER_TYPE)).toBe(true)
  })

  it('keeps the family count within what a map can distinguish', () => {
    // Colour is carried by family, and a map stops being readable somewhere
    // around eight distinguishable colours. Growth belongs in the icon channel:
    // a new type joins an existing family rather than adding one.
    expect(MARKER_FAMILIES.length).toBeLessThanOrEqual(8)
  })
})

describe('markerTypeOf', () => {
  it('resolves a known type', () => {
    expect(markerTypeOf('temple').id).toBe('temple')
  })

  it.each([
    ['an unknown id', 'onsen'],
    ['null', null],
    ['undefined', undefined],
  ])('falls back for %s rather than returning nothing', (_label, value) => {
    // The database column is unconstrained text, so a value written by an older
    // version of the app must still render.
    expect(markerTypeOf(value).id).toBe(FALLBACK_MARKER_TYPE)
  })
})
