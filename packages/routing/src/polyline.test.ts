import { describe, expect, it } from 'vitest'

import { decodePolyline } from './polyline'

describe('decodePolyline', () => {
  it("decodes Google's documented example at five places", () => {
    expect(decodePolyline('_p~iF~ps|U_ulLnnqC_mqNvxq`@', 5)).toEqual([
      { lat: 38.5, lng: -120.2 },
      { lat: 40.7, lng: -120.95 },
      { lat: 43.252, lng: -126.453 },
    ])
  })

  it('reads the same digits at six places as a tenth of the value', () => {
    const [first] = decodePolyline('_p~iF~ps|U', 6)
    expect(first.lat).toBeCloseTo(3.85, 6)
    expect(first.lng).toBeCloseTo(-12.02, 6)
  })

  it('stops at a truncated pair rather than inventing a point', () => {
    expect(decodePolyline('_p~iF~ps|U_ulL', 5)).toHaveLength(1)
  })
})
