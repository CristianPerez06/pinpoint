import { describe, expect, it } from 'vitest'

import { formatMoney, formatPrice, formatPrices } from './price'

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
