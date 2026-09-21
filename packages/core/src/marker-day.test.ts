import { describe, expect, it } from 'vitest'

import {
  addDays,
  calendarViewShown,
  dateOfDay,
  dayShown,
  daysOffered,
  dayToOpenOn,
  dayToPrepareWith,
  dayWithin,
  groupMarkersByDay,
  groupUndatedByCity,
  markersOnDay,
  runOfDays,
  runPositionOf,
  todayAsDay,
} from './marker-day'
import type { City } from './city'
import type { Marker } from './marker'

function marker(over: Partial<Marker> & { id: string }): Marker {
  return {
    tripId: '00000000-0000-4000-8000-000000000001',
    cityId: null,
    name: 'Somewhere',
    note: null,
    lng: 135.7727,
    lat: 34.9671,
    type: 'place',
    link: null,
    price: null,
    plannedOn: null,
    plannedUntil: null,
    visited: false,
    createdAt: '2026-08-02T12:00:00.000Z',
    updatedAt: '2026-08-02T12:00:00.000Z',
    ...over,
  } as Marker
}

describe('groupMarkersByDay', () => {
  it('files each place under the day it is planned for', () => {
    const grouped = groupMarkersByDay([
      marker({ id: 'a', name: 'Fushimi Inari', plannedOn: '2026-04-03' }),
      marker({ id: 'b', name: 'Nishiki', plannedOn: '2026-04-04' }),
    ])

    expect(markersOnDay(grouped, '2026-04-03').map((m) => m.id)).toEqual(['a'])
    expect(markersOnDay(grouped, '2026-04-04').map((m) => m.id)).toEqual(['b'])
  })

  it('holds several places on one day', () => {
    const grouped = groupMarkersByDay([
      marker({ id: 'a', name: 'Kiyomizu', plannedOn: '2026-04-03' }),
      marker({ id: 'b', name: 'Gion', plannedOn: '2026-04-03' }),
    ])

    expect(markersOnDay(grouped, '2026-04-03')).toHaveLength(2)
  })

  it('reports a day nothing is planned for as empty, not as missing', () => {
    const grouped = groupMarkersByDay([
      marker({ id: 'a', plannedOn: '2026-04-03' }),
    ])

    expect(markersOnDay(grouped, '2026-04-09')).toEqual([])
  })

  it('keeps the places with no day apart from the days', () => {
    const grouped = groupMarkersByDay([
      marker({ id: 'a', plannedOn: '2026-04-03' }),
      marker({ id: 'b' }),
      marker({ id: 'c' }),
    ])

    expect(grouped.undated.map((m) => m.id)).toEqual(['b', 'c'])
    expect(grouped.days.size).toBe(1)
  })

  /*
   * A trip's dates are not a boundary, so a place dated outside them has to be
   * grouped like any other — otherwise it exists on a day nothing can reach.
   */
  it('groups a day outside any trip window like any other', () => {
    const grouped = groupMarkersByDay([
      marker({ id: 'a', plannedOn: '2019-01-01' }),
    ])

    expect(markersOnDay(grouped, '2019-01-01').map((m) => m.id)).toEqual(['a'])
  })

  it('takes every place it is given, applying no filter of its own', () => {
    const grouped = groupMarkersByDay([
      marker({ id: 'a', plannedOn: '2026-04-03', visited: true }),
      marker({ id: 'b', plannedOn: '2026-04-03', visited: false }),
    ])

    expect(markersOnDay(grouped, '2026-04-03')).toHaveLength(2)
  })

  it('presents the same day in the same order every time', () => {
    const places = [
      marker({ id: 'c', name: 'Nishiki', plannedOn: '2026-04-03' }),
      marker({ id: 'a', name: 'Gion', plannedOn: '2026-04-03' }),
      marker({ id: 'b', name: 'Gion', plannedOn: '2026-04-03' }),
    ]

    const once = groupMarkersByDay(places)
    const again = groupMarkersByDay([...places].reverse())

    expect(markersOnDay(once, '2026-04-03').map((m) => m.id)).toEqual([
      'a',
      'b',
      'c',
    ])
    expect(markersOnDay(again, '2026-04-03').map((m) => m.id)).toEqual([
      'a',
      'b',
      'c',
    ])
  })

  it('handles a trip with nothing on it', () => {
    const grouped = groupMarkersByDay([])
    expect(grouped.undated).toEqual([])
    expect(grouped.days.size).toBe(0)
  })
})

