import { describe, expect, it } from 'vitest'

import { newTripSchema, tripPatchSchema, tripSchema } from './trip'

const VALID = {
  id: '00000000-0000-4000-8000-000000000000',
  name: 'Japan 2026',
  archived: false,
  startsOn: null,
  endsOn: null,
  createdAt: '2026-08-02T12:00:00.000Z',
}

describe('tripSchema', () => {
  it('accepts a well-formed trip', () => {
    expect(tripSchema.parse(VALID)).toEqual(VALID)
  })

  it('rejects an empty name', () => {
    expect(tripSchema.safeParse({ ...VALID, name: '' }).success).toBe(false)
  })

  it('rejects an over-long name', () => {
    expect(
      tripSchema.safeParse({ ...VALID, name: 'x'.repeat(121) }).success,
    ).toBe(false)
  })

  it('rejects a non-uuid id', () => {
    expect(tripSchema.safeParse({ ...VALID, id: '123' }).success).toBe(false)
  })

  it('accepts a trip carrying both dates', () => {
    const dated = { ...VALID, startsOn: '2026-04-01', endsOn: '2026-04-14' }
    expect(tripSchema.parse(dated)).toEqual(dated)
  })

  it('accepts one date without the other', () => {
    expect(
      tripSchema.safeParse({ ...VALID, startsOn: '2026-04-01' }).success,
    ).toBe(true)
    expect(tripSchema.safeParse({ ...VALID, endsOn: '2026-04-14' }).success).toBe(
      true,
    )
  })

  it('rejects a date that is not a calendar date', () => {
    expect(tripSchema.safeParse({ ...VALID, startsOn: '2026-13-01' }).success).toBe(
      false,
    )
    expect(
      tripSchema.safeParse({ ...VALID, startsOn: '2026-04-01T00:00:00Z' })
        .success,
    ).toBe(false)
  })

  /*
   * A read resolves what it is given rather than refusing it, and the check
   * constraint on `trips` is what guarantees the ordering for every writer.
   * Refining the read shape would also break `.pick()`, which both schemas
   * below are built with — zod 4 refuses it on an object carrying refinements.
   */
  it('does not judge the order of dates it is handed', () => {
    expect(
      tripSchema.safeParse({
        ...VALID,
        startsOn: '2026-04-14',
        endsOn: '2026-04-01',
      }).success,
    ).toBe(true)
  })
})

describe('newTripSchema', () => {
  it('needs a trip name and a name for the creator', () => {
    expect(
      newTripSchema.safeParse({ name: 'Japan 2026', displayName: 'Cristian' })
        .success,
    ).toBe(true)
  })

  /*
   * This used to pass with only a name, and no longer does.
   *
   * A trip cannot exist without a member, so creating one always creates a
   * membership too — and that membership needs a name somebody chose. Accepting
   * a trip name alone would mean the database had to invent the other, which is
   * how a member list ends up reading `cristian.ap84`.
   */
  it('rejects a trip name with no name for the creator', () => {
    expect(newTripSchema.safeParse({ name: 'Japan 2026' }).success).toBe(false)
  })

  it('still enforces the name rules', () => {
    expect(
      newTripSchema.safeParse({ name: '', displayName: 'Cristian' }).success,
    ).toBe(false)
  })

  it('accepts a trip created with both dates', () => {
    expect(
      newTripSchema.safeParse({
        name: 'Japan 2026',
        displayName: 'Cristian',
        startsOn: '2026-04-01',
        endsOn: '2026-04-14',
      }).success,
    ).toBe(true)
  })

  it('accepts a trip created with no dates', () => {
    expect(
      newTripSchema.safeParse({
        name: 'Japan 2026',
        displayName: 'Cristian',
        startsOn: null,
        endsOn: null,
      }).success,
    ).toBe(true)
  })

  it('treats dates left out as no dates, rather than refusing them', () => {
    const parsed = newTripSchema.safeParse({
      name: 'Japan 2026',
      displayName: 'Cristian',
    })
    expect(parsed.success).toBe(true)
    expect(parsed.success && parsed.data.startsOn).toBe(null)
    expect(parsed.success && parsed.data.endsOn).toBe(null)
  })

  it('accepts a trip created with one date and not the other', () => {
    expect(
      newTripSchema.safeParse({
        name: 'Japan 2026',
        displayName: 'Cristian',
        startsOn: '2026-04-01',
        endsOn: null,
      }).success,
    ).toBe(true)
  })

  it('rejects an end date before the start date, naming the end date', () => {
    const parsed = newTripSchema.safeParse({
      name: 'Japan 2026',
      displayName: 'Cristian',
      startsOn: '2026-04-14',
      endsOn: '2026-04-01',
    })
    expect(parsed.success).toBe(false)
    expect(parsed.success === false && parsed.error.issues[0]?.path).toEqual([
      'endsOn',
    ])
  })

  it('accepts a trip that starts and ends on the same day', () => {
    expect(
      newTripSchema.safeParse({
        name: 'A day out',
        displayName: 'Cristian',
        startsOn: '2026-04-01',
        endsOn: '2026-04-01',
      }).success,
    ).toBe(true)
  })

  it('enforces the member name rules the member schema defines', () => {
    expect(
      newTripSchema.safeParse({ name: 'Japan 2026', displayName: '' }).success,
    ).toBe(false)
    expect(
      newTripSchema.safeParse({
        name: 'Japan 2026',
        displayName: 'x'.repeat(61),
      }).success,
    ).toBe(false)
  })
})

