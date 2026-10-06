import { describe, expect, it } from 'vitest'

import { sheetHeightAbove } from './sheet-height'

describe('sheetHeightAbove', () => {
  it('stands at its resting height while the keyboard is down', () => {
    expect(sheetHeightAbove({ resting: 422, keyboardTop: null, topInset: 47, gap: 24 })).toBe(422)
  })

  it('fills the room above the keyboard on a typical phone', () => {
    // An 844-point window with a 336-point keyboard: 508 − 47 − 24.
    expect(sheetHeightAbove({ resting: 422, keyboardTop: 508, topInset: 47, gap: 24 })).toBe(437)
  })

  it('gives the smallest phone more than half its window', () => {
    // An iPhone SE: 667 − 216 = 451, then − 20 − 24, against a resting 334.
    expect(sheetHeightAbove({ resting: 334, keyboardTop: 451, topInset: 20, gap: 24 })).toBe(407)
  })

  it('comes down to the room for a sheet resting taller than it', () => {
    // The place form at its full height: 0.92 of 844 would put its top off screen.
    expect(sheetHeightAbove({ resting: 776, keyboardTop: 508, topInset: 47, gap: 24 })).toBe(437)
  })
})
