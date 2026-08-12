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

/**
 * Corner radii.
 *
 * Softer than they were. The direction is tactile without being loud, and the
 * whole range sits between "this is a surface you could pick up" and the
 * rounded-consumer-app look that would compete with the pins for attention.
 */
export const RADIUS = {
  /** An icon chip, a tag. */
  sm: 6,
  /** A field, a button. */
  md: 10,
  /** A card, a sheet, a panel over the map. */
  lg: 14,
  /** Fully round: a badge, a search box, the primary action. */
  pill: 999,
} as const

/**
 * The drawn size of a marker pin, and where its coordinate is.
 *
 * A teardrop rather than a disc: the point sits on the position, so there is no
 * question about whether the middle or the bottom of the pin is the place. That
 * ambiguity is not hypothetical here — markers drifting off their coordinates
 * on zoom was a real defect, and it was invisible at the zoom the map opens at.
 *
 * `MARKER_ANCHOR` is normalised against the drawn box: `{ x: 0.5, y: 1 }` is the
 * bottom centre. Both applications pass it to their renderer instead of writing
 * an offset, which is what let the previous defect survive being fixed on one
 * platform.
 */
export const MARKER_SIZE = { width: 32, height: 42 } as const

export const MARKER_ANCHOR = { x: 0.5, y: 1 } as const

/**
 * Where the glyph sits inside the pin, normalised the same way.
 *
 * Not the centre of the box: the teardrop's head is the round part at the top,
 * so the glyph centres on that rather than on the shape as a whole.
 */
export const MARKER_GLYPH_CENTRE = { x: 0.5, y: 15 / 42 } as const

/** Side of the glyph drawn inside a pin. */
export const MARKER_GLYPH_SIZE = 15

/** Diameter of the badge showing how many markers sit at one point. */
export const MARKER_BADGE_SIZE = 18
