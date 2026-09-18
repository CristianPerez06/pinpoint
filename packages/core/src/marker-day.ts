import type { City } from './city'
import type { Marker } from './marker'

/**
 * Arranging a trip's places by the day they are planned for.
 *
 * Here rather than in either application for the same reason `marker-filter`
 * is: this is a fact about markers and days, not about drawing. Both platforms
 * need the identical answer, and two implementations of "what is on Thursday"
 * would eventually disagree — which would surface as a place appearing on a
 * laptop and missing on a phone, and would read as a data problem.
 *
 * Not in `@pinpoint/map`: none of this is map behaviour, and a day list draws
 * no map.
 *
 * **Every day in this file is a `YYYY-MM-DD` string and never a `Date`.** A
 * `Date` is an instant, and an instant is a different calendar day depending on
 * where it is read — so the drift this exists to avoid gets reintroduced by any
 * code that parses one of these strings and reads it back. `new Date('2026-04-03')`
 * in particular parses as UTC midnight and prints as the 2nd anywhere west of
 * Greenwich, which is the exact failure the `date` column was chosen to prevent.
 */

/** A calendar day, `YYYY-MM-DD`. The shape `z.iso.date()` accepts. */
export type IsoDay = string

export interface MarkersByDay {
  /**
   * Places whose day has not been decided.
   *
   * Deliberately separate from the days rather than filed under a null key.
   * These are the pile somebody is working through, they are asked for as a
   * group, and a key that can be absent is a key somebody eventually iterates
   * over by accident.
   */
  readonly undated: readonly Marker[]
  /** Places keyed by the day they are planned for. Days with none are absent. */
  readonly days: ReadonlyMap<IsoDay, readonly Marker[]>
}

/**
 * The order places are listed in within one day.
 *
 * By name, so a person can find one by reading; by id where two places share a
 * name, so the order is fully determined and the same day never comes back
 * arranged differently. A day is a set rather than a sequence — nothing here
 * expresses what to do first — but "a set" is not a licence to reorder under
 * somebody mid-read.
 */
function byNameThenId(a: Marker, b: Marker): number {
  const byName = a.name.localeCompare(b.name)
  return byName !== 0 ? byName : a.id.localeCompare(b.id)
}

/**
 * Split a trip's places into the days they are planned for and the ones still
 * waiting for a day.
 *
 * Takes every marker it is given and applies no filter. That is the whole
 * contract: the calendar shows a trip entire, because a day presented as
 * emptier than it is, or a waiting pile counted short, is worse than no
 * calendar — somebody would believe they had finished arranging a trip they
 * had not.
 */
export function groupMarkersByDay(markers: readonly Marker[]): MarkersByDay {
  const days = new Map<IsoDay, Marker[]>()
  const undated: Marker[] = []

  for (const marker of markers) {
    if (marker.plannedOn == null) {
      undated.push(marker)
      continue
    }
    const day = days.get(marker.plannedOn)
    if (day) day.push(marker)
    else days.set(marker.plannedOn, [marker])
  }

  for (const places of days.values()) places.sort(byNameThenId)
  undated.sort(byNameThenId)

  return { days, undated }
}

/** One city's share of the places waiting for a day. */
export interface WaitingGroup {
  /** Null for the places filed under no city — or under one no longer listed. */
  readonly city: City | null
  readonly markers: readonly Marker[]
}

/**
 * The places waiting for a day, one group per city.
 *
 * Groups are ordered by the city's name, and the places filed under no city
 * come last in one group of their own. A place naming a city that is not in
 * `cities` — removed by somebody else, and not yet re-read — joins that last
 * group rather than a group with no name to show.
 *
 * Places keep the order they were given in, so passing `undated` from
 * `groupMarkersByDay` keeps its name-then-id order inside every group.
 *
 * Here rather than in either application because the specification fixes the
 * order, and two applications each sorting their own way is how a laptop and a
 * phone come to list the same trip differently.
 */
export function groupUndatedByCity(
  undated: readonly Marker[],
  cities: readonly City[],
): readonly WaitingGroup[] {
  const byId = new Map(cities.map((city) => [city.id, city]))
  const filed = new Map<string, { city: City; markers: Marker[] }>()
  const unfiled: Marker[] = []

  for (const marker of undated) {
    const city = marker.cityId == null ? undefined : byId.get(marker.cityId)
    if (!city) {
      unfiled.push(marker)
      continue
    }
    const group = filed.get(city.id)
    if (group) group.markers.push(marker)
    else filed.set(city.id, { city, markers: [marker] })
  }

  const groups: WaitingGroup[] = [...filed.values()].sort((a, b) => {
    const byName = a.city.name.localeCompare(b.city.name)
    return byName !== 0 ? byName : a.city.id.localeCompare(b.city.id)
  })
  if (unfiled.length > 0) groups.push({ city: null, markers: unfiled })
  return groups
}

