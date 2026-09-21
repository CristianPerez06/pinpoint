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
    // A place planned for a run belongs on every day of it. This is the one
    // place a marker fans out across days, deliberately: everything downstream
    // — the counts, the ordering, what a day holds — reads the map this builds
    // and needs no knowledge of runs at all.
    for (const day of runOfDays(marker)) {
      const places = days.get(day)
      if (places) places.push(marker)
      else days.set(day, [marker])
    }
  }

  for (const places of days.values()) places.sort(byNameThenId)
  undated.sort(byNameThenId)

  return { days, undated }
}

/**
 * How long a run may be, which is what makes walking one safe.
 *
 * The database refuses a longer one (`markers_planned_run_valid`), so this is
 * the second statement of one bound rather than a guess. It is repeated here
 * because this function must terminate on a row the database never saw — one
 * from a fixture, a test, or a client that reached the data layer directly.
 */
export const MAX_RUN_DAYS = 365

/**
 * Every day a place is planned for: one day, or all the days of its run.
 *
 * **Tolerant on purpose.** A pair that breaks the rules the write path enforces
 * — a last day before the first, or one absurdly far out — is read as the
 * single day `plannedOn`, rather than throwing or producing a list nobody can
 * draw. This is the same stance `markers.ts` takes on a marker's `type`: a
 * value written by an older build, or by something that bypassed validation,
 * must still render. Reads tolerate what writes refuse.
 */
export function runOfDays(marker: {
  readonly plannedOn: IsoDay | null
  readonly plannedUntil: IsoDay | null
}): readonly IsoDay[] {
  const { plannedOn, plannedUntil } = marker
  if (plannedOn == null) return []
  if (plannedUntil == null || plannedUntil <= plannedOn) return [plannedOn]

  const days: IsoDay[] = []
  let day = plannedOn
  while (day <= plannedUntil && days.length <= MAX_RUN_DAYS) {
    days.push(day)
    day = addDays(day, 1)
  }
  // Past the bound the pair says more about a bad write than about a place, so
  // it is read as the one day we are certain of rather than truncated — a run
  // cut off partway would put the place on some of its days and not others,
  // which reads as the calendar losing rows.
  return days.length > MAX_RUN_DAYS ? [plannedOn] : days
}

/** Where a place sits inside its run, for the day being read. */
export interface RunPosition {
  /** Which day of the run this is, counting from 1. */
  readonly index: number
  /** How many days the run holds. */
  readonly total: number
}

/**
 * Which day of how many a place is on, for one day — or null where the place is
 * planned for a single day and there is no run to place it in.
 *
 * Here rather than in either application because both word it from this one
 * answer, so a laptop and a phone cannot come to disagree about how far through
 * a stay somebody is. The wording itself belongs to each application; this
 * package draws nothing.
 */
