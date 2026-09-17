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
  type: 'culture',
  link: null,
  price: null,
  plannedOn: null,
  visited: false,
  createdAt: '2026-08-02T12:00:00.000Z',
  updatedAt: '2026-08-02T12:00:00.000Z',
}

describe('markerSchema', () => {
  it('accepts a well-formed marker', () => {
    expect(markerSchema.parse(VALID)).toEqual(VALID)
  })

  it('accepts a day', () => {
    expect(markerSchema.parse({ ...VALID, plannedOn: '2026-04-03' }).plannedOn).toBe(
      '2026-04-03',
    )
  })

  it('records an undecided day as absent rather than as empty text', () => {
    expect(markerSchema.parse(VALID).plannedOn).toBe(null)
    expect(markerSchema.safeParse({ ...VALID, plannedOn: '' }).success).toBe(false)
  })

  it('rejects a day that is not a calendar date', () => {
    expect(markerSchema.safeParse({ ...VALID, plannedOn: '2026-13-01' }).success).toBe(
      false,
    )
    expect(
      markerSchema.safeParse({ ...VALID, plannedOn: '2026-04-03T09:00:00Z' })
        .success,
    ).toBe(false)
  })

  /*
   * A trip's dates say roughly when it is; they are not a boundary. Refusing a
   * day either side of them would mean shifting a trip silently invalidated
   * decisions that were already made, so nothing here consults them.
   */
  it('accepts a day outside any trip window, because it does not know of one', () => {
    expect(markerSchema.safeParse({ ...VALID, plannedOn: '2019-01-01' }).success).toBe(
      true,
    )
    expect(markerSchema.safeParse({ ...VALID, plannedOn: '2099-12-31' }).success).toBe(
      true,
    )
  })

  /*
   * A city and a day are two groupings standing beside each other. Neither
   * derives the other, so a place filed under a city whose other places are on
   * different days is not a contradiction.
   */
  it('does not tie the day to the city', () => {
    const dated = { ...VALID, cityId: null, plannedOn: '2026-04-03' }
    expect(markerSchema.parse(dated).plannedOn).toBe('2026-04-03')
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

  it('accepts moving a place to another day, and off every day', () => {
    const moved = markerPatchSchema.safeParse({ plannedOn: '2026-04-05' })
    expect(moved.success).toBe(true)
    expect(moved.success && moved.data.plannedOn).toBe('2026-04-05')

    const cleared = markerPatchSchema.safeParse({ plannedOn: null })
    expect(cleared.success).toBe(true)
    expect(cleared.success && cleared.data.plannedOn).toBe(null)
  })

  /*
   * A default survives `.partial()`, so a patch schema derived from the
   * creation schema would turn "this edit says nothing about the day" into
   * "clear the day" — on every edit from the phone, which has no control for
   * one. The two schemas want opposite things from the same absent key.
   */
  it('leaves the day out when the patch does not mention it', () => {
    const parsed = markerPatchSchema.safeParse({ name: 'Somewhere' })
    expect(parsed.success).toBe(true)
    expect(parsed.success && 'plannedOn' in parsed.data).toBe(false)
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

  /*
   * The phone has no control for a day and sends no key for one. Requiring it
   * broke every save from that application the moment the field was added, and
   * the type system could not see it because `createMarker` takes `unknown`.
   */
  it('treats a day left out as no day, rather than refusing the place', () => {
    const parsed = newMarkerSchema.safeParse(NEW)
    expect(parsed.success).toBe(true)
    expect(parsed.success && parsed.data.plannedOn).toBe(null)
  })

  it('accepts a place saved straight onto a day', () => {
    const parsed = newMarkerSchema.safeParse({ ...NEW, plannedOn: '2026-04-03' })
    expect(parsed.success).toBe(true)
    expect(parsed.success && parsed.data.plannedOn).toBe('2026-04-03')
  })
})
