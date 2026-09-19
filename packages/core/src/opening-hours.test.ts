import { describe, expect, it } from 'vitest'

import {
  describeDays,
  describeHours,
  joinHours,
  normaliseTime,
  openingHoursOf,
  openingHoursSchema,
  daysNotApart,
  EMPTY_HOURS_DRAFT,
  rangeHint,
  rejoinDay,
  setDayApart,
  splitHours,
  toggleDay,
  WEEK,
  type HoursRange,
  type OpeningHours,
} from './opening-hours'

const lunch: HoursRange = ['12:00', '15:00']
const dinner: HoursRange = ['19:00', '23:00']

/** The worst case from the spec and the mock. */
const bar: OpeningHours = {
  tue: [lunch, dinner],
  wed: [lunch, dinner],
  thu: [lunch, dinner],
  fri: [lunch, ['19:00', '02:00']],
  sat: [['10:00', '14:00']],
}

const valid = (hours: unknown) => openingHoursSchema.safeParse(hours).success

describe('openingHoursSchema', () => {
  it('accepts the worst case', () => {
    expect(valid(bar)).toBe(true)
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

  it('refuses a second range beside an all-day one', () => {
    expect(valid({ mon: [['00:00', '00:00'], dinner] })).toBe(false)
  })

  it('refuses ranges that overlap', () => {
    expect(valid({ mon: [['12:00', '16:00'], ['15:00', '23:00']] })).toBe(false)
  })

  it('refuses a second range that starts before the first', () => {
    expect(valid({ mon: [dinner, lunch] })).toBe(false)
  })

  it('refuses a first range that runs past midnight when a second follows', () => {
    expect(valid({ mon: [['20:00', '02:00'], ['03:00', '05:00']] })).toBe(false)
  })

  it('refuses a third range', () => {
    expect(valid({ mon: [['08:00', '09:00'], lunch, dinner] })).toBe(false)
  })

  it('refuses a day with no ranges', () => {
    expect(valid({ mon: [] })).toBe(false)
  })

  it('refuses a missing time, naming the day', () => {
    const result = openingHoursSchema.safeParse({ fri: [['09:00', '']] })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.message).toContain('Friday')
  })

  it('refuses a time that is not a time', () => {
    expect(valid({ mon: [['24:00', '25:00']] })).toBe(false)
    expect(valid({ mon: [['9:00', '17:00']] })).toBe(false)
  })

  it('refuses a key that is not a day', () => {
    expect(valid({ monday: [lunch] })).toBe(false)
  })
})

describe('openingHoursOf', () => {
  it('reads absent hours as absent, not as closed', () => {
    expect(openingHoursOf(null)).toBeNull()
  })

  it('reads a stored value that breaks the rules as no hours, rather than failing', () => {
    expect(openingHoursOf({ mon: 'nonsense' })).toBeNull()
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
      { days: 'Tue–Thu', text: '12:00–15:00, 19:00–23:00', closed: false },
      { days: 'Fri', text: '12:00–15:00, 19:00–02:00', closed: false },
      { days: 'Sat', text: '10:00–14:00', closed: false },
      { days: 'Closed', text: 'Mon, Sun', closed: true },
    ])
  })

  it('reads the same hours every day as Every day', () => {
    const every = Object.fromEntries(WEEK.map((day) => [day, [['09:00', '18:00']]]))
    expect(describeHours(every)).toEqual([
      { days: 'Every day', text: '09:00–18:00', closed: false },
    ])
  })

  it('reads weekdays only with the weekend closed', () => {
    const weekdays = Object.fromEntries(
      WEEK.slice(0, 5).map((day) => [day, [['09:00', '17:00']]]),
    )
    expect(describeHours(weekdays)).toEqual([
      { days: 'Mon–Fri', text: '09:00–17:00', closed: false },
      { days: 'Closed', text: 'Sat, Sun', closed: true },
    ])
  })

  it('reads all day as 24 hours', () => {
    const always = Object.fromEntries(WEEK.map((day) => [day, [['00:00', '00:00']]]))
    expect(describeHours(always)).toEqual([
      { days: 'Every day', text: '24 hours', closed: false },
    ])
  })

  it('does not join days with the same hours that are not neighbours', () => {
    expect(describeHours({ mon: [lunch], tue: [dinner], wed: [lunch] })).toEqual([
      { days: 'Mon', text: '12:00–15:00', closed: false },
      { days: 'Tue', text: '19:00–23:00', closed: false },
      { days: 'Wed', text: '12:00–15:00', closed: false },
      { days: 'Closed', text: 'Thu, Fri, Sat, Sun', closed: true },
    ])
  })

  it('never takes more than seven lines', () => {
    const hours: OpeningHours = {}
    WEEK.forEach((day, i) => {
      if (i % 2 === 0) hours[day] = [[`0${i}:00`, '12:00']]
    })
    expect(describeHours(hours).length).toBeLessThanOrEqual(7)

    const allDifferent = Object.fromEntries(
      WEEK.map((day, i) => [day, [[`0${i}:00`, '20:00']]]),
    )
    expect(describeHours(allDifferent)).toHaveLength(7)
  })
})

