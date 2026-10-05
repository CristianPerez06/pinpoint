import type { TravelMode } from '@pinpoint/map'
import { message, type Language, type Message } from '@pinpoint/wording'

/**
 * Presenting a distance.
 *
 * Here rather than in either application for the reason `price.ts` gives: both
 * draw the same number beside a search result, and a distance that reads
 * `1,234 km` on the laptop and `1.234 km` on the phone for the same language is
 * a bug nobody would think to look for.
 */

/**
 * The locale a distance is written in, one per language, never the device's.
 *
 * The same pairing as `PRICE_LOCALE`, so a number reads the same way in the
 * search list as in a price pill. Spanish writes a decimal comma (`3,2 km`) and
 * no thousands mark at four digits (`1234 km`).
 */
const DISTANCE_LOCALE: Readonly<Record<Language, string>> = {
  en: 'en',
  es: 'es-ES',
}

/**
 * A distance, at a precision that suits its size: `3.2 km`, `280 km`.
 *
 * Under 10 km a tenth matters, because that is the difference between the right
 * temple and the one across the river. At four figures it is noise.
 *
 * A message, because the unit is a word — no package writes words.
 */
export function formatDistance(language: Language, km: number): Message {
  const digits = km < 10 ? 1 : 0
  const distance = new Intl.NumberFormat(DISTANCE_LOCALE[language], {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(km)

  return message('search.distance', { distance })
}

/**
 * A distance as somebody on foot reads it: `350 m`, `1.2 km`, `34 km`
 * (`nearby-places`).
 *
 * Metres under a kilometre, rounded to ten, because `0.3 km` is read as a
 * calculation and `300 m` as a distance. Beside `formatDistance` rather than
 * replacing it: a search result's distance answers "is this the right
 * continent", where a tenth of a kilometre is already more than enough.
 *
 * The switch is on the rounded figure, so `999 m` never reads `1000 m`.
 */
export function formatWalkingDistance(language: Language, km: number): Message {
  const metres = Math.round(km * 100) * 10
  if (metres >= 1000) return formatDistance(language, km)

  const distance = new Intl.NumberFormat(DISTANCE_LOCALE[language], {
    maximumFractionDigits: 0,
  }).format(metres)

  return message('nearby.metres', { distance })
}

/**
 * A time on foot, as an estimate: `About 25 min walk`, `About 1 h 10 min walk`
 * (`place-route`).
 *
 * Takes minutes already rounded by `walkingMinutes` in `@pinpoint/map`, so this
 * only decides how they are written. Minutes under an hour, hours and minutes
 * from an hour, and hours alone when the minutes come out at zero, because
 * `2 h 0 min` reads as a stopwatch.
 */
export function formatWalkingTime(language: Language, minutes: number): Message {
  const number = new Intl.NumberFormat(DISTANCE_LOCALE[language], { maximumFractionDigits: 0 })
  if (minutes < 60) return message('route.walkMinutes', { minutes: number.format(minutes) })

  const hours = number.format(Math.floor(minutes / 60))
  const rest = minutes % 60
  if (rest === 0) return message('route.walkHours', { hours })
  return message('route.walkHoursMinutes', { hours, minutes: number.format(rest) })
}

/**
 * A street route's time, for the way of travelling: `53 min walk`,
 * `18 min by bike`, `1 h 35 min drive` (`place-route`).
 *
 * Takes the routing service's own minutes, unrounded. Rounded to the nearest
 * minute and never said as less than one, because a street route is a real
 * figure rather than an estimate — so it is written without *About*, and not
 * rounded to five as the walking estimate is.
 */
export function formatTravelTime(language: Language, minutes: number, mode: TravelMode): Message {
  const number = new Intl.NumberFormat(DISTANCE_LOCALE[language], { maximumFractionDigits: 0 })
  const whole = Math.max(1, Math.round(minutes))
  const sentences = TRAVEL_TIME[mode]
  if (whole < 60) return sentences.minutes(number.format(whole))

  const hours = number.format(Math.floor(whole / 60))
  const rest = whole % 60
  if (rest === 0) return sentences.hours(hours)
  return sentences.hoursMinutes(hours, number.format(rest))
}

/**
 * The sentences a time is written in, per way of travelling.
 *
 * An exhaustive record with every name written out, because `check:wording`
 * cannot read a name assembled from the mode.
 */
const TRAVEL_TIME: Readonly<
  Record<
    TravelMode,
    {
      minutes: (minutes: string) => Message
      hours: (hours: string) => Message
      hoursMinutes: (hours: string, minutes: string) => Message
    }
  >
> = {
  walk: {
    minutes: (minutes) => message('route.walkTimeMinutes', { minutes }),
    hours: (hours) => message('route.walkTimeHours', { hours }),
    hoursMinutes: (hours, minutes) => message('route.walkTimeHoursMinutes', { hours, minutes }),
  },
  bike: {
    minutes: (minutes) => message('route.bikeTimeMinutes', { minutes }),
    hours: (hours) => message('route.bikeTimeHours', { hours }),
    hoursMinutes: (hours, minutes) => message('route.bikeTimeHoursMinutes', { hours, minutes }),
  },
  car: {
    minutes: (minutes) => message('route.carTimeMinutes', { minutes }),
    hours: (hours) => message('route.carTimeHours', { hours }),
    hoursMinutes: (hours, minutes) => message('route.carTimeHoursMinutes', { hours, minutes }),
  },
}
