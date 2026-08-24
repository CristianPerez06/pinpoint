import { describe, expect, it } from 'vitest'

import { newTripSchema, tripPatchSchema, tripSchema } from './trip'

const VALID = {
  id: '00000000-0000-4000-8000-000000000000',
  name: 'Japan 2026',
  archived: false,
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
})