describe('addDays', () => {
  it('steps forward and back', () => {
    expect(addDays('2026-04-03', 1)).toBe('2026-04-04')
    expect(addDays('2026-04-03', -1)).toBe('2026-04-02')
  })

  it('crosses a month boundary in both directions', () => {
    expect(addDays('2026-04-30', 1)).toBe('2026-05-01')
    expect(addDays('2026-05-01', -1)).toBe('2026-04-30')
  })

  it('crosses a year boundary', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01')
    expect(addDays('2027-01-01', -1)).toBe('2026-12-31')
  })

  it('knows February in a leap year and in an ordinary one', () => {
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29')
    expect(addDays('2026-02-28', 1)).toBe('2026-03-01')
  })

  /*
   * The failure this guards is `new Date('2026-04-03')`, which parses as UTC
   * midnight and formats as the 2nd anywhere west of Greenwich. Stepping by
   * zero has to be the identity in every zone the test machine might be in.
   */
  it('stepping nowhere returns the same day', () => {
    for (const day of ['2026-01-01', '2026-06-15', '2026-12-31']) {
      expect(addDays(day, 0)).toBe(day)
    }
  })

  it('round-trips over a daylight-saving boundary', () => {
    expect(addDays(addDays('2026-03-28', 1), -1)).toBe('2026-03-28')
    expect(addDays(addDays('2026-10-24', 1), -1)).toBe('2026-10-24')
  })
})

describe('dayWithin', () => {
  it('accepts a day inside the trip and the bounds themselves', () => {
    expect(dayWithin('2026-04-03', '2026-04-01', '2026-04-14')).toBe(true)
    expect(dayWithin('2026-04-01', '2026-04-01', '2026-04-14')).toBe(true)
    expect(dayWithin('2026-04-14', '2026-04-01', '2026-04-14')).toBe(true)
  })

  it('rejects a day outside the trip', () => {
    expect(dayWithin('2026-03-31', '2026-04-01', '2026-04-14')).toBe(false)
    expect(dayWithin('2026-04-15', '2026-04-01', '2026-04-14')).toBe(false)
  })

  it('treats an absent bound as not excluding anything', () => {
    expect(dayWithin('2019-01-01', null, '2026-04-14')).toBe(true)
    expect(dayWithin('2099-12-31', '2026-04-01', null)).toBe(true)
    expect(dayWithin('2026-04-03', null, null)).toBe(true)
  })
})

describe('dayToOpenOn', () => {
  const noon = (day: string) => new Date(`${day}T12:00:00`)

  it('opens on today while the trip is happening', () => {
    expect(
      dayToOpenOn(
        { startsOn: '2026-04-01', endsOn: '2026-04-14' },
        noon('2026-04-05'),
      ),
    ).toBe('2026-04-05')
  })

  it('opens on the start date before the trip', () => {
    expect(
      dayToOpenOn(
        { startsOn: '2026-04-01', endsOn: '2026-04-14' },
        noon('2026-01-09'),
      ),
    ).toBe('2026-04-01')
  })

  it('opens on the start date after the trip', () => {
    expect(
      dayToOpenOn(
        { startsOn: '2026-04-01', endsOn: '2026-04-14' },
        noon('2026-09-15'),
      ),
    ).toBe('2026-04-01')
  })

  it('opens on today for a trip carrying no dates', () => {
    expect(dayToOpenOn({ startsOn: null, endsOn: null }, noon('2026-09-15'))).toBe(
      '2026-09-15',
    )
  })

  it('opens on today for a trip carrying only an end date it has not reached', () => {
    expect(
      dayToOpenOn({ startsOn: null, endsOn: '2026-12-31' }, noon('2026-09-15')),
    ).toBe('2026-09-15')
  })

  it('opens on the start date for a trip carrying only one', () => {
    expect(
      dayToOpenOn({ startsOn: '2027-04-01', endsOn: null }, noon('2026-09-15')),
    ).toBe('2027-04-01')
  })
})

