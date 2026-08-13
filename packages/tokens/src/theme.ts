import type { Themed, ThemeMode } from './colour'
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

export function resolveTheme(mode: ThemeMode): Theme {
  return mode === 'dark' ? DARK : LIGHT
}