/** What is on one day. An empty day is an ordinary day, not a missing one. */
export function markersOnDay(
  grouped: MarkersByDay,
  day: IsoDay,
): readonly Marker[] {
  return grouped.days.get(day) ?? []
}

/**
 * Today, as a calendar day, where the reader is standing.
 *
 * Deliberately the device's own today rather than the server's. Somebody in
 * Kyōto opening this at nine in the morning means the day it is there, and a
 * date computed in UTC would hand them yesterday for most of their waking day.
 *
 * Takes a clock so it can be tested without moving the machine's.
 */
export function todayAsDay(now: Date = new Date()): IsoDay {
  return dayOfDate(now)
}

/**
 * Format a `Date` as the calendar day it falls on **in local time**.
 *
 * `toISOString().slice(0, 10)` is the obvious version of this and is wrong: it
 * converts to UTC first, so it returns tomorrow for anyone east of Greenwich in
 * the evening and yesterday for anyone west of it in the morning.
 *
 * Exported because a date control hands back a `Date` and the day it means is
 * the local one. Doing that conversion at the call site is how the drift this
 * module exists to prevent gets reintroduced at the one point where a person
 * has just said which day they meant.
 */
export function dayOfDate(date: Date): IsoDay {
  const year = String(date.getFullYear()).padStart(4, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Step a day forward or back.
 *
 * Goes through the local-time `Date` constructor — which takes the parts and
 * never parses a string — so it inherits none of the zone behaviour of
 * `new Date('2026-04-03')`. Month and day overflow is what does the arithmetic:
 * the 31st of April is normalised to the 1st of May, and day zero is the last
 * of the previous month, which is also what makes this correct across a
 * daylight-saving boundary where a day is not twenty-four hours long.
 */
export function addDays(day: IsoDay, delta: number): IsoDay {
  const [year, month, date] = day.split('-').map(Number)
  return dayOfDate(new Date(year, month - 1, date + delta))
}

/**
 * A day as a `Date` standing at local midnight on it.
 *
 * The only sanctioned way to turn one of these strings into a `Date`, and it
 * exists so that nothing else is tempted to. `new Date('2026-04-03')` parses as
 * UTC midnight and is therefore the 2nd for most of the western hemisphere,
 * which is the drift the `date` column was chosen to avoid — reintroduced at
 * the last step, by the code that draws the label.
 *
 * Returns a `Date` rather than a formatted string because how a day is worded
 * is each application's own business, and this package draws nothing.
 */
export function dateOfDay(day: IsoDay): Date {
  const [year, month, date] = day.split('-').map(Number)
  return new Date(year, month - 1, date)
}

/** Whether a day falls within a trip's dates. An absent bound does not exclude. */
export function dayWithin(
  day: IsoDay,
  startsOn: IsoDay | null,
  endsOn: IsoDay | null,
): boolean {
  if (startsOn != null && day < startsOn) return false
  if (endsOn != null && day > endsOn) return false
  return true
}

/**
 * The day a trip's calendar should open on.
 *
 * Today where the trip is happening around now, its start date otherwise, and
 * today for a trip carrying no dates at all — which is most trips, since the
 * places accumulate long before the dates are settled.
 *
 * Note that a trip carrying only an end date opens on today: there is no start
 * to fall back to, and inventing one from the end date would be guessing at a
 * length nobody stated.
 */
export function dayToOpenOn(
  trip: { startsOn: IsoDay | null; endsOn: IsoDay | null },
  now: Date = new Date(),
): IsoDay {
  const today = todayAsDay(now)
  if (dayWithin(today, trip.startsOn, trip.endsOn)) return today
  return trip.startsOn ?? today
}

/**
 * The day a calendar shows: the one being asked for, or the one this trip opens
 * on when nothing is.
 *
 * One rule rather than two, and that is the whole reason it is a function.
 * Arriving fresh and changing trip are the same event — changing trip *is*
 * arriving at that trip — so a second rule written for switching is a rule that
 * can drift from the first. This is the one both go through, and `asked` is
 * absent in exactly the cases where the trip has just changed.
 *
 * The failure it is written against looks like a working screen. Carrying a day
 * from one trip to another lands outside the trip arrived at nearly every time,
 * because two trips rarely cover the same dates — so the calendar opens on a day
 * holding nothing and reads as a trip with nothing planned rather than as the
 * wrong day. Nothing is on screen to say which.
 */
export function dayShown(
  asked: string | null | undefined,
  trip: { startsOn: IsoDay | null; endsOn: IsoDay | null },
  now: Date = new Date(),
): IsoDay {
  return asked ?? dayToOpenOn(trip, now)
}
