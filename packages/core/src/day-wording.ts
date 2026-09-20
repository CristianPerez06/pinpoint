import { dateOfDay, type IsoDay } from './marker-day'

/**
 * How a calendar day is worded.
 *
 * WHY THIS IS SHARED RATHER THAN ONE COPY PER APPLICATION
 *
 * It lived in `apps/web/lib/day.ts`, which argued that wording is drawing and
 * that the phone would word a day in its own idiom. The phone wants these exact
 * three strings, so that was a prediction rather than a rule. `price.ts` in this
 * same package had already settled the question for the same kind of value: both
 * applications must produce the same string from the same stored value, because
 * one that reads differently on the laptop and the phone is a bug somebody spends
 * an evening on. A day is a value, not a drawing — where it is *placed* is each
 * application's business, and none of that is here.
 *
 * **THE LOCALE IS STATED, NEVER LEFT TO THE RUNTIME, AND THAT IS LOAD-BEARING.**
 *
 * `toLocaleDateString(undefined, …)` means "whatever locale this runtime defaults
 * to" — Node's on a server, the browser's in a client, the device's on a phone. On
 * a machine set to Spanish the web server wrote "Thursday, October 8" into the
 * HTML and the browser rendered "jueves, 8 de octubre" over it, React threw out
 * the entire tree as a hydration mismatch, and the calendar was left as dead
 * markup: every button present, correct, and attached to nothing.
 *
 * **Learn the shape of that one.** Nothing was on fire. The page looked right,
 * the dates were right, the controls were drawn — they simply did not respond,
 * which reads as a click handler that was never wired and never is. The only
 * evidence is one console message that names neither dates nor this file.
 *
 * `en-GB` rather than `en-US` because these read as "Thursday 8 October", which
 * is the wording the day columns were designed around. English rather than the
 * reader's language because every other string in this product is English;
 * translating only the dates would be the inconsistency, and translating the
 * product is its own piece of work (#45). When that happens this becomes an
 * argument threaded from wherever the language is decided, not a second question
 * asked of the device — the same note `price.ts` carries about `PRICE_LOCALE`.
 *
 * WHY EVERY FORMAT FALLS BACK
 *
 * `price.ts` records that the data behind `Intl` is thinner on a React Native
 * runtime than in a browser, and it falls back rather than throwing, because a
 * formatter that throws while rendering takes the whole surface with it. These do
 * the same, returning the `YYYY-MM-DD` string — which is not the wording anybody
 * wants, and is still a day somebody can read.
 */
const LOCALE = 'en-GB'

/** `Friday 3 April` — what a day is called while you are looking at it. */
export function formatDay(day: IsoDay): string {
  return worded(day, { weekday: 'long', day: 'numeric', month: 'long' })
}

/** `Fri 3 Apr` — the same day where there is less room for it. */
export function formatDayShort(day: IsoDay): string {
  return worded(day, { weekday: 'short', day: 'numeric', month: 'short' })
}

/**
 * `3 Apr` — a day with no weekday on it.
 *
 * For a heading that names a *range* of days rather than one of them, where the
 * weekday is noise: the days it spans are listed underneath with their own
 * weekdays, and repeating one of them in the heading says nothing.
 */
export function formatDayCompact(day: IsoDay): string {
  return worded(day, { day: 'numeric', month: 'short' })
}

/**
 * `Friday 3 April 2026` — a day named in full, for a control that has to say
 * where it leads without being looked at.
 *
 * The year is here and not in `formatDay` on purpose: on screen the year is
 * noise beside a date control that already shows it, but a screen reader hearing
 * only "next day, Friday 3 April" is being told less than the screen shows.
 */
export function formatDayFull(day: IsoDay): string {
  return worded(day, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

/**
 * `03/04/2026` — a day as a date field shows it.
 *
 * What the laptop's date input reads, so the phone's field reads the same. Built
 * from the stored string rather than through `Intl`: the digits are already
 * there, and a numeric date has nothing a locale could word differently except
 * the order — which is the one thing this pins.
 */
export function formatDayNumeric(day: IsoDay): string {
  const [year, month, date] = day.split('-')
  return `${date}/${month}/${year}`
}

/**
 * One day, worded, or the day itself if this runtime cannot word it.
 *
 * `dateOfDay` rather than `new Date(day)`: that parses as UTC midnight and reads
 * as the previous day across most of the western hemisphere, which is the drift
 * the `date` column exists to avoid — reintroduced at the last step, by the code
 * that draws the label.
 */
function worded(day: IsoDay, format: Intl.DateTimeFormatOptions): string {
  try {
    return dateOfDay(day).toLocaleDateString(LOCALE, format)
  } catch {
    return day
  }
}
