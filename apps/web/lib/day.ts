import { dateOfDay, type IsoDay } from '@pinpoint/core'

/**
 * How a day is worded on this application.
 *
 * Here rather than in `@pinpoint/core` because wording is drawing, and that
 * package draws nothing — the phone will word a day in its own idiom from the
 * same `YYYY-MM-DD` string. What *is* shared is `dateOfDay`, which is the only
 * sanctioned way to turn one of these strings into a `Date`: `new Date(day)`
 * parses as UTC midnight and reads as the previous day across most of the
 * western hemisphere, which is the drift the `date` column exists to avoid.
 *
 * **The locale is stated, never left to the runtime, and that is load-bearing.**
 * `toLocaleDateString(undefined, …)` means "whatever locale this runtime
 * defaults to" — which is Node's on the server and the browser's in the client.
 * On a machine set to Spanish the server wrote "Thursday, October 8" into the
 * HTML and the browser rendered "jueves, 8 de octubre" over it, React threw out
 * the entire tree as a hydration mismatch, and the calendar was left as dead
 * markup: every button present, correct, and attached to nothing.
 *
 * **Learn the shape of this one.** Nothing was on fire. The page looked right,
 * the dates were right, the controls were drawn — they simply did not respond,
 * which reads as a click handler that was never wired and never is. The only
 * evidence is one console message that names neither this file nor a date.
 *
 * `en-GB` rather than `en-US` because these read as "Thursday 8 October", which
 * is the wording the day columns were designed around. English rather than the
 * reader's language because every other string in this product is English;
 * translating only the dates would be the inconsistency, and translating the
 * product is its own piece of work (#45).
 */
const LOCALE = 'en-GB'

/** `Friday 3 April` — what a day is called while you are looking at it. */
export function formatDay(day: IsoDay): string {
  return dateOfDay(day).toLocaleDateString(LOCALE, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

/** `Fri 3 Apr` — the same day where there is less room for it. */
export function formatDayShort(day: IsoDay): string {
  return dateOfDay(day).toLocaleDateString(LOCALE, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}

/**
 * `Friday 3 April 2026` — a day named in full, for a control that has to say
 * where it leads without being looked at.
 *
 * The year is here and not in `formatDay` on purpose: on screen the year is
 * noise beside a date picker that already shows it, but a screen reader hearing
 * only "next day, Friday 3 April" is being told less than the screen shows.
 */
export function formatDayFull(day: IsoDay): string {
  return dateOfDay(day).toLocaleDateString(LOCALE, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}