describe('dayToPrepareWith', () => {
  const noon = (day: string) => new Date(`${day}T12:00:00`)

  it('commits to a start date the reader cannot disagree about', () => {
    // Weeks before the trip. Yesterday, today and tomorrow all fall outside it,
    // so every candidate reader lands on the same start date.
    expect(
      dayToPrepareWith(
        { startsOn: '2026-10-09', endsOn: '2026-10-26' },
        noon('2026-09-20'),
      ),
    ).toBe('2026-10-09')
  })

  it('refuses a trip carrying no dates', () => {
    // The rule falls through to today, and today is exactly what differs.
    expect(
      dayToPrepareWith({ startsOn: null, endsOn: null }, noon('2026-09-20')),
    ).toBeNull()
  })

  it('refuses while the trip is being lived', () => {
    // Mid-trip the answer is today, so it is the reader's to give.
    expect(
      dayToPrepareWith(
        { startsOn: '2026-10-09', endsOn: '2026-10-26' },
        noon('2026-10-15'),
      ),
    ).toBeNull()
  })

  it('still commits on the eve of a trip, where every reader agrees', () => {
    // A reader a day behind is two days out and gets the start date; this clock
    // is one day out and gets the start date; a reader a day ahead is *on* the
    // start date, so today and the start date are the same answer. All three
    // agree, so declining here would make a calendar wait for nothing.
    expect(
      dayToPrepareWith(
        { startsOn: '2026-10-09', endsOn: '2026-10-26' },
        noon('2026-10-08'),
      ),
    ).toBe('2026-10-09')
  })

  it('refuses on the day the trip is left behind', () => {
    // A reader a day behind is still on the last day and gets that day; this
    // clock is past the end and falls back to the start date. Two different
    // answers, so only the reader can settle it.
    expect(
      dayToPrepareWith(
        { startsOn: '2026-10-09', endsOn: '2026-10-26' },
        noon('2026-10-27'),
      ),
    ).toBeNull()
  })

  it('commits to a start date once the trip is safely past', () => {
    expect(
      dayToPrepareWith(
        { startsOn: '2026-10-09', endsOn: '2026-10-26' },
        noon('2026-12-01'),
      ),
    ).toBe('2026-10-09')
  })

  it('refuses a trip carrying only an end date', () => {
    // No start to fall back to, so the answer is today whichever side of the
    // end date the reader stands.
    expect(
      dayToPrepareWith(
        { startsOn: null, endsOn: '2026-12-31' },
        noon('2026-09-20'),
      ),
    ).toBeNull()
  })

  it('agrees with dayToOpenOn whenever it commits at all', () => {
    // It never answers a different day — it only declines to answer.
    const trips = [
      { startsOn: '2026-10-09', endsOn: '2026-10-26' },
      { startsOn: '2027-04-01', endsOn: null },
      { startsOn: null, endsOn: null },
    ]
    for (const trip of trips) {
      const prepared = dayToPrepareWith(trip, noon('2026-09-20'))
      if (prepared !== null) {
        expect(prepared).toBe(dayToOpenOn(trip, noon('2026-09-20')))
      }
    }
  })
})

describe('whose today the calendar opens on', () => {
  /*
   * The property the web calendar's opening day depends on, pinned here rather
   * than in the component — because it is a fact about the rule, and it is the
   * reason that screen is built the way it is.
   *
   * The screen is prepared in one place and read in another. For a trip with
   * dates the rule returns a fixed string, so the two agree whatever either
   * clock says. For a trip with *no* dates it falls through to today, and the
   * two disagree for several hours of every day for anybody away from where the
   * screen was prepared.
   *
   * That difference is the whole of the fault: the reader was shown the
   * preparer's day, React found the day headings disagreeing and rebuilt the
   * whole calendar, and yesterday's date sat on screen until it did. So the day
   * is settled once where the screen is prepared, and the reader's own clock is
   * read where the screen is read.
   */
  const whereItWasPrepared = new Date('2026-09-20T05:30:00Z')
  const whereItIsRead = new Date('2026-09-19T22:30:00-07:00')

  it('gives two different days for a trip carrying no dates', () => {
    // The same instant, read from two places, on two different calendar days.
    expect(whereItWasPrepared.getTime()).toBe(whereItIsRead.getTime())

    const undated = { startsOn: null, endsOn: null }
    expect(dayToOpenOn(undated, new Date('2026-09-20T12:00:00'))).toBe('2026-09-20')
    expect(dayToOpenOn(undated, new Date('2026-09-19T12:00:00'))).toBe('2026-09-19')
  })

  it('gives one day for a trip carrying dates, whatever the clock says', () => {
    const dated = { startsOn: '2026-10-09', endsOn: '2026-10-26' }
    expect(dayToOpenOn(dated, new Date('2026-09-20T12:00:00'))).toBe('2026-10-09')
    expect(dayToOpenOn(dated, new Date('2026-09-19T12:00:00'))).toBe('2026-10-09')
  })

  it('gives one day whenever a day was asked for, dates or not', () => {
    // A day in the address is a fixed string, so no clock can disagree about
    // it — which is why the reader's own today is only consulted without one.
    const undated = { startsOn: null, endsOn: null }
    expect(dayShown('2026-04-03', undated, new Date('2026-09-20T12:00:00'))).toBe(
      '2026-04-03',
    )
    expect(dayShown('2026-04-03', undated, new Date('2026-09-19T12:00:00'))).toBe(
      '2026-04-03',
    )
  })
})

