import { describe, expect, it } from 'vitest'

import { localPriceClearedBy, localPricesUnder, pricesFromDraft } from './price-draft'

const draft = (usd: string, local: string, currency: string | null = 'JPY', free = false) => ({
  free,
  usd,
  local,
  currency,
})

describe('pricesFromDraft', () => {
  it('saves both amounts, each as typed', () => {
    expect(pricesFromDraft(draft('25', '3800'))).toEqual({
      price: 25,
      localPrice: 3800,
      localCurrency: 'JPY',
    })
  })

  it('saves either one alone, and neither', () => {
    expect(pricesFromDraft(draft('', '3800'))).toEqual({
      price: null,
      localPrice: 3800,
      localCurrency: 'JPY',
    })
    expect(pricesFromDraft(draft('25', ''))).toEqual({
      price: 25,
      localPrice: null,
      localCurrency: null,
    })
    expect(pricesFromDraft(draft(' ', ''))).toEqual({
      price: null,
      localPrice: null,
      localCurrency: null,
    })
  })

  it('treats Free as free with no amount in either currency', () => {
    expect(pricesFromDraft(draft('25', '3800', 'JPY', true))).toEqual({
      price: 0,
      localPrice: null,
      localCurrency: null,
    })
  })

  it('treats a 0 in either box as free', () => {
    const free = { price: 0, localPrice: null, localCurrency: null }
    expect(pricesFromDraft(draft('0', ''))).toEqual(free)
    expect(pricesFromDraft(draft('', '0'))).toEqual(free)
    expect(pricesFromDraft(draft('25', '0'))).toEqual(free)
  })

  it('ignores the second box in a city with no second currency', () => {
    expect(pricesFromDraft(draft('25', '3800', null))).toEqual({
      price: 25,
      localPrice: null,
      localCurrency: null,
    })
  })

  it('passes text that is not a number on for the schema to refuse', () => {
    expect(pricesFromDraft(draft('abc', '')).price).toBeNaN()
  })
})

describe('localPriceClearedBy', () => {
  const saved = { localPrice: 3800, localCurrency: 'JPY' }

  it('names the amount when the chosen city has another currency, none, or there is no city', () => {
    expect(localPriceClearedBy(saved, 'KRW')).toBe('JPY 3,800')
    expect(localPriceClearedBy(saved, null)).toBe('JPY 3,800')
  })

  it('says nothing when the currency is the same, or nothing was saved', () => {
    expect(localPriceClearedBy(saved, 'JPY')).toBeNull()
    expect(localPriceClearedBy({ localPrice: null, localCurrency: null }, 'KRW')).toBeNull()
  })
})

describe('localPricesUnder', () => {
  it('counts the places in that city with a local price', () => {
    const markers = [
      { cityId: 'tokyo', localPrice: 3800 },
      { cityId: 'tokyo', localPrice: null },
      { cityId: 'tokyo', localPrice: 1200 },
      { cityId: 'seoul', localPrice: 9000 },
      { cityId: null, localPrice: null },
    ]
    expect(localPricesUnder('tokyo', markers)).toBe(2)
    expect(localPricesUnder('kyoto', markers)).toBe(0)
  })
})
