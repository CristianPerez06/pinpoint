import { message, type Language, type Message } from '@pinpoint/wording'

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
 * is the wording the day columns were designed around. `es-ES` because it is the
 * Spanish whose forms the specification writes out — `viernes, 3 de abril`,
 * `vie, 3 abr` — and a stated locale per language is what keeps a laptop and a
 * phone reading Spanish agreeing with each other. **The language is an
 * argument, never a question asked of the device**: the device is consulted once,
 * for the first launch, by whoever decides the language, and not here.
 *
 * The two languages differ in more than their words. Spanish writes a comma
 * after the weekday (`viernes, 3 de abril`) where English writes none, puts `de`
 * before a month and before a year, and writes weekdays and months in lower
 * case. None of that is substituted in here; it is what each stated locale
 * answers, and `day-wording.test.ts` writes every form out in both languages so a
 * reviewer can tell a wording decision from a runtime's default.
 *
 * WHY EVERY FORMAT FALLS BACK
 *
 * `price.ts` records that the data behind `Intl` is thinner on a React Native
 * runtime than in a browser, and it falls back rather than throwing, because a
 * formatter that throws while rendering takes the whole surface with it. These do
 * the same, returning the `YYYY-MM-DD` string — which is not the wording anybody
 * wants, and is still a day somebody can read.
 */
const LOCALE: Readonly<Record<Language, string>> = {
  en: 'en-GB',
  es: 'es-ES',
}

/** `Friday 3 April` — what a day is called while you are looking at it. */
export function formatDay(language: Language, day: IsoDay): string {
  return worded(language, day, { weekday: 'long', day: 'numeric', month: 'long' })
}

/** `Fri 3 Apr` — the same day where there is less room for it. */
export function formatDayShort(language: Language, day: IsoDay): string {
  return worded(language, day, { weekday: 'short', day: 'numeric', month: 'short' })
}

/**
 * `3 Apr` — a day with no weekday on it.
 *
 * For a heading that names a *range* of days rather than one of them, where the
 * weekday is noise: the days it spans are listed underneath with their own
 * weekdays, and repeating one of them in the heading says nothing.
 */
export function formatDayCompact(language: Language, day: IsoDay): string {
  return worded(language, day, { day: 'numeric', month: 'short' })
}

/**
 * `Friday 3 April 2026` — a day named in full, for a control that has to say
 * where it leads without being looked at.
 *
 * The year is here and not in `formatDay` on purpose: on screen the year is
 * noise beside a date control that already shows it, but a screen reader hearing
 * only "next day, Friday 3 April" is being told less than the screen shows.
 *
 * **Built from `formatDay` rather than asked of `Intl` separately, and that is
 * the whole point of it.** Asked on its own, `en-GB` returns `Friday, 3 April
 * 2026` — with a comma the on-screen forms do not carry. Nobody chose that
 * comma; it is what the locale happens to answer. So the same day was written
 * one way in a heading and another in the control beside it, which reads as two
 * different days to somebody moving between them, and as a typo to anybody
 * reviewing it.
 *
 * Composing it means the two cannot drift apart again: this form is that form
 * plus a year, by construction, and a change to the wording reaches both.
 *
 * Spanish carries a comma after its weekday on screen, so it carries one here
 * too — the rule is that the two forms agree, not that there is no comma — and
 * joins the year with `de`, as it joins the month: `viernes, 3 de abril de
 * 2026`. That joining word is the one piece of the form this file states rather
 * than asks `Intl` for, because asking for the year separately is what brought
 * the stray English comma in.
 */
export function formatDayFull(language: Language, day: IsoDay): string {
  const named = formatDay(language, day)
  // `formatDay` hands back the stored string where the runtime cannot word a
  // day. A year appended to that makes a date nobody can read.
  if (named === day) return day
  return `${named}${YEAR_JOIN[language]}${yearOf(day)}`
}

/** What stands between a worded day and its year, per language. */
const YEAR_JOIN: Readonly<Record<Language, string>> = {
  en: ' ',
  es: ' de ',
}

/**
 * `9–26 Oct 2026` — a stretch of days, as one wording rather than one per place
 * that needs one.
 *
 * Here for the reason the rest of this file is here, and because two private
 * copies of it had already appeared — one in each application's filter, written
 * the same and owned by nobody. A trip's dates in the trip menu would have been
 * the third.
 *
 * Both ends are optional and are read independently, because a trip may carry
 * either alone. A single date is never written bare: `From 14 Nov 2026` and
 * `Until 8 Mar 2027` say which end of the trip it is, where `14 Nov 2026` on its
 * own could be read as either. Neither date returns `null`, so a caller renders
 * nothing rather than an empty label — a column of placeholders says less than
 * the names it crowds.
 *
 * A message rather than a string, because `From` and `Until` are words and no
 * package writes words. The stretch itself has no words around it in either
 * language, and travels in a message too so every answer here is drawn the same
 * way; `formatDayStretch` is the string, for a caller that always has both ends.
 *
 * **The year is always present.** A trip is commonly planned a year ahead, and
 * `9–26 Oct` reads correctly right up until the year it means stops being
 * obvious. Collapsing the repeated month pays for most of its width: the
 * filter's week headings were `3 Apr – 9 Apr` and are now `3–9 Apr 2026`, one
 * character shorter.
 */
