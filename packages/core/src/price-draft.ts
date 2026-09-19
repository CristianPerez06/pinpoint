import { formatMoney } from './price'

/**
 * What the place form's price boxes turn into when it is saved.
 *
 * Shared because both applications have the same two boxes and the same `Free`
 * toggle, and a rule about when a typed 0 becomes free that holds on the laptop
 * but not on the phone is exactly the kind of difference nobody finds until a
 * trip is being planned on both.
 */
export interface PriceDraft {
  free: boolean
  /** What is typed in `Price (USD)`. */
  usd: string
  /** What is typed in the second box, or `''` when there is none. */
  local: string
  /** The second currency of the city chosen in the form, or null for none. */
  currency: string | null
}

export interface DraftedPrices {
  price: number | null
  localPrice: number | null
  localCurrency: string | null
}

/** Blank is not entered yet. Anything else is a number, or `NaN` for the schema to refuse. */
function amountOf(text: string): number | null {
  const trimmed = text.trim()
  return trimmed === '' ? null : Number(trimmed)
}

/**
 * The prices a save writes.
 *
 * A 0 in either box is free, and free carries no amount in either currency: a
 * place whose only cost is 0 in any currency is free, and there is no `JPY 0`.
 * A blank box is absent — not entered yet — and never collapses into free.
 */
export function pricesFromDraft(draft: PriceDraft): DraftedPrices {
  const usd = amountOf(draft.usd)
  const local = draft.currency === null ? null : amountOf(draft.local)

  if (draft.free || usd === 0 || local === 0) {
    return { price: 0, localPrice: null, localCurrency: null }
  }

  return {
    price: usd,
    localPrice: local,
    localCurrency: local === null ? null : draft.currency,
  }
}

/**
 * The saved local amount that saving this form would clear, as it reads —
 * `JPY 3,800` — or null when nothing would be lost.
 *
 * Lost when the city chosen in the form has a different second currency, or
 * none, or there is no city at all. The database clears it on save whatever
 * the form says; this is what lets the form say so first.
 */
export function localPriceClearedBy(
  saved: { localPrice: number | null; localCurrency: string | null },
  currency: string | null,
): string | null {
  if (saved.localPrice === null || saved.localCurrency === null) return null
  if (saved.localCurrency === currency) return null
  return formatMoney(saved.localPrice, saved.localCurrency)
}

/**
 * How many of a city's places would lose their local price if its currency
 * changed or it were removed — the number every warning names.
 */
export function localPricesUnder(
  cityId: string,
  markers: readonly { cityId: string | null; localPrice: number | null }[],
): number {
  return markers.filter((marker) => marker.cityId === cityId && marker.localPrice !== null)
    .length
}
