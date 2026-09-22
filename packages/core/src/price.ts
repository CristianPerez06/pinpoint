import { message, type Language, type Message } from '@pinpoint/wording'

/**
 * Presenting a price.
 *
 * Lives here rather than in either application because both must produce the
 * same string from the same value — a price that reads differently on the
 * laptop and the phone is a bug someone will spend an evening on.
 */

/**
 * The locale prices are formatted in, one per language, never the device's.
 *
 * Left to the device, a laptop set to en-US and a phone set to de-DE would
 * render the same stored amount as `1,200.50` and `1.200,50`. The rule is that
 * both applications present a price the same way **for the same language**, and
 * that is only true if neither asks the operating system what it prefers. The
 * language is an argument threaded from wherever each application decides it.
 *
 * Spanish follows its own convention rather than English with the marks
 * swapped, and the difference matters most exactly where prices on this product
 * land: `es` writes **no** thousands separator at four digits (`USD 1200`,
 * `JPY 3800`) and a full stop from five (`USD 12.000`). That reads like a bug to
 * anybody who has only heard the rule stated as "comma becomes full stop", so
 * `price.test.ts` asserts it outright.
 */
const PRICE_LOCALE: Readonly<Record<Language, string>> = {
  en: 'en',
  es: 'es-ES',
}

/**
 * Format a price for display: `Free`, `USD 25`, or `USD 32.50`.
 *
 * Every price is in US dollars. Zero is a free place rather than an amount —
 * saving 0 and marking a place free are the same act — so it reads as a fact.
 *
 * `USD` rather than `$`: several currencies write `$`, and a trip abroad is
 * exactly where somebody would wonder which one this is.
 *
 * A message, because `Free` is a word — `Gratis` in Spanish — and no package
 * writes words. The amount travels in a message too, so a caller draws every
 * answer the same way.
 */
export function formatPrice(language: Language, amount: number): Message {
  if (amount === 0) return message('price.free')
  return message('price.amounts', { amounts: formatMoney(language, amount, 'USD') })
}

/**
 * Format an amount in a given currency: `USD 25`, `JPY 3,800`, `EUR 12.50`.
 *
 * The same rule for every currency, so a local price reads exactly like the
 * dollar price beside it. The code rather than a symbol, for the reason above:
 * `¥` is two currencies and `$` is a dozen.
 *
 * A whole amount carries no decimals and anything with cents carries two, so
 * `25` does not grow a `.00` nobody typed and `32.5` does not read as a
 * dimensionless number.
 */
export function formatMoney(language: Language, amount: number, code: string): string {
  const number = new Intl.NumberFormat(
    PRICE_LOCALE[language],
    Number.isInteger(amount)
      ? { maximumFractionDigits: 0 }
      : { minimumFractionDigits: 2, maximumFractionDigits: 2 },
  ).format(amount)

  return `${code} ${number}`
}

/**
 * What a place's price pill reads, or null for no pill at all.
 *
 * `Free` alone; both amounts joined, dollars first (`USD 25 · JPY 3,800`);
 * either one alone. A free place carries no local price — the database clears
 * it — and this says `Free` regardless, so the two can never read together.
 */
export function formatPrices(
  language: Language,
  marker: {
    price: number | null
    localPrice: number | null
    localCurrency: string | null
  },
): Message | null {
  if (marker.price === 0) return message('price.free')

  const parts: string[] = []
  if (marker.price !== null) parts.push(formatMoney(language, marker.price, 'USD'))
  if (marker.localPrice !== null && marker.localCurrency !== null) {
    parts.push(formatMoney(language, marker.localPrice, marker.localCurrency))
  }
  return parts.length === 0 ? null : message('price.amounts', { amounts: parts.join(' · ') })
}