describe('dayShown', () => {
  const noon = (day: string) => new Date(`${day}T12:00:00`)

  it('shows the day being asked for', () => {
    expect(
      dayShown(
        '2026-04-09',
        { startsOn: '2026-04-01', endsOn: '2026-04-14' },
        noon('2026-04-05'),
      ),
    ).toBe('2026-04-09')
  })

  /*
   * The three below are the trip-change cases, and they are these cases: a
   * change navigates without a day, so `asked` is absent and the opening rule
   * decides afresh. Each states the day the calendar lands on rather than the
   * day that was being read, which is what stops a day travelling between two
   * trips that do not cover the same dates.
   */
  it('lands on the start date when the trip arrived at excludes today', () => {
    expect(
      dayShown(null, { startsOn: '2026-04-01', endsOn: '2026-04-14' }, noon('2026-09-15')),
    ).toBe('2026-04-01')
  })

  it('lands on today when the trip arrived at carries no dates', () => {
    expect(dayShown(null, { startsOn: null, endsOn: null }, noon('2026-09-15'))).toBe(
      '2026-09-15',
    )
  })

  it('lands on today when the trip arrived at is happening', () => {
    expect(
      dayShown(null, { startsOn: '2026-09-01', endsOn: '2026-09-30' }, noon('2026-09-15')),
    ).toBe('2026-09-15')
  })

  /* `undefined` and `null` are one case: a search parameter that is not there. */
  it('treats an absent day and a missing one alike', () => {
    const trip = { startsOn: '2027-04-01', endsOn: null }
    expect(dayShown(undefined, trip, noon('2026-09-15'))).toBe(
      dayShown(null, trip, noon('2026-09-15')),
    )
  })
})

describe('todayAsDay', () => {
  /*
   * The whole point of the column type, asserted on the clock rather than
   * reasoned about. A machine set west of Greenwich in the morning, or east of
   * it late at night, is where `toISOString().slice(0, 10)` returns the wrong
   * day — so the day has to come from the local parts.
   */
  it('reads the day the device is on, not the day it is in UTC', () => {
    const lateEvening = new Date(2026, 3, 3, 23, 30)
    const earlyMorning = new Date(2026, 3, 3, 0, 30)

    expect(todayAsDay(lateEvening)).toBe('2026-04-03')
    expect(todayAsDay(earlyMorning)).toBe('2026-04-03')
  })

  it('pads a single-digit month and day', () => {
    expect(todayAsDay(new Date(2026, 0, 5, 12))).toBe('2026-01-05')
  })
})

describe('dateOfDay', () => {
  /*
   * The whole reason this function exists rather than each caller writing
   * `new Date(day)`: that parses as UTC midnight, so it is the previous day
   * anywhere west of Greenwich and the label under a pin reads a day early.
   */
  it('stands at local midnight on the day it names', () => {
    const date = dateOfDay('2026-04-03')

    expect(date.getFullYear()).toBe(2026)
    expect(date.getMonth()).toBe(3)
    expect(date.getDate()).toBe(3)
    expect(date.getHours()).toBe(0)
  })

  it('round-trips through the day it came from', () => {
    for (const day of ['2026-01-01', '2026-06-15', '2026-12-31', '2028-02-29']) {
      expect(todayAsDay(dateOfDay(day))).toBe(day)
    }
  })
})

