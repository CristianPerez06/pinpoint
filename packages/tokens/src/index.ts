/**
 * Design tokens: the values web and mobile must agree on.
 *
 * WHY THIS PACKAGE EXISTS NOW AND NOT BEFORE
 *
 * The `styling` spec forbids a token package until a value is genuinely needed
 * by both applications, and requires one the moment such a value appears.
 * Marker family colours are that value — the same temple must be the same
 * colour on a laptop and on a phone.
 *
 * WHY NOTHING IS GENERATED FROM IT
 *
 * The spec's derivation machinery governs *platform-specific representations*
 * — a CSS custom-property sheet, a native stylesheet — and requires each to be
 * derived from the neutral definition rather than hand-written. This package
 * produces none, because neither application has any styling to derive into:
 * both import these literals directly as ordinary values.
 *
 * That is not a loophole. The requirement in force today is single source of
 * truth, and it is satisfied — there is exactly one place a colour is written.
 * The derivation requirements apply in full the moment someone wants these
 * values in CSS, at which point the generated file is derived from here and
 * says so in its own text.
 *
 * WHAT MAY GO IN HERE
 *
 * Platform-neutral literals. Not styling code, not class names, not components
 * — sharing those is what the spec forbids, and a shared component is the
 * rule's subject rather than a shortcut past it. If something added here needs
 * a dependency, it is not a token.
 */

export {
  COLOUR,
  MARKER_FAMILY_COLOURS,
  MARKER_FOREGROUND,
} from './colour'
export type { MarkerFamilyColourKey } from './colour'

export {
  MARKER_BADGE_SIZE,
  MARKER_SIZE,
  RADIUS,
  SPACE,
} from './layout'
