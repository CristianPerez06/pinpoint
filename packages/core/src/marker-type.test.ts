import { describe, expect, it } from 'vitest'

import { markerTypeSchema } from './marker-type'

// The type list itself is tested in @pinpoint/map, where it lives. What is
// tested here is the only thing this package still owns: what may be written.
describe('markerTypeSchema', () => {
  it('accepts a live type', () => {
    expect(markerTypeSchema.safeParse('food').success).toBe(true)
  })

  it('rejects an unknown type on write', () => {
    // Deliberately stricter than reads, which fall back rather than reject.
    expect(markerTypeSchema.safeParse('onsen').success).toBe(false)
  })

  it('rejects a retired type on write, though a read accepts one', () => {
    // The asymmetry is the point. Rows hold `temple` and must keep rendering as
    // `culture`; nothing should be storing `temple` any more. `markerTypeOf`
    // answers the read, this answers the write, and they disagree on purpose.
    expect(markerTypeSchema.safeParse('temple').success).toBe(false)
  })
})
