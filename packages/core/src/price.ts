/**
 * Presenting a price.
 *
 * Lives here rather than in either application because both must produce the
 * same string from the same value — a price that reads differently on the
 * laptop and the phone is a bug someone will spend an evening on.
 */

/**
 * The locale prices are formatted in, pinned rather than taken from the device.
 *
 * Left to the device, a laptop set to en-US and a phone set to de-DE would
 * render the same stored amount as `1,200.50` and `1.200,50`. The rule is that
 * both applications present a price the same way, and that is only true if
 * neither asks the operating system what it prefers.
 *
 * `en` because the interface is English. When the interface is translated this
 * becomes an argument threaded from wherever the language is decided, not a
 * second call to the device.
 */
const PRICE_LOCALE = 'en'

/**
 * Format a price for display: `Free`, `USD 25`, or `USD 32.50`.
 *
 * Every price is in US dollars. Zero is a free place rather than an amount —
 * saving 0 and marking a place free are the same act — so it reads as a fact.
 *
 * A whole amount carries no decimals and anything with cents carries two, so
 * `25` does not grow a `.00` nobody typed and `32.5` does not read as a
 * dimensionless number.
 *
 * `USD` rather than `$`: several currencies write `$`, and a trip abroad is
 * exactly where somebody would wonder which one this is.
 */
export function formatPrice(amount: number): string {
  if (amount === 0) return 'Free'

  const number = new Intl.NumberFormat(
    PRICE_LOCALE,
    Number.isInteger(amount)
      ? { maximumFractionDigits: 0 }
      : { minimumFractionDigits: 2, maximumFractionDigits: 2 },
  ).format(amount)

  return `USD ${number}`
}