describe('groupUndatedByCity', () => {
  function city(id: string, name: string): City {
    return {
      id,
      tripId: '00000000-0000-4000-8000-000000000001',
      name,
      currency: null,
      createdAt: '2026-08-02T12:00:00.000Z',
    }
  }

  const tokyo = city('c-tokyo', 'Tokyo')
  const kyoto = city('c-kyoto', 'Kyoto')

  it('groups by city, ordered by name, with unfiled places last', () => {
    const groups = groupUndatedByCity(
      [
        marker({ id: 'a', name: 'Senso-ji', cityId: tokyo.id }),
        marker({ id: 'b', name: 'Somewhere', cityId: null }),
        marker({ id: 'c', name: 'Ginkaku-ji', cityId: kyoto.id }),
        marker({ id: 'd', name: 'Kiyomizu-dera', cityId: kyoto.id }),
      ],
      [tokyo, kyoto],
    )

    expect(groups.map((group) => group.city?.name ?? null)).toEqual([
      'Kyoto',
      'Tokyo',
      null,
    ])
    expect(groups[0]?.markers.map((each) => each.id)).toEqual(['c', 'd'])
    expect(groups[2]?.markers.map((each) => each.id)).toEqual(['b'])
  })

  it('files a place whose city is no longer listed with the unfiled ones', () => {
    const groups = groupUndatedByCity(
      [marker({ id: 'a', cityId: 'c-removed' })],
      [kyoto],
    )

    expect(groups).toHaveLength(1)
    expect(groups[0]?.city).toBeNull()
  })

  it('keeps the order the places arrived in, within a group', () => {
    const { undated } = groupMarkersByDay([
      marker({ id: 'z', name: 'Nanzen-ji', cityId: kyoto.id }),
      marker({ id: 'y', name: 'Eikan-do', cityId: kyoto.id }),
    ])

    const groups = groupUndatedByCity(undated, [kyoto])
    expect(groups[0]?.markers.map((each) => each.name)).toEqual([
      'Eikan-do',
      'Nanzen-ji',
    ])
  })

  it('answers the same way each time it is asked', () => {
    const undated = [
      marker({ id: 'a', cityId: tokyo.id }),
      marker({ id: 'b', cityId: kyoto.id }),
      marker({ id: 'c' }),
    ]
    const first = groupUndatedByCity(undated, [tokyo, kyoto])
    const second = groupUndatedByCity([...undated], [kyoto, tokyo])
    expect(second).toEqual(first)
  })

  it('has no groups when nothing is waiting', () => {
    expect(groupUndatedByCity([], [kyoto])).toEqual([])
  })
})

describe('calendarViewShown', () => {
  it('shows the places waiting for a day when asked for them', () => {
    expect(calendarViewShown('waiting')).toBe('waiting')
  })

  it('shows the days when asked for them', () => {
    expect(calendarViewShown('days')).toBe('days')
  })

  it('shows the days when nothing is asked', () => {
    expect(calendarViewShown(null)).toBe('days')
    expect(calendarViewShown(undefined)).toBe('days')
  })

  it('shows the days for a value that is neither', () => {
    expect(calendarViewShown('Waiting')).toBe('days')
    expect(calendarViewShown('')).toBe('days')
  })
})

