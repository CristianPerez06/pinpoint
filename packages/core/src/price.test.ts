import { describe, expect, it } from 'vitest'

import { formatPrice } from './price'

describe('formatPrice', () => {
  it('presents an amount in the currency it is given', () => {
    expect(formatPrice(500, 'JPY')).toBe('¥500')
    expect(formatPrice(500, 'USD')).toBe('$500.00')
    expect(formatPrice(1500, 'KRW')).toBe('₩1,500')
  })

  it('respects how many decimal places a currency actually has', () => {
    // Yen has none and dollars have two. Getting this from the currency rather
    // than from a format string is most of the reason for using Intl at all.
    expect(formatPrice(0, 'JPY')).toBe('¥0')
    expect(formatPrice(0, 'USD')).toBe('$0.00')
  })

  it('presents a bare amount when the currency is unknown', () => {
    // No symbol is guessed and none is inherited. A price shown in the wrong
    // currency is worse than one shown in none, because it looks correct.
    expect(formatPrice(1234.5, null)).toBe('1,234.5')
    expect(formatPrice(0, null)).toBe('0')
  })

  it('renders a currency it has never heard of rather than refusing', () => {
    // The code is validated for shape, not against a list, so an unfamiliar but
    // well-formed code has to render as something.
    //
    // The separator is a non-breaking space, not an ordinary one — Intl uses
    // U+00A0 so a currency code never wraps away from its amount. Asserting the
    // ordinary space here fails with two error messages that look identical.
    expect(formatPrice(500, 'ZZZ')).toBe('ZZZ\u00a0500.00')
  })

  it('does not throw on a malformed currency code', () => {
    // Both the schema and the database check the shape, so this should be
    // unreachable — but a price that throws while rendering takes the whole
    // marker detail view with it, and that is too much to lose to a bad row.
    expect(() => formatPrice(500, 'ZZ')).not.toThrow()
    expect(formatPrice(500, 'ZZ')).toBe('ZZ 500')
  })

  it('formats the same amount identically however it is reached', () => {
    // Both applications must produce the same string, which is only true while
    // the locale is pinned rather than taken from the device.
    expect(formatPrice(1234567.891, 'USD')).toBe('$1,234,567.89')
  })
})
