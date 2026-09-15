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
    // The asymmetry is the point. Rows hold `castle` and must keep rendering as
    // `culture`; nothing should be storing `castle` any more. `markerTypeOf`
    // answers the read, this answers the write, and they disagree on purpose.
    expect(markerTypeSchema.safeParse('castle').success).toBe(false)
  })

  it('accepts `temple`, which was retired and is a type again', () => {
    // The example this test used to be written against. `temple` spent one
    // change as a retired identifier and is live now, so the write side has to
    // accept it — and a schema still refusing it would block saving the very
    // type the eighth colour was spent on.
    expect(markerTypeSchema.safeParse('temple').success).toBe(true)
  })
})