describe('daysOffered', () => {
  // A place on one day. `plannedUntil` is stated rather than left optional:
  // the real shape always carries it, and an optional field here would let a
  // column somebody forgot to map look fine.
  const dated = (day: string | null) => ({ plannedOn: day, plannedUntil: null })
  const run = (from: string, until: string) => ({ plannedOn: from, plannedUntil: until })

  it('offers every day a trip spans, including the ones nothing is planned for', () => {
    // An empty day has to be visible as an empty day. Offering only the days
    // that hold something would make "nothing is planned for Thursday"
    // unaskable, which is one of the questions this filter exists for.
    const days = daysOffered({ startsOn: '2026-03-19', endsOn: '2026-03-22' }, [])

    expect(days).toEqual(['2026-03-19', '2026-03-20', '2026-03-21', '2026-03-22'])
  })

  it('offers the days its places carry when the trip has no dates of its own', () => {
    // The normal case for a long time: places accumulate well before anybody
    // settles what the dates are.
    const days = daysOffered({ startsOn: null, endsOn: null }, [
      dated('2026-03-22'),
      dated('2026-03-19'),
      dated(null),
    ])

    expect(days).toEqual(['2026-03-19', '2026-03-22'])
  })

  it('offers a day outside the trip, which the schema permits', () => {
    const days = daysOffered({ startsOn: '2026-03-19', endsOn: '2026-03-20' }, [
      dated('2026-04-03'),
    ])

    expect(days).toEqual(['2026-03-19', '2026-03-20', '2026-04-03'])
  })

  it('lists each day once however many places share it', () => {
    const days = daysOffered({ startsOn: null, endsOn: null }, [
      dated('2026-03-19'),
      dated('2026-03-19'),
      dated('2026-03-19'),
    ])

    expect(days).toEqual(['2026-03-19'])
  })

  it('returns days in order', () => {
    // `YYYY-MM-DD` sorts chronologically as text, which is the other reason
    // these are strings rather than Dates.
    const days = daysOffered({ startsOn: null, endsOn: null }, [
      dated('2026-04-03'),
      dated('2026-03-19'),
      dated('2026-12-01'),
    ])

    expect(days).toEqual(['2026-03-19', '2026-04-03', '2026-12-01'])
  })

  it('offers nothing for a trip with no dates and no dated places', () => {
    expect(daysOffered({ startsOn: null, endsOn: null }, [dated(null)])).toEqual([])
  })

  it('takes a lone start or end date without inventing a span', () => {
    // Inventing a length from one bound would be guessing at something nobody
    // stated, which is how `dayToOpenOn` treats the same case.
    expect(daysOffered({ startsOn: '2026-03-19', endsOn: null }, [])).toEqual([
      '2026-03-19',
    ])
    expect(daysOffered({ startsOn: null, endsOn: '2026-03-22' }, [])).toEqual([
      '2026-03-22',
    ])
  })

  it('drops an absurd span rather than enumerating it', () => {
    // These dates are typed by hand, so a slipped year gives a trip lasting
    // three centuries. Enumerating it would hang the interface building a list
    // nobody can read; the days something is actually planned for still stand.
    const days = daysOffered({ startsOn: '2026-03-19', endsOn: '2299-03-19' }, [
      dated('2026-03-20'),
    ])

    expect(days).toEqual(['2026-03-20'])
  })

  it('ignores an end date before the start', () => {
    const days = daysOffered({ startsOn: '2026-03-22', endsOn: '2026-03-19' }, [
      dated('2026-03-20'),
    ])

    expect(days).toEqual(['2026-03-19', '2026-03-20', '2026-03-22'])
  })
})

/*
 * A place planned for a run of days.
 *
 * `runOfDays` is the one place a marker fans out across days; everything else
 * — the grouping, the counts, the day filter — reads what it produces. So the
 * tolerance below is load-bearing rather than defensive decoration: a pair the
 * write path would refuse must still render as *something*, because a row
 * written by an older build or reached directly has to draw.
 */
describe('runOfDays', () => {
  it('gives the one day a place planned for a single day is on', () => {
    expect(runOfDays(marker({ id: 'a', plannedOn: '2026-04-03' }))).toEqual([
      '2026-04-03',
    ])
  })

  it('gives nothing for a place waiting for a day', () => {
    expect(runOfDays(marker({ id: 'a' }))).toEqual([])
  })

  it('gives every day of a run, both ends included', () => {
    const hotel = marker({
      id: 'a',
      plannedOn: '2026-04-03',
      plannedUntil: '2026-04-06',
    })
    expect(runOfDays(hotel)).toEqual([
      '2026-04-03',
      '2026-04-04',
      '2026-04-05',
      '2026-04-06',
    ])
  })

  it('walks a run across a month boundary', () => {
    const run = marker({
      id: 'a',
      plannedOn: '2026-04-29',
      plannedUntil: '2026-05-02',
    })
    expect(runOfDays(run)).toEqual([
      '2026-04-29',
      '2026-04-30',
      '2026-05-01',
      '2026-05-02',
    ])
  })

  it('reads a last day before the first as the one day it is sure of', () => {
    const broken = marker({
      id: 'a',
      plannedOn: '2026-04-06',
      plannedUntil: '2026-04-03',
    })
    expect(runOfDays(broken)).toEqual(['2026-04-06'])
  })

  it('reads a run past the bound as the one day it is sure of', () => {
    const slipped = marker({
      id: 'a',
      plannedOn: '2026-04-03',
      plannedUntil: '2126-04-06',
    })
    expect(runOfDays(slipped)).toEqual(['2026-04-03'])
  })
})

