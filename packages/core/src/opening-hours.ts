import { message, type Language, type Message } from '@pinpoint/wording'
import { z } from 'zod'

import { refusal } from './field-errors'

/**
 * The days a place is open, and at what times (#176).
 *
 * Shared rather than one copy per application for the reason `price.ts` gives:
 * the laptop and the phone must say the same thing about the same place.
 *
 * Stored per day, keyed `mon` … `sun`. Only open days are keys: a day that is
 * not a key is closed, and a place with no hours at all is `null` — "nobody has
 * entered them", which is never the same thing as closed. That is why hours
 * with no open day are not a value this schema accepts.
 *
 * Every open day carries one range, and the same one (#190). A second range
 * and different hours on some days were offered once (#176) and never used, so
 * the rule is now one time for the whole week. The per-day shape is kept
 * rather than collapsed to `{ days, open, close }`: it needs no migration, and
 * "is this place open on the day it is planned for" stays a one-key read.
 *
 * Every time is the place's own local time, as written on its door. Nothing
 * here knows about time zones, and nothing should.
 */

/** Monday first. The form's letters, the card's lines and every loop here follow it. */
export const WEEK = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const

export type Weekday = (typeof WEEK)[number]

/**
 * Weekday names, per language — the letters, the abbreviations and the names a
 * screen reader hears.
 *
 * Here rather than in the catalogue for the reason a day's wording is in
 * `day-wording.ts`: these are how a stored value is written, not something the
 * product says, and both applications must write them identically. Written out
 * rather than asked of `Intl`, because the letters are not something `Intl`
 * offers and a row of them drawn from two sources would be two answers.
 *
 * Spanish writes Wednesday's letter as `X`, which is the convention on every
 * Spanish calendar — `M` is already Tuesday, and two `M`s side by side name
 * nothing. Days are lower case, because Spanish does not capitalise them.
 */
export const WEEKDAY_WORDING: Readonly<
  Record<Language, Readonly<Record<Weekday, { letter: string; short: string; name: string }>>>
> = {
  en: {
    mon: { letter: 'M', short: 'Mon', name: 'Monday' },
    tue: { letter: 'T', short: 'Tue', name: 'Tuesday' },
    wed: { letter: 'W', short: 'Wed', name: 'Wednesday' },
    thu: { letter: 'T', short: 'Thu', name: 'Thursday' },
    fri: { letter: 'F', short: 'Fri', name: 'Friday' },
    sat: { letter: 'S', short: 'Sat', name: 'Saturday' },
    sun: { letter: 'S', short: 'Sun', name: 'Sunday' },
  },
  es: {
    mon: { letter: 'L', short: 'lun', name: 'lunes' },
    tue: { letter: 'M', short: 'mar', name: 'martes' },
    wed: { letter: 'X', short: 'mié', name: 'miércoles' },
    thu: { letter: 'J', short: 'jue', name: 'jueves' },
    fri: { letter: 'V', short: 'vie', name: 'viernes' },
    sat: { letter: 'S', short: 'sáb', name: 'sábado' },
    sun: { letter: 'D', short: 'dom', name: 'domingo' },
  },
}

/**
 * What joins the first and last of three or more days in a row, per language:
 * `Mon to Fri`, `lun a vie`.
 *
 * Part of how a list of days is written rather than a sentence, in the way `de`
 * is part of how `3 de abril` is written — so it sits beside the names it joins.
 */
const SPAN_JOIN: Readonly<Record<Language, string>> = {
  en: ' to ',
  es: ' a ',
}

/** `HH:MM` on a 24-hour clock. `24:00` is not a time; an all-day range is `00:00–00:00`. */
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/

/** An opening time and a closing time. */
export type HoursRange = [open: string, close: string]

export type OpeningHours = Partial<Record<Weekday, HoursRange[]>>

