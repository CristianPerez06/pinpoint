import { FONT_FAMILY, type TypeRole } from '@pinpoint/tokens'
import type { TextStyle } from 'react-native'

/**
 * A shared type role, in React Native's vocabulary.
 *
 * The token stores letter-spacing and line height as multiples of the role's
 * own size, because CSS wants `-0.022em` and a unitless line height while React
 * Native wants both in absolute points. This is where the multiplication
 * happens; `packages/tokens/scripts/derive.ts` does the equivalent for web by
 * emitting `em` units.
 *
 * `fontWeight` is a string here. React Native's types accept the numeric
 * weights, but the platform resolves them against the faces actually
 * registered, and the scale only uses steps both platforms honour — see the
 * comment on `TYPE`.
 */
export function role(spec: TypeRole): TextStyle {
  return {
    fontFamily: FONT_FAMILY,
    fontSize: spec.size,
    fontWeight: String(spec.weight) as TextStyle['fontWeight'],
    letterSpacing: spec.size * spec.letterSpacing,
    lineHeight: spec.size * spec.lineHeight,
    ...(spec.uppercase ? { textTransform: 'uppercase' as const } : {}),
    // React Native has no `font-variant-numeric`, but it does expose the
    // OpenType feature directly. Without it a column of prices shifts
    // horizontally row to row, which is the one thing a list has to beat a
    // spreadsheet at.
    ...(spec.tabularNumerals
      ? { fontVariant: ['tabular-nums'] as TextStyle['fontVariant'] }
      : {}),
  }
}
