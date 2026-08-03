import { describe, expect, it } from 'vitest'

import { markerSchema, newMarkerSchema } from './marker'

const VALID = {
  id: '00000000-0000-4000-8000-000000000000',
  tripId: '00000000-0000-4000-8000-000000000001',
  name: 'Fushimi Inari',
  note: null,
  lng: 135.7727,
  lat: 34.9671,
  createdAt: '2026-08-02T12:00:00.000Z',
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

describe('newMarkerSchema', () => {
  it('does not require server-assigned fields', () => {
    const result = newMarkerSchema.safeParse({
      tripId: VALID.tripId,
      name: VALID.name,
      note: null,
      lng: VALID.lng,
      lat: VALID.lat,
    })
    expect(result.success).toBe(true)
  })

  it('still enforces coordinate bounds', () => {
    const result = newMarkerSchema.safeParse({
      tripId: VALID.tripId,
      name: VALID.name,
      note: null,
      lng: 999,
      lat: VALID.lat,
    })
    expect(result.success).toBe(false)
  })
})
