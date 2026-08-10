/**
 * Presenting a price with the currency of the city it is filed under.
 *
 * Lives here rather than in either application because both must produce the
 * same string from the same two values — a price that reads differently on the
 * laptop and the phone is a bug someone will spend an evening on.
 */

/**
 * An ISO 4217 alphabetic code, matching the shape the database enforces.
 *
 * Shape only. Validating against the real list would mean carrying that list,
 * and a code this product has never heard of is still better rendered as
 * `XYZ 500` than refused.
 */
export const CURRENCY_CODE_PATTERN = /^[A-Z]{3}$/

/**
 * The locale prices are formatted in, pinned rather than taken from the device.
 *
 * Left to the device, a laptop set to en-US and a phone set to de-DE would
 * render the same stored amount as `$500.00` and `500,00 $`. The rule is that
 * both applications present a price the same way, and that is only true if
 * neither asks the operating system what it prefers.
 *
 * `en` because the interface is English. When the interface is translated this
 * becomes an argument threaded from wherever the language is decided, not a
 * second call to the device.
 */
const PRICE_LOCALE = 'en'

/**
 * Format an amount for display, with its currency when one is known.
 *
 * A null currency yields a bare number — no symbol is guessed and none is
 * inherited from anywhere else. A price shown in the wrong currency is worse
 * than a price shown in none, because it looks correct.
 *
 * Falls back to `CODE amount` if the runtime cannot format the currency. That is
 * not hypothetical: the currency data behind `Intl` is thinner on a React Native
 * runtime than in a browser, and a price that throws while rendering takes the
 * whole marker detail view with it.
 */
export function formatPrice(amount: number, currency: string | null): string {
  if (currency === null) {
    try {
      return new Intl.NumberFormat(PRICE_LOCALE).format(amount)
    } catch {
      return String(amount)
    }
  }

  try {
    return new Intl.NumberFormat(PRICE_LOCALE, {
      style: 'currency',
      currency,
    }).format(amount)
  } catch {
    return `${currency} ${amount}`
  }
}
