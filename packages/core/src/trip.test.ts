import { describe, expect, it } from 'vitest'

import { newTripSchema, tripSchema } from './trip'

const VALID = {
  id: '00000000-0000-4000-8000-000000000000',
  name: 'Japan 2026',
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
  it('needs only a name', () => {
    expect(newTripSchema.safeParse({ name: 'Japan 2026' }).success).toBe(true)
  })

  it('still enforces the name rules', () => {
    expect(newTripSchema.safeParse({ name: '' }).success).toBe(false)
  })
})