/** Closing when it opens means all day. */
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
 * The form enters one range for every open day, so no message names a day:
 * the one range is what the person typed.
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
    // Takes a name, not a sentence — `refusal` is what checks it. Named
    // `refuse` rather than `say` because `say` is what resolves a name into
    // words, which happens in an application and never here.
    const refuse = (message: string) => ctx.addIssue({ code: 'custom', message })

    if (open.length === 0) {
      refuse(refusal('hours.needsADay'))
      return
    }

    if (open.some((day) => hours[day]!.length !== 1)) {
      refuse(refusal('hours.needsOneRange'))
      return
    }

    const [first, ...rest] = open.map((day) => hours[day]![0]!)
    if (rest.some(([o, c]) => o !== first![0] || c !== first![1])) {
      refuse(refusal('hours.rangesDiffer'))
      return
    }

    const [o, c] = first!
    if (o === '' || c === '') {
      refuse(refusal('hours.needsBothTimes'))
    } else if (!TIME.test(o) || !TIME.test(c)) {
      refuse(refusal('hours.timeMalformed'))
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
 * A week as the form edits it: the days turned on, and the one range they share.
 *
 * Times are whatever is in the fields, typed and possibly half-finished — the
 * schema is what decides whether they can be saved, when they are.
 */
export type HoursDraft = {
  days: Weekday[]
  range: HoursRange
}

export const EMPTY_HOURS_DRAFT: HoursDraft = { days: [], range: ['', ''] }

/**
 * Stored hours, as the form opens them. Every open day has the same range, so
 * the first one is the range; `joinHours` undoes this exactly, so a form opened
 * and saved without touching the hours writes back what it read.
 */
export function splitHours(hours: OpeningHours | null): HoursDraft {
  if (hours === null) return EMPTY_HOURS_DRAFT

  const days = WEEK.filter((day) => hours[day] !== undefined)
  const [open, close] = hours[days[0]!]![0]!
  return { days, range: [open, close] }
}

/**
 * What the form would save: null when no day is on, otherwise a week to be
 * validated.
 *
 * Times are normalised where they can be, and left as typed where they cannot,
 * so the schema's refusal is about what the person actually entered.
 */
export function joinHours(draft: HoursDraft): OpeningHours | null {
  if (draft.days.length === 0) return null

  const [o, c] = draft.range
  const open = normaliseTime(o) ?? o.trim()
  const close = normaliseTime(c) ?? c.trim()

  const hours: OpeningHours = {}
  for (const day of WEEK) {
    if (draft.days.includes(day)) hours[day] = [[open, close]]
  }
  return hours
}

/** Turn a day on or off. The range stays as typed either way. */
export function toggleDay(draft: HoursDraft, day: Weekday): HoursDraft {
  const days = draft.days.includes(day)
    ? draft.days.filter((each) => each !== day)
    : [...draft.days, day].sort(byWeek)
  return { ...draft, days }
}

/**
 * The days turned on, in words, for the line under the letters.
 *
 * Two letters repeat, so the row alone cannot say which T was meant. Runs of
 * three or more read as a span; anything shorter is listed.
 */
export function describeDays(language: Language, days: readonly Weekday[]): Message | null {
  if (days.length === 0) return null
  if (days.length === 7) return message('hours.openEveryDay')

  const short = shortIn(language)
  const parts = runsOf(days.slice().sort(byWeek)).flatMap((run) =>
    run.length >= 3
      ? [`${short(run[0]!)}${SPAN_JOIN[language]}${short(run[run.length - 1]!)}`]
      : run.map(short),
  )
  return message('hours.openOn', { days: parts.join(', ') })
}

/** What the form says under a finished range, or null when there is nothing to say. */
export function rangeHint([open, close]: HoursRange): Message | null {
  const o = normaliseTime(open)
  const c = normaliseTime(close)
  if (o === null || c === null) return null
  if (o === c) return message('hours.openAllDay')
  if (c < o) return message('hours.closesNextDay', { time: c })
  return null
}

// ─── the card ────────────────────────────────────────────────────────────────

export type HoursLine = {
  /** `Mon, Wed, Fri`, `Tue–Sat`, `Every day`, or `Closed`. */
  days: Message
  /** `09:00–17:00`, `24 hours`, or the closed days. */
  text: Message
  /** The last line, listing the days the place is closed; drawn as secondary. */
  closed: boolean
}

/**
 * Hours as both cards show them: the open days on one line with their range,
 * then the closed days on a last line of their own.
 *
 * Every open day has the same range, so the days share a line whether or not
 * they are neighbours (#190). Neighbours read as a span, the rest are listed,
 * and all seven read `Every day`. Listing the closed days makes a closed day
 * something the card says rather than a gap the reader has to notice.
 */
export function describeHours(language: Language, hours: OpeningHours): HoursLine[] {
  const open = WEEK.filter((day) => hours[day] !== undefined)
  const closed = WEEK.filter((day) => hours[day] === undefined)
  const short = shortIn(language)

  const days =
    open.length === 7
      ? message('hours.everyDay')
      : message('hours.days', {
          days: runsOf(open)
            .map((run) =>
              run.length === 1
                ? short(run[0]!)
                : `${short(run[0]!)}–${short(run[run.length - 1]!)}`,
            )
            .join(', '),
        })

  const lines: HoursLine[] = [
    { days, text: rangeText(hours[open[0]!]![0]!), closed: false },
  ]

  if (closed.length > 0) {
    lines.push({
      days: message('hours.closed'),
      text: message('hours.days', { days: closed.map(short).join(', ') }),
      closed: true,
    })
  }

  return lines
}

function rangeText(range: HoursRange): Message {
  return isAllDay(range)
    ? message('hours.allDay')
    : message('hours.between', { open: range[0], close: range[1] })
}

function shortIn(language: Language): (day: Weekday) => string {
  return (day) => WEEKDAY_WORDING[language][day].short
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
