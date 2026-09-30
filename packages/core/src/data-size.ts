import { message, type Language, type Message } from '@pinpoint/wording'

/**
 * Presenting how much space something takes on a phone.
 *
 * Here for the reason `distance.ts` gives: a number is written from the
 * language, never the device's locale, and a unit is a word — so the package
 * hands back a name, and the application resolves it where it draws it.
 */

const SIZE_LOCALE: Readonly<Record<Language, string>> = {
  en: 'en',
  es: 'es-ES',
}

const MB = 1_000_000
const GB = 1_000_000_000

/**
 * `96 MB`, `4.2 MB`, `1.3 GB` — or, for an estimate, `about 96 MB`.
 *
 * Decimal megabytes, as phones report storage. A tenth only under 10 MB, where
 * it is still a noticeable share; above that it is noise. Never `0 MB`: anything
 * that exists is at least a tenth of one.
 */
export function formatSize(language: Language, bytes: number, approximate = false): Message {
  const inGb = bytes >= GB
  const value = inGb ? bytes / GB : Math.max(0.1, bytes / MB)
  const digits = inGb || value < 10 ? 1 : 0
  const size = new Intl.NumberFormat(SIZE_LOCALE[language], {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  }).format(value)

  if (inGb) {
    return message(approximate ? 'offlineMap.aboutGigabytes' : 'offlineMap.gigabytes', { size })
  }
  return message(approximate ? 'offlineMap.aboutMegabytes' : 'offlineMap.megabytes', { size })
}
