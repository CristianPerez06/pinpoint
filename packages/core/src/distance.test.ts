import { say, type Language } from '@pinpoint/wording'
import { describe, expect, it } from 'vitest'

import {
  formatDistance as formatDistanceMessage,
  formatWalkingDistance as formatWalkingDistanceMessage,
  formatWalkingTime as formatWalkingTimeMessage,
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

describe('formatWalkingTime', () => {
  const walk = (minutes: number, language: Language = 'en') =>
    say(language, formatWalkingTimeMessage(language, minutes))

  it('writes minutes under an hour', () => {
    expect(walk(5)).toBe('About 5 min walk')
    expect(walk(25)).toBe('About 25 min walk')
    expect(walk(55)).toBe('About 55 min walk')
  })

  it('writes hours and minutes from an hour', () => {
    expect(walk(70)).toBe('About 1 h 10 min walk')
    expect(walk(615)).toBe('About 10 h 15 min walk')
  })

  it('leaves out minutes that come to zero', () => {
    expect(walk(60)).toBe('About 1 h walk')
    expect(walk(120)).toBe('About 2 h walk')
  })

  it('is impersonal in Spanish', () => {
    expect(walk(25, 'es')).toBe('Unos 25 min a pie')
    expect(walk(615, 'es')).toBe('Unas 10 h 15 min a pie')
    expect(walk(120, 'es')).toBe('Unas 2 h a pie')
  })
})