describe('splitHours and joinHours', () => {
  it('opens a place with no hours with no day on', () => {
    expect(splitHours(null)).toEqual({ days: [], usual: [['', '']], apart: [] })
  })

  it('takes the hours most days share as the usual hours', () => {
    expect(splitHours(bar)).toEqual({
      days: ['tue', 'wed', 'thu', 'fri', 'sat'],
      usual: [lunch, dinner],
      apart: [
        { day: 'fri', ranges: [lunch, ['19:00', '02:00']] },
        { day: 'sat', ranges: [['10:00', '14:00']] },
      ],
    })
  })

  it('gives a tie to the earliest day of the week', () => {
    const split = splitHours({ mon: [lunch], tue: [lunch], sat: [dinner], sun: [dinner] })
    expect(split.usual).toEqual([lunch])
    expect(split.apart.map((entry) => entry.day)).toEqual(['sat', 'sun'])
  })

  it('saves no hours when no day is on, whatever times were typed', () => {
    expect(joinHours({ days: [], usual: [['09:00', '17:00']], apart: [] })).toBeNull()
  })

  it('gives every day not set apart the usual hours', () => {
    expect(
      joinHours({
        days: ['mon', 'tue', 'wed', 'thu', 'fri'],
        usual: [['9', '1700']],
        apart: [],
      }),
    ).toEqual(Object.fromEntries(WEEK.slice(0, 5).map((day) => [day, [['09:00', '17:00']]])))
  })

  it('drops a second range left empty, and keeps a half-filled one for the schema to refuse', () => {
    expect(joinHours({ days: ['mon'], usual: [lunch, ['', '']], apart: [] })).toEqual({
      mon: [lunch],
    })
    const half = joinHours({ days: ['mon'], usual: [lunch, ['19:00', '']], apart: [] })
    expect(valid(half)).toBe(false)
  })

  it('ignores hours set apart for a day that is no longer on', () => {
    expect(
      joinHours({ days: ['mon'], usual: [lunch], apart: [{ day: 'tue', ranges: [dinner] }] }),
    ).toEqual({ mon: [lunch] })
  })

  it('writes back exactly what it read, for every shape of week', () => {
    const shapes: HoursRange[][] = [[lunch], [lunch, dinner], [['20:00', '02:00']], [['00:00', '00:00']]]
    // Every assignment of "closed or one of four shapes" to each day would be
    // 5^7; a deterministic walk through a few hundred of them is enough to
    // catch a split that loses or reorders anything.
    for (let seed = 1; seed < 400; seed += 1) {
      const hours: OpeningHours = {}
      WEEK.forEach((day, i) => {
        const pick = (seed * (i + 3) * 7919) % 5
        if (pick < 4) hours[day] = shapes[pick]!
      })
      if (Object.keys(hours).length === 0) continue
      expect(joinHours(splitHours(hours))).toEqual(hours)
    }
  })
})

describe('editing a draft', () => {
  it('turns days on in week order', () => {
    let draft = toggleDay(EMPTY_HOURS_DRAFT, 'fri')
    draft = toggleDay(draft, 'mon')
    expect(draft.days).toEqual(['mon', 'fri'])
  })

  it('discards the hours set apart for a day that is turned off', () => {
    let draft = toggleDay(toggleDay(EMPTY_HOURS_DRAFT, 'mon'), 'sat')
    draft = setDayApart(draft, 'sat')
    draft = toggleDay(draft, 'sat')
    expect(draft.apart).toEqual([])
    expect(toggleDay(draft, 'sat').apart).toEqual([])
  })

  it('sets a day apart starting from the usual hours, and only a day that is on', () => {
    const draft = { days: ['mon', 'tue'] as const, usual: [lunch], apart: [] }
    const apart = setDayApart({ ...draft, days: [...draft.days] }, 'tue')
    expect(apart.apart).toEqual([{ day: 'tue', ranges: [lunch] }])
    expect(apart.apart[0]!.ranges).not.toBe(apart.usual)
    expect(setDayApart({ ...draft, days: [...draft.days] }, 'sun').apart).toEqual([])
    expect(daysNotApart(apart)).toEqual(['mon'])
    expect(rejoinDay(apart, 'tue').apart).toEqual([])
  })
})
