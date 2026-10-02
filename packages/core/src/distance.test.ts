import { say, type Language } from '@pinpoint/wording'
import { describe, expect, it } from 'vitest'

import {
  formatDistance as formatDistanceMessage,
  formatWalkingDistance as formatWalkingDistanceMessage,
} from './distance'

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

describe('formatWalkingDistance', () => {
  function walking(km: number, language: Language = 'en') {
    return say(language, formatWalkingDistanceMessage(language, km))
  }

  it('writes metres under a kilometre, to the nearest ten', () => {
    expect(walking(0.004)).toBe('0 m')
    expect(walking(0.346)).toBe('350 m')
  })

  it('does not write a thousand metres', () => {
    expect(walking(0.999)).toBe('1.0 km')
    expect(walking(1)).toBe('1.0 km')
  })

  it('keeps the kilometre form from a kilometre', () => {
    expect(walking(9.94)).toBe('9.9 km')
    expect(walking(34)).toBe('34 km')
  })

  it('follows the language', () => {
    expect(walking(0.346, 'es')).toBe('350 m')
    expect(walking(1.24, 'es')).toBe('1,2 km')
  })
})
