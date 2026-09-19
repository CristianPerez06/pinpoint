import { z } from 'zod'

/**
 * The days a place is open, and at what times (#176).
 *
 * Shared rather than one copy per application for the reason `price.ts` gives:
 * the laptop and the phone must say the same thing about the same place, and
 * the form on each must turn the same stored week into the same "usual hours"
 * — otherwise saving an untouched place on one application would rewrite what
 * the other one saved.
 *
 * Stored per day, keyed `mon` … `sun`. Only open days are keys: a day that is
 * not a key is closed, and a place with no hours at all is `null` — "nobody has
 * entered them", which is never the same thing as closed. That is why hours
 * with no open day are not a value this schema accepts.
 *
 * Every time is the place's own local time, as written on its door. Nothing
 * here knows about time zones, and nothing should.
 */

/** Monday first. The form's letters, the card's lines and every loop here follow it. */
export const WEEK = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const

export type Weekday = (typeof WEEK)[number]

/**
 * Names, in the interface's language.
 *
 * English because the interface is English, as `PRICE_LOCALE` is. When the
 * interface is translated (#45) these become the catalogue's, and this is the
 * one place to change — the letters, the abbreviations and the names a screen
 * reader hears all come from here.
 */
export const WEEKDAY_WORDING: Record<
  Weekday,
  { letter: string; short: string; name: string }
> = {
  mon: { letter: 'M', short: 'Mon', name: 'Monday' },
  tue: { letter: 'T', short: 'Tue', name: 'Tuesday' },
  wed: { letter: 'W', short: 'Wed', name: 'Wednesday' },
  thu: { letter: 'T', short: 'Thu', name: 'Thursday' },
  fri: { letter: 'F', short: 'Fri', name: 'Friday' },
  sat: { letter: 'S', short: 'Sat', name: 'Saturday' },
  sun: { letter: 'S', short: 'Sun', name: 'Sunday' },
}

/** `HH:MM` on a 24-hour clock. `24:00` is not a time; an all-day range is `00:00–00:00`. */
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/

/** An opening time and a closing time. */
export type HoursRange = [open: string, close: string]

export type OpeningHours = Partial<Record<Weekday, HoursRange[]>>

/**
 * Closing before opening means the next morning; closing when it opens means
 * all day. Comparing the strings is comparing the times, because both are
 * zero-padded to the same width.
 */
function crossesMidnight([open, close]: HoursRange): boolean {
  return close < open
}

function isAllDay([open, close]: HoursRange): boolean {
  return open === close
}

const rangeSchema = z.tuple([z.string(), z.string()])

/**
 * The one statement of what a week of hours may be.
 *
 * The database checks only that it is a non-empty object; everything about the
 * ranges is here, because both applications and the data layer validate
 * through this before writing, and a second copy in SQL would be a copy to
 * keep in step.
 *
 * Every message names the day it is about, since the form shows one message
 * for the whole hours field.
 */
export const openingHoursSchema = z
  .object({
    mon: z.array(rangeSchema).optional(),
    tue: z.array(rangeSchema).optional(),
    wed: z.array(rangeSchema).optional(),
    thu: z.array(rangeSchema).optional(),
    fri: z.array(rangeSchema).optional(),
    sat: z.array(rangeSchema).optional(),
    sun: z.array(rangeSchema).optional(),
  })
  .strict()
  .superRefine((hours, ctx) => {
    const open = WEEK.filter((day) => hours[day] !== undefined)

    if (open.length === 0) {
      ctx.addIssue({ code: 'custom', message: 'Pick at least one day it opens.' })
      return
    }

    for (const day of open) {
      const ranges = hours[day]!
      const name = WEEKDAY_WORDING[day].name
      const say = (message: string) =>
        ctx.addIssue({ code: 'custom', path: [day], message })

      if (ranges.length === 0 || ranges.length > 2) {
        say(`${name} needs one or two sets of hours.`)
        continue
      }

      if (ranges.some(([o, c]) => o === '' || c === '')) {
        say(`Enter both times for ${name}.`)
        continue
      }

      if (ranges.some(([o, c]) => !TIME.test(o) || !TIME.test(c))) {
        say(`Write ${name}'s times like 09:00.`)
        continue
      }

      if (ranges.length === 2) {
        const [first, second] = ranges as [HoursRange, HoursRange]
        if (isAllDay(first) || isAllDay(second)) {
          say(`${name} is open all day, so it needs only one set of hours.`)
        } else if (crossesMidnight(first)) {
          say(`On ${name}, only the second set of hours can run past midnight.`)
        } else if (second[0] <= first[1]) {
          say(`On ${name}, the second set of hours must start after the first ends.`)
        }
      }
    }
  })

