import { describe, expect, it } from 'vitest'

import {
  describeDays,
  describeHours,
  joinHours,
  normaliseTime,
  openingHoursOf,
  openingHoursSchema,
  EMPTY_HOURS_DRAFT,
  rangeHint,
  splitHours,
  toggleDay,
  WEEK,
  type HoursRange,
  type OpeningHours,
} from './opening-hours'

const nine: HoursRange = ['09:00', '17:00']

/** The worst case from the card's spec: four days, none neighbours, closing late. */
const bar: OpeningHours = {
  mon: [['19:00', '02:00']],
  wed: [['19:00', '02:00']],
  fri: [['19:00', '02:00']],
  sun: [['19:00', '02:00']],
}

const week = (days: readonly (typeof WEEK)[number][], range: HoursRange): OpeningHours =>
  Object.fromEntries(days.map((day) => [day, [range]]))

const valid = (hours: unknown) => openingHoursSchema.safeParse(hours).success

describe('openingHoursSchema', () => {
  it('accepts the worst case', () => {
    expect(valid(bar)).toBe(true)
  })

  it('accepts days closed in between', () => {
    expect(valid(week(['tue', 'wed', 'thu', 'fri', 'sat'], nine))).toBe(true)
  })

  it('refuses hours with no open day, so "closed all week" cannot be stored', () => {
    expect(valid({})).toBe(false)
  })

  it('accepts a range that closes the next morning', () => {
    expect(valid({ fri: [['20:00', '02:00']] })).toBe(true)
  })

  it('accepts equal times as open all day', () => {
    expect(valid({ mon: [['00:00', '00:00']] })).toBe(true)
  })

  it('refuses two ranges in one day', () => {
    expect(valid({ mon: [['12:00', '15:00'], ['19:00', '23:00']] })).toBe(false)
  })

  it('refuses ranges that overlap', () => {
    expect(valid({ mon: [['12:00', '16:00'], ['15:00', '23:00']] })).toBe(false)
  })

  it('refuses different hours on different days', () => {
    expect(valid({ mon: [nine], tue: [['10:00', '18:00']] })).toBe(false)
  })

  it('refuses a day with no ranges', () => {
    expect(valid({ mon: [] })).toBe(false)
  })

  it('refuses a missing time', () => {
    const result = openingHoursSchema.safeParse({ fri: [['09:00', '']] })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.message).toBe('Enter both times.')
  })

  it('refuses a time that is not a time', () => {
    expect(valid({ mon: [['24:00', '25:00']] })).toBe(false)
    expect(valid({ mon: [['9:00', '17:00']] })).toBe(false)
  })

  it('refuses a key that is not a day', () => {
    expect(valid({ monday: [nine] })).toBe(false)
  })
})

describe('openingHoursOf', () => {
  it('reads absent hours as absent, not as closed', () => {
    expect(openingHoursOf(null)).toBeNull()
  })

  it('reads a stored value that breaks the rules as no hours, rather than failing', () => {
    expect(openingHoursOf({ mon: 'nonsense' })).toBeNull()
  })

  it('reads a week with two ranges as no hours', () => {
    expect(openingHoursOf({ mon: [['12:00', '15:00'], ['19:00', '23:00']] })).toBeNull()
  })

  it('reads a valid week as given', () => {
    expect(openingHoursOf(bar)).toEqual(bar)
  })
})

describe('normaliseTime', () => {
  it.each([
    ['9', '09:00'],
    ['09', '09:00'],
    ['930', '09:30'],
    ['0930', '09:30'],
    ['9:30', '09:30'],
    ['09:30', '09:30'],
    ['21.15', '21:15'],
    [' 0 ', '00:00'],
  ])('reads %j as %s', (input, expected) => {
    expect(normaliseTime(input)).toBe(expected)
  })

  it.each(['', '24', '2400', '9:5', '12:60', 'nine', '12345'])('refuses %j', (input) => {
    expect(normaliseTime(input)).toBeNull()
  })
})

describe('rangeHint', () => {
  it('says a late close is the next day', () => {
    expect(rangeHint(['19:00', '02:00'])).toBe('Closes 02:00 the next day')
  })

  it('says equal times are all day', () => {
    expect(rangeHint(['00:00', '00:00'])).toBe('Open all day')
  })

  it('says nothing about an ordinary or unfinished range', () => {
    expect(rangeHint(['09:00', '17:00'])).toBeNull()
    expect(rangeHint(['19:00', ''])).toBeNull()
  })
})

