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

/**
 * The same role, for something a person types into.
 *
 * `lineHeight` withheld, and only that. It is a paragraph property — 1.52 on
 * `body`, chosen for reading prose — and a field has no paragraph: its height
 * comes from its own padding, which knows nothing about a line box.
 *
 * React Native hands the value to iOS as
 * `paragraphStyle.minimumLineHeight = maximumLineHeight` (`RCTTextAttributes.mm`),
 * and a line box forced taller than the font asks for grows upward from the
 * baseline. The glyphs then sit low in a field that was centred on the
 * assumption they would not — invisible until somebody types, which is exactly
 * when it was noticed.
 *
 * Everything else is kept, so a field is still the same face at the same size
 * and weight as the text around it.
 */
export function fieldRole(spec: TypeRole): TextStyle {
  // Destructured off rather than deleted, so what comes back is still a shape
  // the type checker can see through.
  const { lineHeight: _lineHeight, ...rest } = role(spec)
  return rest
}
