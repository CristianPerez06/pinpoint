import { describe, expect, it } from 'vitest'

import {
  addDays,
  calendarViewShown,
  dateOfDay,
  dayShown,
  dayToOpenOn,
  dayWithin,
  groupMarkersByDay,
  groupUndatedByCity,
  markersOnDay,
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
