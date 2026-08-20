import { describe, expect, it } from 'vitest'

import { markerPatchSchema, markerSchema, newMarkerSchema } from './marker'

const VALID = {
  id: '00000000-0000-4000-8000-000000000000',
  tripId: '00000000-0000-4000-8000-000000000001',
  cityId: '00000000-0000-4000-8000-000000000002',
  name: 'Fushimi Inari',
  note: null,
  lng: 135.7727,
  lat: 34.9671,
  type: 'temple',
  link: null,
  price: null,
  visited: false,
  createdAt: '2026-08-02T12:00:00.000Z',
  updatedAt: '2026-08-02T12:00:00.000Z',
}

describe('markerSchema', () => {
  it('accepts a well-formed marker', () => {
    expect(markerSchema.parse(VALID)).toEqual(VALID)
  })

  it('accepts a note', () => {
    const withNote = { ...VALID, note: 'go at sunrise' }
    expect(markerSchema.parse(withNote).note).toBe('go at sunrise')
  })

  it('rejects a missing note rather than defaulting it', () => {
    const { note: _note, ...withoutNote } = VALID
    expect(markerSchema.safeParse(withoutNote).success).toBe(false)
  })

  it('rejects an empty name', () => {
    expect(markerSchema.safeParse({ ...VALID, name: '' }).success).toBe(false)
  })

  it.each([
    ['longitude too high', { lng: 180.1 }],
    ['longitude too low', { lng: -180.1 }],
    ['latitude too high', { lat: 90.1 }],
    ['latitude too low', { lat: -90.1 }],
  ])('rejects %s', (_label, override) => {
    expect(markerSchema.safeParse({ ...VALID, ...override }).success).toBe(false)
  })

  it.each([
    ['longitude at +180', { lng: 180 }],
    ['longitude at -180', { lng: -180 }],
    ['latitude at the poles', { lat: 90 }],
  ])('accepts %s', (_label, override) => {
    expect(markerSchema.safeParse({ ...VALID, ...override }).success).toBe(true)
  })

  it('rejects a non-uuid id', () => {
    expect(markerSchema.safeParse({ ...VALID, id: 'nope' }).success).toBe(false)
  })

  it('requires the version an edit would be checked against', () => {
    // Not optional, and not defaulted. A marker without a last-changed time
    // cannot be edited safely, and accepting one here would let a caller send a
    // patch with nothing to compare against.
    const { updatedAt: _dropped, ...without } = VALID
    expect(markerSchema.safeParse(without).success).toBe(false)
  })

  it('keeps the version out of a patch', () => {
    // A precondition of a write is not a field somebody edits. Accepting it in
    // a patch would let a caller assert the very value the check exists to
    // verify, which is the whole guarantee handed back.
    const parsed = markerPatchSchema.safeParse({
      name: 'Somewhere',
      updatedAt: '2030-01-01T00:00:00.000Z',
    })

    expect(parsed.success).toBe(true)
    if (!parsed.success) throw new Error('unreachable')
    expect(parsed.data).not.toHaveProperty('updatedAt')
  })

  it('rejects a non-ISO createdAt', () => {
    expect(
      markerSchema.safeParse({ ...VALID, createdAt: '2026-08-02' }).success,
    ).toBe(false)
  })

  it('is structurally compatible with the map package LngLat shape', () => {
    const marker = markerSchema.parse(VALID)
    const asLngLat: { lng: number; lat: number } = marker
    expect(asLngLat.lng).toBe(VALID.lng)
    expect(asLngLat.lat).toBe(VALID.lat)
  })
})

describe('optional fields', () => {
  it('accepts a marker with no city', () => {
    const unassigned = markerSchema.safeParse({ ...VALID, cityId: null })
    expect(unassigned.success).toBe(true)
  })

  it('records an omitted note, link, and price as null rather than empty text', () => {
    const marker = markerSchema.parse(VALID)
    expect(marker.note).toBeNull()
    expect(marker.link).toBeNull()
    expect(marker.price).toBeNull()
    expect(marker.note).not.toBe('')
  })

  it('rejects an empty string where null is meant', () => {
    expect(markerSchema.safeParse({ ...VALID, link: '' }).success).toBe(false)
  })

  it('accepts a link and a price', () => {
    const marker = markerSchema.parse({
      ...VALID,
      link: 'https://example.com/why-we-saved-this',
      price: 500,
    })
    expect(marker.link).toBe('https://example.com/why-we-saved-this')
    expect(marker.price).toBe(500)
  })

  it('rejects a link that is not a url', () => {
    expect(markerSchema.safeParse({ ...VALID, link: 'not a url' }).success).toBe(
      false,
    )
  })

  it('rejects a negative price', () => {
    expect(markerSchema.safeParse({ ...VALID, price: -1 }).success).toBe(false)
  })

  it('rejects an unknown marker type', () => {
    expect(
      markerSchema.safeParse({ ...VALID, type: 'onsen' }).success,
    ).toBe(false)
  })
})

describe('newMarkerSchema', () => {
  const NEW = {
    tripId: VALID.tripId,
    cityId: VALID.cityId,
    name: VALID.name,
    note: null,
    lng: VALID.lng,
    lat: VALID.lat,
    type: VALID.type,
    link: null,
    price: null,
  }

  it('does not require server-assigned fields', () => {
    expect(newMarkerSchema.safeParse(NEW).success).toBe(true)
  })

  it('does not accept visited — the database owns that default', () => {
    const parsed = newMarkerSchema.parse({ ...NEW, visited: true })
    expect('visited' in parsed).toBe(false)
  })

  it('still enforces coordinate bounds', () => {
    expect(newMarkerSchema.safeParse({ ...NEW, lng: 999 }).success).toBe(false)
  })

  it('still enforces the type list', () => {
    expect(newMarkerSchema.safeParse({ ...NEW, type: 'onsen' }).success).toBe(
      false,
    )
  })
})
