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
  localPrice: null,
  localCurrency: null,
  plannedOn: null,
  plannedUntil: null,
  hours: null,
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

  it('leaves the hours out when the patch does not mention them', () => {
    const parsed = markerPatchSchema.safeParse({ note: 'Standing counter' })
    expect(parsed.success).toBe(true)
    expect(parsed.success && 'hours' in parsed.data).toBe(false)
  })

  it('clears the hours when the patch says null', () => {
    const parsed = markerPatchSchema.safeParse({ hours: null })
    expect(parsed.success && parsed.data.hours).toBe(null)
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

  it('accepts a local price in a currency', () => {
    const marker = markerSchema.parse({ ...VALID, localPrice: 3800, localCurrency: 'JPY' })
    expect(marker.localPrice).toBe(3800)
    expect(marker.localCurrency).toBe('JPY')
  })

  it('rejects a local price of 0, which would be free', () => {
    expect(
      markerSchema.safeParse({ ...VALID, localPrice: 0, localCurrency: 'JPY' }).success,
    ).toBe(false)
  })

  it('rejects USD as a local currency', () => {
    expect(
      markerSchema.safeParse({ ...VALID, localPrice: 25, localCurrency: 'USD' }).success,
    ).toBe(false)
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

  it('records an omitted local price as none', () => {
    const parsed = newMarkerSchema.parse(NEW)
    expect(parsed.localPrice).toBeNull()
    expect(parsed.localCurrency).toBeNull()
  })

  it('refuses a local price without its currency, naming the price field', () => {
    const result = newMarkerSchema.safeParse({ ...NEW, localPrice: 3800 })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.path).toEqual(['localPrice'])
    expect(newMarkerSchema.safeParse({ ...NEW, localCurrency: 'JPY' }).success).toBe(false)
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

  it('treats hours left out as no hours, rather than refusing the place', () => {
    const parsed = newMarkerSchema.safeParse(NEW)
    expect(parsed.success && parsed.data.hours).toBe(null)
  })

  it('accepts a place saved with hours', () => {
    const hours = { fri: [['19:00', '02:00']] }
    const parsed = newMarkerSchema.safeParse({ ...NEW, hours })
    expect(parsed.success && parsed.data.hours).toEqual(hours)
  })

  it('refuses hours that break the rules, under the hours field', () => {
    const parsed = newMarkerSchema.safeParse({ ...NEW, hours: { mon: [['09:00', '']] } })
    expect(parsed.success).toBe(false)
    expect(parsed.error?.issues[0]?.path[0]).toBe('hours')
  })
})

describe('markerPatchSchema and local prices', () => {
  it('leaves the local price alone when a patch does not mention it', () => {
    expect(markerPatchSchema.parse({ name: 'Renamed' })).toEqual({ name: 'Renamed' })
  })

  it('clears a local price as a pair', () => {
    expect(markerPatchSchema.safeParse({ localPrice: null, localCurrency: null }).success).toBe(true)
  })

  it('refuses half a pair', () => {
    expect(markerPatchSchema.safeParse({ localPrice: 3800 }).success).toBe(false)
  })
})

/*
 * A place planned for a run of days.
 *
 * The rules are stated twice on purpose — here, in the client's own voice and
 * naming a field somebody can see, and again as a check constraint on the
 * table. These tests are the first statement; the migration's rolled-back probe
 * is the second.
 */
describe('a run of days', () => {
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

  it('accepts a place planned from one day to a later one', () => {
    const parsed = newMarkerSchema.safeParse({
      ...NEW,
      plannedOn: '2026-04-03',
      plannedUntil: '2026-04-06',
    })
    expect(parsed.success).toBe(true)
    expect(parsed.success && parsed.data.plannedUntil).toBe('2026-04-06')
  })

  it('treats a run left out as a place planned for one day', () => {
    const parsed = newMarkerSchema.safeParse({ ...NEW, plannedOn: '2026-04-03' })
    expect(parsed.success).toBe(true)
    expect(parsed.success && parsed.data.plannedUntil).toBe(null)
  })

  /*
   * A single day has one representation. Storing "the 3rd to the 3rd" would
   * mean every reader of a day had to handle two, for ever — so the pair is
   * collapsed rather than refused: somebody pulling a run back to one day has
   * said something ordinary and the form should take it.
   */
  it('records a last day equal to the day as no run at all', () => {
    const parsed = newMarkerSchema.safeParse({
      ...NEW,
      plannedOn: '2026-04-03',
      plannedUntil: '2026-04-03',
    })
    expect(parsed.success).toBe(true)
    expect(parsed.success && parsed.data.plannedOn).toBe('2026-04-03')
    expect(parsed.success && parsed.data.plannedUntil).toBe(null)
  })

  it('refuses a last day falling before the day, naming the field', () => {
    const parsed = newMarkerSchema.safeParse({
      ...NEW,
      plannedOn: '2026-04-06',
      plannedUntil: '2026-04-03',
    })
    expect(parsed.success).toBe(false)
    expect(parsed.success === false && parsed.error.issues[0]?.path).toEqual([
      'plannedUntil',
    ])
  })

  it('refuses a last day with no day to start from', () => {
    const parsed = newMarkerSchema.safeParse({ ...NEW, plannedUntil: '2026-04-06' })
    expect(parsed.success).toBe(false)
    expect(parsed.success === false && parsed.error.issues[0]?.path).toEqual([
      'plannedUntil',
    ])
  })

  it('accepts a run of exactly a year', () => {
    const parsed = newMarkerSchema.safeParse({
      ...NEW,
      plannedOn: '2026-04-03',
      plannedUntil: '2027-04-03', // 365 days
    })
    expect(parsed.success).toBe(true)
  })

  /*
   * The typo this bound exists for: a slipped year turns three nights into a
   * run of some thirty-six thousand days. Refused where it is typed, rather
   * than quietly shortened somewhere it would read as the calendar losing rows.
   */
  it('refuses a run longer than a year', () => {
    const parsed = newMarkerSchema.safeParse({
      ...NEW,
      plannedOn: '2026-04-03',
      plannedUntil: '2126-04-06',
    })
    expect(parsed.success).toBe(false)
    expect(parsed.success === false && parsed.error.issues[0]?.path).toEqual([
      'plannedUntil',
    ])
  })

  it('lets an edit set and clear a run', () => {
    const set = markerPatchSchema.safeParse({
      plannedOn: '2026-04-03',
      plannedUntil: '2026-04-06',
    })
    expect(set.success && set.data.plannedUntil).toBe('2026-04-06')

    const cleared = markerPatchSchema.safeParse({
      plannedOn: '2026-04-03',
      plannedUntil: null,
    })
    expect(cleared.success && cleared.data.plannedUntil).toBe(null)
  })

  /*
   * An absent key means "leave this alone" in a patch, so an edit that mentions
   * neither date must not be read as clearing them — the defect the file warns
   * about for `plannedOn`, which would clear a run on every edit from anything
   * that did not mention one.
   */
  it('leaves a run alone in a patch that does not mention it', () => {
    const parsed = markerPatchSchema.safeParse({ name: 'Renamed' })
    expect(parsed.success).toBe(true)
    expect(parsed.success && 'plannedUntil' in parsed.data).toBe(false)
  })
})
