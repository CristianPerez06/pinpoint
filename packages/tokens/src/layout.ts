/**
 * Spacing and radii, in density-independent pixels.
 *
 * Numbers rather than strings: React Native takes numbers and CSS needs a unit
 * appended. Emitting `'8px'` here would make the value unusable on native,
 * which is the same failure the colour tokens avoid. Each application adds its
 * own unit.
 */

export const SPACE = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const

export const RADIUS = {
  sm: 4,
  md: 8,
  pill: 999,
} as const

/** Diameter of a marker pin. Both platforms draw the same size target. */
export const MARKER_SIZE = 32

/** Diameter of the badge showing how many markers sit at one point. */
export const MARKER_BADGE_SIZE = 18
