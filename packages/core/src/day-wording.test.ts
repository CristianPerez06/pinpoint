import { say, type Language } from '@pinpoint/wording'
import { describe, expect, it, vi } from 'vitest'

import {
  formatDay,
  formatDayCompact,
  formatDayFull,
  formatDayNumeric,
  formatDayRange as formatDayRangeMessage,
  formatDayShort,
  formatDayStretch,
  formatRunPosition,
} from './day-wording'
import type { IsoDay } from './marker-day'

/** The range as a person reads it, so each assertion states the words. */
function formatDayRange(language: Language, from: IsoDay | null, to: IsoDay | null) {
  const range = formatDayRangeMessage(language, from, to)
  return range === null ? null : say(language, range)
}

describe('day wording in English', () => {
  it('words a day as the laptop already worded it', () => {
    // `en-GB`, so "Friday 3 April" rather than "Friday, April 3". The day
    // columns were designed around this reading.
    expect(formatDay('en', '2026-04-03')).toBe('Friday 3 April')
    expect(formatDayShort('en', '2026-04-03')).toBe('Fri 3 Apr')
    expect(formatDayCompact('en', '2026-04-03')).toBe('3 Apr')
  })

  it('names a day in full as the on-screen wording plus its year', () => {
    // Asked of `Intl` on its own, `en-GB` answers `Friday, 3 April 2026` — with
    // a comma the on-screen forms do not carry. Nobody chose that comma, and it
    // made a screen reader announce a day the screen beside it wrote
    // differently. The full form is now composed from `formatDay`, so the only
    // difference it can have is the year.
    expect(formatDayFull('en', '2026-04-03')).toBe('Friday 3 April 2026')
    expect(formatDayFull('en', '2026-04-03')).toBe(`${formatDay('en', '2026-04-03')} 2026`)
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
      expect(formatDay('en', '2026-10-08')).toBe('Thursday 8 October')
    } finally {
      process.env.LANG = previous
    }
  })

  it('names the day the string names, not the one UTC midnight lands on', () => {
    // `new Date('2026-04-03')` parses as UTC midnight and prints as the 2nd
    // anywhere west of Greenwich. Every format here goes through `dateOfDay`,
    // which takes the parts, so the first of a month stays the first.
    expect(formatDay('en', '2026-01-01')).toBe('Thursday 1 January')
    expect(formatDayFull('en', '2025-12-31')).toBe('Wednesday 31 December 2025')
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
      expect(formatDay('en', '2026-04-03')).toBe('2026-04-03')
      expect(formatDayShort('en', '2026-04-03')).toBe('2026-04-03')
      expect(formatDayFull('en', '2026-04-03')).toBe('2026-04-03')
    } finally {
      broken.mockRestore()
    }
  })
})

describe('a stretch of days in English', () => {
  it('writes the month once where both ends share it', () => {
    expect(formatDayRange('en', '2026-10-09', '2026-10-26')).toBe('9–26 Oct 2026')
  })

  it('writes both months where the stretch crosses one', () => {
    // `Sept`, not `Sep`: `en-GB` gives September four letters and every other
    // month three. That is the locale's answer and the same one the calendar
    // and the filter already show, so it is pinned rather than corrected.
    expect(formatDayRange('en', '2027-09-28', '2027-10-03')).toBe('28 Sept – 3 Oct 2027')
  })

  it('gives each end its own year where the stretch crosses one', () => {
    expect(formatDayRange('en', '2026-12-28', '2027-01-03')).toBe(
      '28 Dec 2026 – 3 Jan 2027',
    )
  })

  it('writes one day as that day', () => {
    expect(formatDayRange('en', '2026-11-14', '2026-11-14')).toBe('14 Nov 2026')
  })

  it('says which end a lone date is', () => {
    // `14 Nov 2026` on its own could be read as either end of the trip, which
    // is the whole reason these carry a word.
    expect(formatDayRange('en', '2026-11-14', null)).toBe('From 14 Nov 2026')
    expect(formatDayRange('en', null, '2027-03-08')).toBe('Until 8 Mar 2027')
  })

  it('has nothing to say about a trip carrying no dates', () => {
    // Null rather than an empty string, so a caller cannot render a label with
    // nothing in it without noticing.
    expect(formatDayRange('en', null, null)).toBeNull()
  })

  it('always carries the year, even within one month', () => {
    // The rule this pins: a stretch written without a year reads correctly
    // until the year it means stops being obvious, and trips are planned a year
    // ahead. Collapsing the month is what pays for the width.
    expect(formatDayRange('en', '2026-04-03', '2026-04-09')).toBe('3–9 Apr 2026')
  })

  it('does not quietly swap an end that falls before its start', () => {
    // Refused when a trip's dates are saved, so this is the guard for a row
    // written by something that did not go through that rule. Swapping them
    // would state an order nobody entered, so both are written in full.
    expect(formatDayRange('en', '2026-10-26', '2026-10-09')).toBe(
      '26 Oct 2026 – 9 Oct 2026',
    )
  })

  it('keeps the first of a month on the first', () => {
    // `new Date('2026-10-01')` parses as UTC midnight and prints as September
    // the 30th west of Greenwich — the drift this whole module exists against,
    // which a range could reintroduce at either end.
    expect(formatDayRange('en', '2026-10-01', '2026-10-31')).toBe('1–31 Oct 2026')
  })

  it('gives back both days when the runtime cannot word them', () => {
    // Without this the collapsed form would splice a stored string into the
    // middle of a worded date — `9–2026-10-26`.
    const broken = vi
      .spyOn(Date.prototype, 'toLocaleDateString')
      .mockImplementation(() => {
        throw new Error('no date formatting on this runtime')
      })

    try {
      expect(formatDayRange('en', '2026-10-09', '2026-10-26')).toBe(
        '2026-10-09 – 2026-10-26',
      )
      expect(formatDayRange('en', '2026-10-09', null)).toBe('From 2026-10-09')
      expect(formatDayRange('en', null, null)).toBeNull()
    } finally {
      broken.mockRestore()
    }
  })
})

