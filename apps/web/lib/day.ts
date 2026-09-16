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
 */

/** `Friday 3 April` — what a day is called while you are looking at it. */
export function formatDay(day: IsoDay): string {
  return dateOfDay(day).toLocaleDateString(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

/** `Fri 3 Apr` — the same day where there is less room for it. */
export function formatDayShort(day: IsoDay): string {
  return dateOfDay(day).toLocaleDateString(undefined, {
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
  return dateOfDay(day).toLocaleDateString(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}
