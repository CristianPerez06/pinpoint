import { describe, expect, it } from 'vitest'

import type { ThemeMode, ThemePreference } from './colour'
import { parseThemePreference, resolveMode } from './theme'

/**
 * The one piece of this package's behaviour that can be checked without a screen.
 *
 * `resolveMode` is two lines, and the temptation is to leave it to the type
 * system. The type system cannot see the thing that would actually go wrong:
 * the precedence being inverted, so that a device on dark overrides somebody who
 * explicitly chose light. That is a defect which type-checks, renders, and is
 * only visible to a person who owns a dark device and asked for a light
 * application — a combination nobody has while building.
 *
 * All six cases are written out rather than generated. There are six.
 */
describe('resolveMode', () => {
  const CASES: ReadonlyArray<[ThemePreference, ThemeMode, ThemeMode]> = [
    ['system', 'light', 'light'],
    ['system', 'dark', 'dark'],
    ['light', 'light', 'light'],
    ['light', 'dark', 'light'],
    ['dark', 'light', 'dark'],
    ['dark', 'dark', 'dark'],
  ]

  it.each(CASES)('%s preference on a %s device resolves to %s', (preference, device, expected) => {
    expect(resolveMode(preference, device)).toBe(expected)
  })

  it('an explicit choice outranks the device rather than the other way round', () => {
    // Stated separately from the table because it is the assertion with a
    // reason. The table would still pass with the arguments swapped in the
    // implementation for four of its six rows.
    expect(resolveMode('light', 'dark')).toBe('light')
    expect(resolveMode('dark', 'light')).toBe('dark')
  })

  it('following the device is the only preference that reads the device at all', () => {
    expect(resolveMode('system', 'dark')).toBe('dark')
    expect(resolveMode('system', 'light')).toBe('light')
  })
})

/**
 * Both platforms read the choice back out of a store that hands them a loose
 * string — a cookie on one, a key-value store on the other — so both meet values
 * neither of them wrote. The cases below are the ones that actually occur:
 * nothing stored yet, a cleared entry, and a value from a build that knew
 * something this one does not.
 */
describe('parseThemePreference', () => {
  it.each(['system', 'light', 'dark'] as const)('keeps %s', (value) => {
    expect(parseThemePreference(value)).toBe(value)
  })

  it.each([
    ['nothing stored', null],
    ['no key at all', undefined],
    ['a cleared entry', ''],
    ['a value from a later build', 'dusk'],
    ['the right word in the wrong case', 'Dark'],
    ['whitespace around a real value', ' dark '],
  ])('reads %s as system', (_why, value) => {
    expect(parseThemePreference(value)).toBe('system')
  })
})