describe('runPositionOf', () => {
  const hotel = marker({
    id: 'a',
    plannedOn: '2026-04-03',
    plannedUntil: '2026-04-06',
  })

  it('counts the first day of a run as the first of however many', () => {
    expect(runPositionOf(hotel, '2026-04-03')).toEqual({ index: 1, total: 4 })
  })

  it('counts a day in the middle', () => {
    expect(runPositionOf(hotel, '2026-04-05')).toEqual({ index: 3, total: 4 })
  })

  it('counts the last day', () => {
    expect(runPositionOf(hotel, '2026-04-06')).toEqual({ index: 4, total: 4 })
  })

  /* A place planned for one day has no run to place it in, and says nothing. */
  it('gives nothing for a place planned for a single day', () => {
    expect(runPositionOf(marker({ id: 'a', plannedOn: '2026-04-03' }), '2026-04-03')).toBe(
      null,
    )
  })

  it('gives nothing for a day the run does not cover', () => {
    expect(runPositionOf(hotel, '2026-04-08')).toBe(null)
  })

  it('gives nothing for a place waiting for a day', () => {
    expect(runPositionOf(marker({ id: 'a' }), '2026-04-03')).toBe(null)
  })
})

describe('a run of days on the calendar', () => {
  const hotel = marker({
    id: 'hotel',
    name: 'Hotel Kanra',
    plannedOn: '2026-04-03',
    plannedUntil: '2026-04-06',
  })

  it('puts one place on every day of its run', () => {
    const grouped = groupMarkersByDay([hotel])
    for (const day of ['2026-04-03', '2026-04-04', '2026-04-05', '2026-04-06']) {
      expect(markersOnDay(grouped, day).map((each) => each.id)).toEqual(['hotel'])
    }
  })

  it('does not put it on the day after its run ends', () => {
    const grouped = groupMarkersByDay([hotel])
    expect(markersOnDay(grouped, '2026-04-07')).toEqual([])
  })

  /*
   * The count the calendar is built around. A place with a run has chosen its
   * days like any other, so it is not waiting for one — and if this ever broke,
   * somebody would believe they had finished arranging a trip they had not.
   */
  it('leaves the places waiting for a day untouched', () => {
    const waiting = marker({ id: 'waiting' })
    const grouped = groupMarkersByDay([hotel, waiting])
    expect(grouped.undated.map((each) => each.id)).toEqual(['waiting'])
  })

  it('orders a run among the other places on a day by the same rule', () => {
    const early = marker({ id: 'a', name: 'Arashiyama', plannedOn: '2026-04-04' })
    const late = marker({ id: 'z', name: 'Zoo', plannedOn: '2026-04-04' })
    const grouped = groupMarkersByDay([late, hotel, early])
    expect(markersOnDay(grouped, '2026-04-04').map((each) => each.name)).toEqual([
      'Arashiyama',
      'Hotel Kanra',
      'Zoo',
    ])
  })

  /*
   * Narrowing the map to the middle of a stay has to offer that day, or the
   * filter would offer a day the place is on and then not draw it.
   */
  it('offers every day a run covers for narrowing', () => {
    const days = daysOffered({ startsOn: null, endsOn: null }, [hotel])
    expect(days).toEqual(['2026-04-03', '2026-04-04', '2026-04-05', '2026-04-06'])
  })

  it('offers the days of a run beside those of the trip, without repeats', () => {
    const days = daysOffered({ startsOn: '2026-04-05', endsOn: '2026-04-07' }, [hotel])
    expect(days).toEqual([
      '2026-04-03',
      '2026-04-04',
      '2026-04-05',
      '2026-04-06',
      '2026-04-07',
    ])
  })
})
