import { describe, expect, it, vi } from 'vitest'

import { formatDay, formatDayFull, formatDayNumeric, formatDayShort } from './day-wording'

describe('day wording', () => {
  it('words a day as the laptop already worded it', () => {
    // `en-GB`, so "Friday 3 April" rather than "Friday, April 3". The day
    // columns were designed around this reading.
    expect(formatDay('2026-04-03')).toBe('Friday 3 April')
    expect(formatDayShort('2026-04-03')).toBe('Fri 3 Apr')
    // The full one carries a comma before the year and the other two carry
    // none. That is `en-GB`'s own answer rather than a choice made here, and it
    // is asserted because it is what the laptop has been announcing.
    expect(formatDayFull('2026-04-03')).toBe('Friday, 3 April 2026')
  })

  it('shows a day in a date field as the laptop does', () => {
    // Day first, zero-padded — what the laptop's date input reads.
    expect(formatDayNumeric('2026-04-03')).toBe('03/04/2026')
    expect(formatDayNumeric('2026-12-31')).toBe('31/12/2026')
  })

  it('is the same wording whatever the runtime prefers', () => {
    // The whole point of pinning it. A runtime defaulting to Spanish is what
    // broke hydration on web, and it presented as controls that did nothing.
    const previous = process.env.LANG
    process.env.LANG = 'es_ES.UTF-8'
    try {
      expect(formatDay('2026-10-08')).toBe('Thursday 8 October')
    } finally {
      process.env.LANG = previous
    }
  })

  it('names the day the string names, not the one UTC midnight lands on', () => {
    // `new Date('2026-04-03')` parses as UTC midnight and prints as the 2nd
    // anywhere west of Greenwich. Every format here goes through `dateOfDay`,
    // which takes the parts, so the first of a month stays the first.
    expect(formatDay('2026-01-01')).toBe('Thursday 1 January')
    expect(formatDayFull('2025-12-31')).toBe('Wednesday, 31 December 2025')
  })

  it('gives back the day itself when the runtime cannot word it', () => {
    // The data behind `Intl` is thinner on a React Native runtime than in a
    // browser — the reason `formatPrice` carries the same guard. A formatter
    // that throws while rendering takes the whole surface with it, so this
    // returns something readable instead.
    const broken = vi
      .spyOn(Date.prototype, 'toLocaleDateString')
      .mockImplementation(() => {
        throw new Error('no date formatting on this runtime')
      })

    try {
      expect(formatDay('2026-04-03')).toBe('2026-04-03')
      expect(formatDayShort('2026-04-03')).toBe('2026-04-03')
      expect(formatDayFull('2026-04-03')).toBe('2026-04-03')
    } finally {
      broken.mockRestore()
    }
  })
})
