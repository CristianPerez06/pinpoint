import { say, type Language } from '@pinpoint/wording'
import { describe, expect, it } from 'vitest'

import { formatDistance as formatDistanceMessage } from './distance'

function formatDistance(km: number, language: Language = 'en') {
  return say(language, formatDistanceMessage(language, km))
}

describe('formatDistance', () => {
  it('keeps a tenth under ten kilometres', () => {
    expect(formatDistance(3.24)).toBe('3.2 km')
    expect(formatDistance(0)).toBe('0.0 km')
  })

  it('rounds to whole kilometres from ten', () => {
    expect(formatDistance(10)).toBe('10 km')
    expect(formatDistance(279.6)).toBe('280 km')
  })

  it('separates thousands in English', () => {
    expect(formatDistance(12345.4)).toBe('12,345 km')
  })

  it('writes a decimal comma in Spanish', () => {
    expect(formatDistance(3.24, 'es')).toBe('3,2 km')
  })

  // Spanish marks no thousands at four digits and a full stop from five, as
  // `price.test.ts` asserts for amounts.
  it('follows Spanish grouping', () => {
    expect(formatDistance(1234, 'es')).toBe('1234 km')
    expect(formatDistance(12345, 'es')).toBe('12.345 km')
  })
})
