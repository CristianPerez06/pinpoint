import type { Themed, ThemeMode, ThemePreference } from './colour'
import { DARK, LIGHT, type Theme, type ThemeElevation } from './generated/native'

/**
 * Choosing a ground.
 *
 * The work of flattening each themed pair happens in the derivation, not here —
 * `generated/native.ts` holds both grounds already resolved, so this is a
 * lookup rather than a traversal on every render.
 *
 * Web mostly does not need any of this: its representation is a stylesheet and
 * the cascade does the choosing. Native has no cascade, so it needs a value.
 */

export type { Theme, ThemeElevation }

export function pick(token: Themed, mode: ThemeMode): string {
  return token[mode]
}

/**
 * A preference and the device's answer, resolved to the ground to draw on.
 *
 * The step before `resolveTheme`: three values become two, and only then does a
 * colour get looked up. Both applications call this and neither restates the
 * precedence, which is the whole reason it is here rather than twice.
 *
 * `device` is an argument rather than something this reads, because the two
 * platforms ask entirely different questions to find out — `matchMedia` against
 * a media query on one, `useColorScheme()` on the other — and neither is
 * available to a package that carries no DOM API and no native module. What is
 * shared is the rule, not the asking.
 *
 * Pure and total. No default argument: a caller that has not worked out what
 * the device says has not finished, and defaulting to light here would hide
 * that behind a plausible answer.
 */
export function resolveMode(preference: ThemePreference, device: ThemeMode): ThemeMode {
  return preference === 'system' ? device : preference
}

/**
 * Whatever came out of a store, as a preference.
 *
 * Both platforms keep the choice somewhere that hands back a loose string — a
 * cookie on one, a key-value store on the other — and both have to answer the
 * same question about a value neither of them wrote: an absent key, an empty
 * string, something truncated, something hand-edited, or a fourth value written
 * by a later build that this one predates.
 *
 * Total, and shared for the reason the resolver is: two parsers that disagree
 * about an unrecognised value are two applications that disagree about what
 * somebody chose. Everything unrecognised is `'system'`, which is the state the
 * product is in before anybody chooses anything — so an unreadable store costs
 * a person the default rather than a wrong ground or a broken screen.
 */
export function parseThemePreference(stored: string | null | undefined): ThemePreference {
  return stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'system'
}

export function resolveTheme(mode: ThemeMode): Theme {
  return mode === 'dark' ? DARK : LIGHT
}
