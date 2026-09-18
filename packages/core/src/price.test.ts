import { describe, expect, it } from 'vitest'

import { formatPrice } from './price'

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
