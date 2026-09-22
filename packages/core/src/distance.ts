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