/**
 * Hours as stored, or null for anything that is not a valid week.
 *
 * For reading. The column is checked only for shape, so a value written by
 * something that skipped the schema must not take a whole trip's read down
 * with it — it reads as hours nobody has entered.
 */
export function openingHoursOf(value: unknown): OpeningHours | null {
  if (value === null || value === undefined) return null
  const parsed = openingHoursSchema.safeParse(value)
  return parsed.success ? parsed.data : null
}

/**
 * A time as somebody typed it, written the way it is stored — or null.
 *
 * `9` → `09:00`, `930` → `09:30`, `0930` → `09:30`, `9:30` → `09:30`. Typed
 * rather than picked, on both applications: the browser's own time box follows
 * the computer's region and turns `21:00` into `9:00 PM`, and a picker on the
 * phone would raise a panel over a form that is already a sheet.
 */
export function normaliseTime(input: string): string | null {
  const trimmed = input.trim()
  const parts = trimmed.split(/[:.h]/)

  let hours: string
  let minutes: string

  if (parts.length === 2) {
    ;[hours, minutes] = parts as [string, string]
    if (minutes.length !== 2) return null
  } else if (parts.length === 1 && /^\d{1,4}$/.test(trimmed)) {
    if (trimmed.length <= 2) {
      hours = trimmed
      minutes = '00'
    } else {
      hours = trimmed.slice(0, -2)
      minutes = trimmed.slice(-2)
    }
  } else {
    return null
  }

  if (!/^\d{1,2}$/.test(hours) || !/^\d{2}$/.test(minutes)) return null

  const time = `${hours.padStart(2, '0')}:${minutes}`
  return TIME.test(time) ? time : null
}

// ─── the form ────────────────────────────────────────────────────────────────

/**
 * A week as the form edits it: the days turned on, the usual hours, and the
 * days set apart with hours of their own.
 *
 * Times are whatever is in the fields, typed and possibly half-finished — the
 * schema is what decides whether they can be saved, when they are.
 */
export type HoursDraft = {
  days: Weekday[]
  usual: HoursRange[]
  apart: { day: Weekday; ranges: HoursRange[] }[]
}

export const EMPTY_HOURS_DRAFT: HoursDraft = { days: [], usual: [['', '']], apart: [] }

/**
 * Stored hours, as the form opens them.
 *
 * The usual hours are whichever hours the most open days share. Where two
 * sets are shared by equally many days, the one that appears first in the week
 * wins. Every other open day is set apart. `joinHours` undoes this exactly, so a
 * form opened and saved without touching the hours writes back what it read.
 */
export function splitHours(hours: OpeningHours | null): HoursDraft {
  if (hours === null) return EMPTY_HOURS_DRAFT

  const days = WEEK.filter((day) => hours[day] !== undefined)
  const counts = new Map<string, number>()
  for (const day of days) {
    const key = JSON.stringify(hours[day])
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }

  // Maps iterate in insertion order, which is week order, so a strict `>` is
  // what gives the tie to the earliest day.
  let usualKey = ''
  let most = 0
  for (const [key, count] of counts) {
    if (count > most) {
      usualKey = key
      most = count
    }
  }

  return {
    days,
    usual: JSON.parse(usualKey) as HoursRange[],
    apart: days
      .filter((day) => JSON.stringify(hours[day]) !== usualKey)
      .map((day) => ({ day, ranges: hours[day]! })),
  }
}

/**
 * What the form would save: null when no day is on, otherwise a week to be
 * validated.
 *
 * Times are normalised where they can be, and left as typed where they cannot,
 * so the schema's refusal is about what the person actually entered. A second
 * range left completely empty is dropped rather than refused — it was added and
 * never used, which is not a mistake worth stopping a save for.
 */
export function joinHours(draft: HoursDraft): OpeningHours | null {
  if (draft.days.length === 0) return null

  const tidy = (ranges: HoursRange[]): HoursRange[] =>
    ranges
      .filter(([o, c], index) => index === 0 || o.trim() !== '' || c.trim() !== '')
      .map(([o, c]) => [normaliseTime(o) ?? o.trim(), normaliseTime(c) ?? c.trim()])

  const hours: OpeningHours = {}
  for (const day of WEEK) {
    if (!draft.days.includes(day)) continue
    const apart = draft.apart.find((entry) => entry.day === day)
    hours[day] = tidy(apart ? apart.ranges : draft.usual)
  }
  return hours
}

/**
 * Turn a day on or off.
 *
 * Turning a day off also drops any hours set apart for it: a day that is not
 * open has no hours of its own to keep, and bringing it back should bring it
 * back on the usual hours rather than on something typed and then hidden.
 */
export function toggleDay(draft: HoursDraft, day: Weekday): HoursDraft {
  if (draft.days.includes(day)) {
    return {
      ...draft,
      days: draft.days.filter((each) => each !== day),
      apart: draft.apart.filter((entry) => entry.day !== day),
    }
  }
  return { ...draft, days: [...draft.days, day].sort(byWeek) }
}

