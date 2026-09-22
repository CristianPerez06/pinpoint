import { say, type Language } from '@pinpoint/wording'
import { describe, expect, it } from 'vitest'

import {
  formatMoney as formatMoneyIn,
  formatPrice as formatPriceMessage,
  formatPrices as formatPricesMessage,
} from './price'

/*
 * The price as a person reads it, in English unless a test says otherwise, so
 * each assertion below states the words rather than a message.
 */
function formatPrice(amount: number, language: Language = 'en') {
  return say(language, formatPriceMessage(language, amount))
}

function formatMoney(amount: number, code: string, language: Language = 'en') {
  return formatMoneyIn(language, amount, code)
}

function formatPrices(
  marker: { price: number | null; localPrice: number | null; localCurrency: string | null },
  language: Language = 'en',
) {
  const prices = formatPricesMessage(language, marker)
  return prices === null ? null : say(language, prices)
}

describe('formatPrice', () => {
  it('presents a whole amount in US dollars with no decimals', () => {
    expect(formatPrice(25)).toBe('USD 25')
  })

  it('separates thousands', () => {
    expect(formatPrice(1200)).toBe('USD 1,200')
  })

  it('presents an amount with cents to two decimals', () => {
    expect(formatPrice(32.5)).toBe('USD 32.50')
    expect(formatPrice(0.5)).toBe('USD 0.50')
  })

  it('presents zero as free, not as an amount', () => {
    expect(formatPrice(0)).toBe('Free')
  })

  it('presents the largest amount the database can hold', () => {
    // `numeric(10, 2)` — the widest pill the card ever has to draw.
    expect(formatPrice(99_999_999.99)).toBe('USD 99,999,999.99')
  })
})

describe('formatMoney', () => {
  it('uses the same rule for every currency', () => {
    expect(formatMoney(3800, 'JPY')).toBe('JPY 3,800')
    expect(formatMoney(12.5, 'EUR')).toBe('EUR 12.50')
  })
})

describe('formatPrices', () => {
  const place = (price: number | null, localPrice: number | null, localCurrency: string | null) => ({
    price,
    localPrice,
    localCurrency,
  })

  it('joins both amounts, dollars first', () => {
    expect(formatPrices(place(25, 3800, 'JPY'))).toBe('USD 25 · JPY 3,800')
  })

  it('draws the widest realistic pill', () => {
    expect(formatPrices(place(1250.5, 18_500_000, 'IDR'))).toBe('USD 1,250.50 · IDR 18,500,000')
  })

  it('shows either amount alone', () => {
    expect(formatPrices(place(null, 3800, 'JPY'))).toBe('JPY 3,800')
    expect(formatPrices(place(25, null, null))).toBe('USD 25')
  })

  it('says Free alone, whatever else is held', () => {
    expect(formatPrices(place(0, null, null))).toBe('Free')
    expect(formatPrices(place(0, 3800, 'JPY'))).toBe('Free')
  })

  it('draws no pill for a place with neither', () => {
    expect(formatPrices(place(null, null, null))).toBeNull()
  })
})

/**
 * Spanish writes a number its own way, not English with the marks swapped.
 *
 * The four-digit rule is the one that matters here: `1200` and `3800` are the
 * sizes an actual price on this product lands on, and Spanish writes them with
 * no separator at all. A reviewer who has only seen the rule as "comma becomes
 * full stop" would read `USD 1200` as a bug, so it is asserted outright.
 */
describe('prices in Spanish', () => {
  it('writes no thousands separator at four digits', () => {
    expect(formatPrice(1200, 'es')).toBe('USD 1200')
    expect(formatMoney(3800, 'JPY', 'es')).toBe('JPY 3800')
  })

  it('writes a full stop from five digits', () => {
    expect(formatPrice(12000, 'es')).toBe('USD 12.000')
  })

  it('writes cents after a comma', () => {
    expect(formatPrice(32.5, 'es')).toBe('USD 32,50')
  })

  it('keeps the currency code, before the amount', () => {
    expect(formatPrices({ price: 25, localPrice: 3800, localCurrency: 'JPY' }, 'es')).toBe(
      'USD 25 · JPY 3800',
    )
  })

  it('says Gratis for a free place', () => {
    expect(formatPrice(0, 'es')).toBe('Gratis')
    expect(formatPrices({ price: 0, localPrice: null, localCurrency: null }, 'es')).toBe('Gratis')
  })

  it('is the same whatever the runtime prefers', () => {
    const previous = process.env.LANG
    process.env.LANG = 'de_DE.UTF-8'
    try {
      expect(formatPrice(1200, 'es')).toBe('USD 1200')
      expect(formatPrice(1200, 'en')).toBe('USD 1,200')
    } finally {
      process.env.LANG = previous
    }
  })
})