describe('tripPatchSchema', () => {
  it('accepts a rename', () => {
    expect(tripPatchSchema.safeParse({ name: 'Japan 2027' }).success).toBe(true)
  })

  it('accepts an empty patch', () => {
    expect(tripPatchSchema.safeParse({}).success).toBe(true)
  })

  it('still enforces the name rules', () => {
    expect(tripPatchSchema.safeParse({ name: '' }).success).toBe(false)
  })

  /*
   * `archived` was modelled on a trip and deliberately not writable, and this
   * test asserted it was stripped. It held from the initial schema until the
   * trips sheet gave archiving somewhere to be set from. Inverted on purpose,
   * not tripped over.
   */
  it('accepts archived', () => {
    const parsed = tripPatchSchema.safeParse({ archived: true })
    expect(parsed.success).toBe(true)
    expect(parsed.success && parsed.data.archived).toBe(true)
  })

  it('accepts un-archiving, because archiving has to be reversible', () => {
    const parsed = tripPatchSchema.safeParse({ archived: false })
    expect(parsed.success).toBe(true)
    expect(parsed.success && parsed.data.archived).toBe(false)
  })

  it('leaves archived out when the patch does not mention it', () => {
    // Partial, like a city's. Renaming a trip must not carry an implicit
    // `archived: false` that would restore one nobody asked to restore.
    const parsed = tripPatchSchema.safeParse({ name: 'Japan 2027' })
    expect(parsed.success).toBe(true)
    expect(parsed.success && 'archived' in parsed.data).toBe(false)
  })

  it('rejects a non-boolean archived', () => {
    expect(tripPatchSchema.safeParse({ archived: 'yes' }).success).toBe(false)
  })

  it('accepts setting both dates', () => {
    expect(
      tripPatchSchema.safeParse({
        startsOn: '2026-04-01',
        endsOn: '2026-04-14',
      }).success,
    ).toBe(true)
  })

  it('accepts clearing both dates', () => {
    const parsed = tripPatchSchema.safeParse({ startsOn: null, endsOn: null })
    expect(parsed.success).toBe(true)
    expect(parsed.success && parsed.data.startsOn).toBe(null)
  })

  it('rejects an end date before the start date, naming the end date', () => {
    const parsed = tripPatchSchema.safeParse({
      startsOn: '2026-04-14',
      endsOn: '2026-04-01',
    })
    expect(parsed.success).toBe(false)
    expect(parsed.success === false && parsed.error.issues[0]?.path).toEqual([
      'endsOn',
    ])
  })

  /*
   * A patch naming one date alone cannot be judged here — the other is in the
   * database, not in the request. `trips_dates_ordered` is what covers it, and
   * it covers it for every writer rather than only for this one.
   */
  it('accepts one date alone, leaving the ordering to the database', () => {
    expect(tripPatchSchema.safeParse({ endsOn: '2026-04-01' }).success).toBe(true)
    expect(tripPatchSchema.safeParse({ startsOn: '2026-04-14' }).success).toBe(
      true,
    )
  })

  it('leaves the dates out when the patch does not mention them', () => {
    const parsed = tripPatchSchema.safeParse({ name: 'Japan 2027' })
    expect(parsed.success).toBe(true)
    expect(parsed.success && 'startsOn' in parsed.data).toBe(false)
  })
})

describe('a refused trip says what is wrong', () => {
  const complainAbout = (field: string, value: unknown) => {
    const parsed = newTripSchema.safeParse({
      name: 'Japan 2026',
      displayName: 'Sam',
      [field]: value,
    })
    return parsed.success
      ? undefined
      : parsed.error.issues.find((issue) => issue.path[0] === field)?.message
  }

  it('an empty name', () => {
    expect(complainAbout('name', '')).toBe('trip.needsName')
  })

  it('a name past its limit', () => {
    expect(complainAbout('name', 'x'.repeat(121))).toBe(
      'trip.nameTooLong',
    )
  })

  it('a date that is not a date', () => {
    expect(complainAbout('startsOn', 'April')).toBe(
      'trip.startMalformed',
    )
    expect(complainAbout('endsOn', 'later')).toBe(
      'trip.endMalformed',
    )
  })

  /*
   * The name the creator is called on the trip they are making. The same rule
   * serves the people sheet, where it is somebody else being named — which is
   * why the sentence says neither "your name" nor "their name".
   */
  it('no name to be called by', () => {
    expect(complainAbout('displayName', '')).toBe('member.needsDisplayName')
  })

  // Already written in our own voice before this change, and left as it was.
  it('an end before the start', () => {
    const parsed = newTripSchema.safeParse({
      name: 'Japan 2026',
      displayName: 'Sam',
      startsOn: '2026-04-10',
      endsOn: '2026-04-03',
    })
    expect(parsed.success).toBe(false)
    expect(!parsed.success && parsed.error.issues[0]?.message).toBe(
      'trip.endBeforeStart',
    )
  })
})
