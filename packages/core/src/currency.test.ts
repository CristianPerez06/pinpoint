import { describe, expect, it } from 'vitest'

import {
  CURRENCIES,
  currenciesIn,
  currencyCodeSchema,
  currencyLabel,
  currencyName,
  searchCurrencies,
} from './currency'

const codes = (query: string) => searchCurrencies('en', query).map(([code]) => code)

describe('CURRENCIES', () => {
  it('never offers US dollars', () => {
    expect(CURRENCIES.some(([code]) => code === 'USD')).toBe(false)
  })

  it('is ordered by code, once each', () => {
    const list = CURRENCIES.map(([code]) => code)
    expect(list).toEqual([...list].sort())
    expect(new Set(list).size).toBe(list.length)
  })

  it('holds only codes the database accepts', () => {
    for (const [code] of CURRENCIES) expect(currencyCodeSchema.safeParse(code).success).toBe(true)
  })
})

describe('searchCurrencies', () => {
  it('finds the yen by its name and by its code', () => {
    expect(codes('yen')).toContain('JPY')
    expect(codes('JPY')[0]).toBe('JPY')
    expect(codes('jpy')[0]).toBe('JPY')
  })

  it('matches a code as well as a name', () => {
    // `MAD` by its code, `MYR` by "Malaysian".
    expect(codes('ma')).toEqual(expect.arrayContaining(['MAD', 'MYR']))
    expect(codes('ma').indexOf('MAD')).toBeLessThan(codes('ma').indexOf('MYR'))
  })

  it('ignores accents', () => {
    expect(codes('bolivar')).toContain('VES')
  })

  it('lists everything for an empty search, and never USD', () => {
    expect(searchCurrencies('en', '  ')).toHaveLength(CURRENCIES.length)
    expect(codes('us')).not.toContain('USD')
    expect(codes('dollar')).not.toContain('USD')
  })
})

describe('currencyCodeSchema', () => {
  it('accepts three capitals and refuses USD', () => {
    expect(currencyCodeSchema.safeParse('JPY').success).toBe(true)
    expect(currencyCodeSchema.safeParse('jpy').success).toBe(false)
    expect(currencyCodeSchema.safeParse('JPYY').success).toBe(false)
    expect(currencyCodeSchema.safeParse('USD').success).toBe(false)
  })
})

describe('currencyLabel', () => {
  it('reads as code and name', () => {
    expect(currencyLabel('en', 'JPY')).toBe('JPY — Japanese Yen')
    expect(currencyName('en', 'KRW')).toBe('South Korean Won')
  })

  it('falls back to the code for one the list no longer holds', () => {
    expect(currencyLabel('en', 'HRK')).toBe('HRK')
  })
})

describe('currency names in Spanish', () => {
  it('names every currency the English list holds', () => {
    for (const [code] of CURRENCIES) expect(currencyName('es', code)).not.toBe(code)
  })

  it('reads as code and name, and is found by its Spanish name', () => {
    expect(currencyLabel('es', 'JPY')).toBe('JPY — Yen japonés')
    expect(searchCurrencies('es', 'japon').map(([code]) => code)).toContain('JPY')
    expect(currenciesIn('es')).toHaveLength(CURRENCIES.length)
  })
})

describe('a refused currency says what is wrong', () => {
  const complain = (code: string) => {
    const parsed = currencyCodeSchema.safeParse(code)
    return parsed.success ? undefined : parsed.error.issues[0]?.message
  }

  it('something that is not a three-letter code', () => {
    expect(complain('yen')).toBe('currency.malformed')
  })

  // Already written in our own voice before this change, and left as it was.
  it('the currency every place already has', () => {
    expect(complain('USD')).toBe('currency.alreadyDollars')
  })
})