describe('describeDays', () => {
  it('names a run as a span', () => {
    expect(describeDays(['tue', 'wed', 'thu', 'fri', 'sat'])).toBe('Open Tue to Sat')
  })

  it('names every day', () => {
    expect(describeDays([...WEEK])).toBe('Open every day')
  })

  it('lists days that are not a run', () => {
    expect(describeDays(['mon', 'wed', 'fri'])).toBe('Open Mon, Wed, Fri')
  })

  it('lists a pair rather than spanning it', () => {
    expect(describeDays(['sat', 'sun'])).toBe('Open Sat, Sun')
  })

  it('says nothing when no day is on', () => {
    expect(describeDays([])).toBeNull()
  })
})

describe('describeHours', () => {
  it('reads the worst case line by line', () => {
    expect(describeHours(bar)).toEqual([
      { days: 'Mon, Wed, Fri, Sun', text: '19:00–02:00', closed: false },
      { days: 'Closed', text: 'Tue, Thu, Sat', closed: true },
    ])
  })

  it('reads the same hours every day as Every day', () => {
    expect(describeHours(week(WEEK, ['09:00', '18:00']))).toEqual([
      { days: 'Every day', text: '09:00–18:00', closed: false },
    ])
  })

  it('reads weekdays only with the weekend closed', () => {
    expect(describeHours(week(WEEK.slice(0, 5), nine))).toEqual([
      { days: 'Mon–Fri', text: '09:00–17:00', closed: false },
      { days: 'Closed', text: 'Sat, Sun', closed: true },
    ])
  })

  it('puts days that are not neighbours on one line', () => {
    expect(describeHours(week(['mon', 'wed', 'fri'], nine))).toEqual([
      { days: 'Mon, Wed, Fri', text: '09:00–17:00', closed: false },
      { days: 'Closed', text: 'Tue, Thu, Sat, Sun', closed: true },
    ])
  })

  it('spans neighbours and lists the rest', () => {
    expect(describeHours(week(['mon', 'tue', 'wed', 'fri'], nine))[0]).toEqual({
      days: 'Mon–Wed, Fri',
      text: '09:00–17:00',
      closed: false,
    })
  })

  it('reads all day as 24 hours', () => {
    expect(describeHours(week(WEEK, ['00:00', '00:00']))).toEqual([
      { days: 'Every day', text: '24 hours', closed: false },
    ])
  })

  it('never takes more than two lines', () => {
    for (let mask = 1; mask < 128; mask += 1) {
      const days = WEEK.filter((_, i) => mask & (1 << i))
      expect(describeHours(week(days, nine)).length).toBeLessThanOrEqual(2)
    }
  })
})

describe('splitHours and joinHours', () => {
  it('opens a place with no hours with no day on', () => {
    expect(splitHours(null)).toEqual({ days: [], range: ['', ''] })
  })

  it('opens a place with its days and its range', () => {
    expect(splitHours(week(['mon', 'wed', 'fri'], nine))).toEqual({
      days: ['mon', 'wed', 'fri'],
      range: nine,
    })
  })

  it('saves no hours when no day is on, whatever times were typed', () => {
    expect(joinHours({ days: [], range: nine })).toBeNull()
  })

  it('gives every day turned on the range, normalised', () => {
    expect(joinHours({ days: ['mon', 'tue', 'wed', 'thu', 'fri'], range: ['9', '1700'] })).toEqual(
      week(WEEK.slice(0, 5), nine),
    )
  })

  it('keeps a half-filled range for the schema to refuse', () => {
    expect(valid(joinHours({ days: ['mon'], range: ['19:00', ''] }))).toBe(false)
  })

  it('writes back exactly what it read, for every set of days', () => {
    const ranges: HoursRange[] = [nine, ['20:00', '02:00'], ['00:00', '00:00']]
    for (const range of ranges) {
      for (let mask = 1; mask < 128; mask += 1) {
        const hours = week(WEEK.filter((_, i) => mask & (1 << i)), range)
        expect(joinHours(splitHours(hours))).toEqual(hours)
      }
    }
  })
})

describe('editing a draft', () => {
  it('turns days on in week order', () => {
    let draft = toggleDay(EMPTY_HOURS_DRAFT, 'fri')
    draft = toggleDay(draft, 'mon')
    expect(draft.days).toEqual(['mon', 'fri'])
  })

  it('turns a day off and keeps the range as typed', () => {
    const draft = toggleDay({ days: ['mon', 'tue'], range: nine }, 'tue')
    expect(draft).toEqual({ days: ['mon'], range: nine })
  })
})
