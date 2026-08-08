import { describe, expect, it } from 'vitest'

import { markerTypeSchema } from './marker-type'

// The type list itself is tested in @pinpoint/map, where it lives. What is
// tested here is the only thing this package still owns: what may be written.
describe('markerTypeSchema', () => {
  it('accepts a known type', () => {
    expect(markerTypeSchema.safeParse('cafe').success).toBe(true)
  })

  it('rejects an unknown type on write', () => {
    // Deliberately stricter than reads, which fall back rather than reject.
    expect(markerTypeSchema.safeParse('onsen').success).toBe(false)
  })
})