/** Set a day apart, starting from a copy of the usual hours. */
export function setDayApart(draft: HoursDraft, day: Weekday): HoursDraft {
  if (!draft.days.includes(day) || draft.apart.some((entry) => entry.day === day)) {
    return draft
  }
  const apart = [...draft.apart, { day, ranges: draft.usual.map(([o, c]): HoursRange => [o, c]) }]
  return { ...draft, apart: apart.sort((a, b) => byWeek(a.day, b.day)) }
}

/** Return a day set apart to the usual hours. */
export function rejoinDay(draft: HoursDraft, day: Weekday): HoursDraft {
  return { ...draft, apart: draft.apart.filter((entry) => entry.day !== day) }
}

/** Open days that could still be set apart, in week order. */
export function daysNotApart(draft: HoursDraft): Weekday[] {
  return draft.days.filter((day) => !draft.apart.some((entry) => entry.day === day))
}

/**
 * The days turned on, in words, for the line under the letters.
 *
 * Two letters repeat, so the row alone cannot say which T was meant. Runs of
 * three or more read as a span; anything shorter is listed.
 */
export function describeDays(days: readonly Weekday[]): string | null {
  if (days.length === 0) return null
  if (days.length === 7) return 'Open every day'

  const parts = runsOf(days.slice().sort(byWeek)).flatMap((run) =>
    run.length >= 3
      ? [`${short(run[0]!)} to ${short(run[run.length - 1]!)}`]
      : run.map(short),
  )
  return `Open ${parts.join(', ')}`
}

/** What the form says under a finished range, or null when there is nothing to say. */
export function rangeHint([open, close]: HoursRange): string | null {
  const o = normaliseTime(open)
  const c = normaliseTime(close)
  if (o === null || c === null) return null
  if (o === c) return 'Open all day'
  if (c < o) return `Closes ${c} the next day`
  return null
}

// ─── the card ────────────────────────────────────────────────────────────────

export type HoursLine = {
  /** `Tue–Thu`, `Fri`, `Every day`, or `Closed`. */
  days: string
  /** `12:00–15:00, 19:00–23:00`, `24 hours`, or the closed days. */
  text: string
  /** The last line, listing the days the place is closed; drawn as secondary. */
  closed: boolean
}

/**
 * Hours as both cards show them.
 *
 * Monday first. Neighbouring days with identical hours share a line; all seven
 * identical read `Every day`. The closed days share one last line, so a closed
 * day is something the card says rather than a gap the reader has to notice.
 * Never more than seven lines.
 */
export function describeHours(hours: OpeningHours): HoursLine[] {
  const open = WEEK.filter((day) => hours[day] !== undefined)
  const closed = WEEK.filter((day) => hours[day] === undefined)
  const same = (a: Weekday, b: Weekday) =>
    JSON.stringify(hours[a]) === JSON.stringify(hours[b])

  const lines: HoursLine[] = []

  if (open.length === 7 && open.every((day) => same(day, 'mon'))) {
    lines.push({ days: 'Every day', text: rangesText(hours.mon!), closed: false })
    return lines
  }

  let start = 0
  while (start < WEEK.length) {
    const day = WEEK[start]!
    if (hours[day] === undefined) {
      start += 1
      continue
    }
    let end = start
    while (
      end + 1 < WEEK.length &&
      hours[WEEK[end + 1]!] !== undefined &&
      same(day, WEEK[end + 1]!)
    ) {
      end += 1
    }
    lines.push({
      days: end === start ? short(day) : `${short(day)}–${short(WEEK[end]!)}`,
      text: rangesText(hours[day]!),
      closed: false,
    })
    start = end + 1
  }

  if (closed.length > 0) {
    lines.push({ days: 'Closed', text: closed.map(short).join(', '), closed: true })
  }

  return lines
}

function rangesText(ranges: HoursRange[]): string {
  return ranges.map((range) => (isAllDay(range) ? '24 hours' : `${range[0]}–${range[1]}`)).join(', ')
}

function short(day: Weekday): string {
  return WEEKDAY_WORDING[day].short
}

function byWeek(a: Weekday, b: Weekday): number {
  return WEEK.indexOf(a) - WEEK.indexOf(b)
}

/** Consecutive days, grouped: `[mon, tue, thu]` → `[[mon, tue], [thu]]`. */
function runsOf(days: Weekday[]): Weekday[][] {
  const runs: Weekday[][] = []
  for (const day of days) {
    const run = runs[runs.length - 1]
    if (run && WEEK.indexOf(day) === WEEK.indexOf(run[run.length - 1]!) + 1) run.push(day)
    else runs.push([day])
  }
  return runs
}
