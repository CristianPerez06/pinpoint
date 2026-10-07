import { describe, expect, it } from 'vitest'

import { fullHeight, sheetHeightAbove } from './sheet-height'

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

describe('fullHeight', () => {
  it('keeps the fraction where the room fits it', () => {
    expect(fullHeight({ wanted: 776, lower: 439, room: 820, gap: 24 })).toBe(776)
  })

  it('stops short of the trip header on a typical phone', () => {
    // An 844-point window whose map starts 115 points down: 729 − 24, against 0.92 × 844.
    expect(fullHeight({ wanted: 776, lower: 439, room: 729, gap: 24 })).toBe(705)
  })

  it('stops short of the trip header on the smallest phone', () => {
    // An iPhone SE: 667 − 76 = 591, then − 24, against 0.92 × 667.
    expect(fullHeight({ wanted: 614, lower: 347, room: 591, gap: 24 })).toBe(567)
  })

  it('never falls below the lower height', () => {
    expect(fullHeight({ wanted: 776, lower: 439, room: 300, gap: 24 })).toBe(439)
  })

  it('stands at the fraction before the room is measured', () => {
    expect(fullHeight({ wanted: 776, lower: 439, room: null, gap: 24 })).toBe(776)
  })
})