export function formatDayRange(
  language: Language,
  from: IsoDay | null,
  to: IsoDay | null,
): Message | null {
  if (from == null && to == null) return null
  if (from == null) return message('days.until', { day: formatDayWithYear(language, to!) })
  if (to == null) return message('days.from', { day: formatDayWithYear(language, from) })
  return message('days.stretch', { days: formatDayStretch(language, from, to) })
}

/**
 * `9–26 Oct 2026` — a stretch whose both ends are known, as a string.
 *
 * The part of `formatDayRange` that is a value rather than a sentence. For a
 * caller that always holds both ends, such as a week heading in the filter.
 */
export function formatDayStretch(language: Language, from: IsoDay, to: IsoDay): string {
  if (from === to) return formatDayWithYear(language, from)

  /*
   * Where this runtime cannot word a month, every branch below would splice a
   * `YYYY-MM-DD` into the middle of a worded date — `9–2026-10-26`. Both ends
   * stored, joined, is the readable answer, and it is the same fallback the
   * single-day formats make.
   */
  if (formatDayCompact(language, from) === from || formatDayCompact(language, to) === to)
    return `${from} – ${to}`

  /*
   * An end before its start is refused when a trip's dates are saved, so this
   * is the guard for a row written by something that did not go through that
   * rule. Both ends are written in full rather than quietly swapped: swapping
   * would state an order nobody entered.
   */
  if (to < from)
    return `${formatDayWithYear(language, from)} – ${formatDayWithYear(language, to)}`

  // Different years, so each end carries its own: `28 Dec 2026 – 3 Jan 2027`.
  if (yearOf(from) !== yearOf(to))
    return `${formatDayWithYear(language, from)} – ${formatDayWithYear(language, to)}`

  /*
   * One month, written once: `9–26 Oct 2026`. The dash is tight between two
   * bare numerals and spaced between two worded dates, which is what makes the
   * collapsed form read as one date rather than two.
   */
  if (monthOf(from) === monthOf(to))
    return `${dayNumberOf(from)}–${formatDayWithYear(language, to)}`

  // Two months in one year, so the year is only needed once, at the end.
  return `${formatDayCompact(language, from)} – ${formatDayWithYear(language, to)}`
}

/**
 * `3 Apr 2026` — a day with its year and no weekday.
 *
 * A plain space before the year in both languages, unlike the full form: the
 * specification writes a stretch as `28 sept – 3 oct 2027` in Spanish, compact
 * as a heading needs to be.
 */
function formatDayWithYear(language: Language, day: IsoDay): string {
  const compact = formatDayCompact(language, day)
  if (compact === day) return day
  return `${compact} ${yearOf(day)}`
}

/*
 * The year, the month and the day number are read off the stored string rather
 * than asked of `Intl`, for the reason `formatDayNumeric` gives: the digits are
 * already there, and a locale has nothing to say about them except their order,
 * which none of these depends on.
 */
function yearOf(day: IsoDay): string {
  return day.slice(0, 4)
}

function monthOf(day: IsoDay): string {
  return day.slice(0, 7)
}

function dayNumberOf(day: IsoDay): string {
  return String(Number(day.slice(8, 10)))
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
function worded(language: Language, day: IsoDay, format: Intl.DateTimeFormatOptions): string {
  try {
    return dateOfDay(day).toLocaleDateString(LOCALE[language], format)
  } catch {
    return day
  }
}

/**
 * Where a place sits inside its run of days: `Day 2 of 4`.
 *
 * Shared for the reason at the top of this file rather than worded twice: both
 * applications want this exact string, and a stay reading `Day 2 of 4` on the
 * laptop and `Night 1 of 3` on the phone is an evening somebody loses.
 *
 * **Days, not nights, and that is a decision rather than an oversight.** A
 * booking is quoted in nights — the 3rd to the 6th is three nights and four
 * days — but the form asks which days a place is planned for rather than a
 * check-in and a check-out, so the days entered are the days shown and nothing
 * is converted. Nights would also be untrue of every run that is not somewhere
 * you sleep: a rail pass, a festival, a park pass.
 *
 * No locale and no `Intl` here, so none of the fallbacks above apply — this is
 * two integers and a sentence, and the sentence is named rather than written.
 */
export function formatRunPosition(position: {
  readonly index: number
  readonly total: number
}): Message {
  return message('days.runPosition', { index: position.index, total: position.total })
}