export function runPositionOf(
  marker: {
    readonly plannedOn: IsoDay | null
    readonly plannedUntil: IsoDay | null
  },
  day: IsoDay,
): RunPosition | null {
  const days = runOfDays(marker)
  if (days.length < 2) return null
  const index = days.indexOf(day)
  return index === -1 ? null : { index: index + 1, total: days.length }
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

/**
 * The days a trip offers to be narrowed by.
 *
 * The days the trip spans, plus every day one of its places carries — sorted,
 * without repeats. Both halves are needed and neither is sufficient: a trip's
 * own dates give the days nothing is planned for yet, which is what makes an
 * empty day visible as an empty day; and the places' own days cover the two
 * cases the schema deliberately permits, a place dated outside the trip's dates
 * and a trip carrying no dates at all.
 *
 * A trip with a start and no end cannot have its span enumerated — there is
 * nothing to stop at, and inventing a length would be guessing at something
 * nobody stated — so such a trip contributes only that one day plus whatever
 * its places carry. `dayToOpenOn` treats a lone end date the same way.
 *
 * **The span is capped.** These dates are typed by hand, so a slipped year gives
 * a trip lasting three centuries, and enumerating it would hang the interface
 * while building a list nobody can read. Past the cap the trip's own span is
 * dropped and only the days its places carry are offered, which is the answer
 * that stays useful: those are the days something is actually planned for.
 */
const MAX_SPANNED_DAYS = 400

export function daysOffered(
  trip: { readonly startsOn: IsoDay | null; readonly endsOn: IsoDay | null },
  markers: readonly {
    readonly plannedOn: IsoDay | null
    readonly plannedUntil: IsoDay | null
  }[],
): readonly IsoDay[] {
  const days = new Set<IsoDay>()

  if (trip.startsOn != null && trip.endsOn != null && trip.startsOn <= trip.endsOn) {
    let day = trip.startsOn
    let guard = 0
    while (day <= trip.endsOn && guard < MAX_SPANNED_DAYS) {
      days.add(day)
      day = addDays(day, 1)
      guard += 1
    }
    // Over the cap the span says more about a typo than about a trip, so it is
    // discarded rather than truncated — a list that stops in the middle of a
    // trip would read as the rest of it being unplannable.
    if (guard >= MAX_SPANNED_DAYS) days.clear()
  } else {
    if (trip.startsOn != null) days.add(trip.startsOn)
    if (trip.endsOn != null) days.add(trip.endsOn)
  }

  // Every day of a run, not only its first — otherwise narrowing the map to
  // the middle of a stay would offer a day the place is on but not draw it.
  for (const marker of markers) {
    for (const day of runOfDays(marker)) days.add(day)
  }

  // `YYYY-MM-DD` sorts chronologically as text, which is the other reason these
  // are strings rather than `Date`s.
  return [...days].sort()
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
  return openingDayFor(todayAsDay(now), trip)
}

/** The rule itself, over a day rather than a clock, so it is stated once. */
function openingDayFor(
  today: IsoDay,
  trip: { startsOn: IsoDay | null; endsOn: IsoDay | null },
): IsoDay {
  if (dayWithin(today, trip.startsOn, trip.endsOn)) return today
  return trip.startsOn ?? today
}

/**
 * The day a screen prepared away from its reader may commit to, or null where
 * only the reader can answer.
 *
 * Some of this product's screens are built in one place and read in another,
 * and the two do not agree about what day it is. Time zones run from UTC−12 to
 * UTC+14, so a reader's calendar day is never more than one day either side of
 * the day where the screen was prepared — but within that, "today" is a
 * different date for several hours of every day.
 *
 * So the rule is asked three times, of yesterday, today and tomorrow. Where all
 * three agree the answer cannot depend on whose clock was used and the screen
 * may be drawn with it. Where they differ, only the reader knows, and this says
 * so by returning null rather than guessing — which is the whole point, because
 * a guess here is a real date, correctly drawn, holding whatever that day holds.
 * Nothing on screen would invite anybody to doubt it.
 *
 * In practice a trip carrying no dates always answers null, a trip being read
 * while it is happening answers null near its own boundaries, and a trip in the
 * future or the past answers its start date — which is most of them, and is why
 * this is worth deciding precisely rather than making every calendar wait.
 */
export function dayToPrepareWith(
  trip: { startsOn: IsoDay | null; endsOn: IsoDay | null },
  now: Date = new Date(),
): IsoDay | null {
  const today = todayAsDay(now)
  const [yesterday, own, tomorrow] = [-1, 0, 1].map((offset) =>
    openingDayFor(addDays(today, offset), trip),
  )
  return own === yesterday && own === tomorrow ? own : null
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

/**
 * What a phone-shaped calendar is showing: the day being read, or the places
 * still waiting for one.
 */
export type CalendarView = 'days' | 'waiting'

/**
 * The view a calendar shows: the one being asked for, or the days.
 *
 * `asked` comes from an address or a route parameter, so anything that is not
 * one of the two views is treated as nothing having been asked — the days are
 * what a fresh arrival sees, and a mistyped link should land somewhere real.
 */
export function calendarViewShown(asked: string | null | undefined): CalendarView {
  return asked === 'waiting' ? 'waiting' : 'days'
}
