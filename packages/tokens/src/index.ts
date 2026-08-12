/**
 * Design tokens: the values web and mobile must agree on.
 *
 * WHY THIS PACKAGE EXISTS
 *
 * The `styling` spec forbids a token package until a value is genuinely needed
 * by both applications, and requires one the moment such a value appears.
 * Marker family colours were that value — the same temple must be the same
 * colour on a laptop and on a phone.
 *
 * WHAT IS DERIVED FROM IT, AND WHAT IS NOT
 *
 * This module is the authoritative, platform-neutral definition. Native code
 * consumes it directly, because these are already literals and a React Native
 * `StyleSheet` takes them as they are — that is the neutral definition being
 * used, not a platform representation of it.
 *
 * Web is different. A browser theme belongs in the cascade rather than in
 * JavaScript, so a stylesheet of custom properties is generated from this
 * module. That file is a *platform representation* and every rule in the spec
 * applies to it: derived outward from here, never edited by hand, and never the
 * thing a value is recovered from.
 *
 * The direction only ever goes one way. Nothing recovers a token by parsing the
 * generated stylesheet.
 *
 * WHAT MAY GO IN HERE
 *
 * Platform-neutral literals, and pure functions over them. Not styling code,
 * not class names, not components — sharing those is what the spec forbids, and
 * a shared component is the rule's subject rather than a shortcut past it. If
 * something added here needs a dependency, it is not a token.
 */

export {
  BASEMAP_COLOUR,
  COLOUR,
  MARKER_FAMILY_COLOURS,
  MARKER_FOREGROUND,
} from './colour'
export type { MarkerFamilyColourKey, Themed, ThemeMode } from './colour'

export { ELEVATION } from './elevation'
export type { Elevation, ElevationLevel } from './elevation'

export {
  MARKER_ANCHOR,
  MARKER_BADGE_SIZE,
  MARKER_GLYPH_CENTRE,
  MARKER_GLYPH_SIZE,
  MARKER_SIZE,
  RADIUS,
  SPACE,
} from './layout'

export { FONT_FAMILY, TYPE } from './type'
export type { TypeRole, TypeRoleName } from './type'

export { pick, resolveTheme } from './theme'
export type { Theme, ThemeElevation } from './theme'