/**
 * Every form in Spanish, written out.
 *
 * None of these can be arrived at by substituting words into the English: the
 * comma after the weekday, `de` before the month and the year, lower-case names,
 * `sept` with four letters. Written out so a reviewer can tell a wording
 * decision from whatever a runtime happened to answer — which is the whole
 * reason the specification lists them.
 */
describe('day wording in Spanish', () => {
  it('writes the five forms of a day', () => {
    expect(formatDay('es', '2026-04-03')).toBe('viernes, 3 de abril')
    expect(formatDayShort('es', '2026-04-03')).toBe('vie, 3 abr')
    expect(formatDayCompact('es', '2026-04-03')).toBe('3 abr')
    expect(formatDayFull('es', '2026-04-03')).toBe('viernes, 3 de abril de 2026')
    expect(formatDayNumeric('2026-04-03')).toBe('03/04/2026')
  })

  it('names a day in full as the on-screen wording plus its year', () => {
    // The Spanish comma is kept, because the rule is that the two forms agree,
    // not that there is no comma.
    expect(formatDayFull('es', '2026-04-03')).toBe(`${formatDay('es', '2026-04-03')} de 2026`)
  })

  it('writes the four forms of a stretch', () => {
    expect(formatDayRange('es', '2027-09-28', '2027-10-03')).toBe('28 sept – 3 oct 2027')
    expect(formatDayRange('es', '2026-10-09', '2026-10-26')).toBe('9–26 oct 2026')
    expect(formatDayRange('es', '2026-12-28', '2027-01-03')).toBe('28 dic 2026 – 3 ene 2027')
    expect(formatDayRange('es', '2026-11-14', '2026-11-14')).toBe('14 nov 2026')
  })

  it('says which end a lone date is', () => {
    expect(formatDayRange('es', '2026-11-14', null)).toBe('Desde el 14 nov 2026')
    expect(formatDayRange('es', null, '2027-03-08')).toBe('Hasta el 8 mar 2027')
  })

  it('is the same wording whatever the runtime prefers', () => {
    const previous = process.env.LANG
    process.env.LANG = 'de_DE.UTF-8'
    try {
      expect(formatDay('es', '2026-10-08')).toBe('jueves, 8 de octubre')
      expect(formatDay('en', '2026-10-08')).toBe('Thursday 8 October')
    } finally {
      process.env.LANG = previous
    }
  })
})

describe('a stretch whose both ends are known', () => {
  it('is the stretch alone, with no words around it', () => {
    expect(formatDayStretch('en', '2026-04-03', '2026-04-09')).toBe('3–9 Apr 2026')
    expect(formatDayStretch('es', '2026-04-03', '2026-04-09')).toBe('3–9 abr 2026')
  })
})

describe('where a place sits in its run of days', () => {
  it('reads in either language', () => {
    expect(say('en', formatRunPosition({ index: 2, total: 4 }))).toBe('Day 2 of 4')
    expect(say('es', formatRunPosition({ index: 2, total: 4 }))).toBe('Día 2 de 4')
  })
})
