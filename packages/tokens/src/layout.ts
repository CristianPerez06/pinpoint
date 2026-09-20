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
 * The teardrop itself, as an SVG path drawn in the `MARKER_SIZE` box.
 *
 * One definition, consumed by both applications and by the tooling that cuts
 * the product's icons. It sits here rather than in `@pinpoint/map` because it
 * is a value with no behaviour attached and it is meaningless without the box
 * above — a shape in one package and its coordinate system in another would be
 * two things to keep in step instead of none.
 *
 * WHY THIS IS NOT THE SHARED MARKUP `styling` FORBIDS
 *
 * That requirement forbids sharing styling code, a class-name vocabulary or
 * component markup, and rejects a cross-platform styling runtime. This is a
 * list of coordinates. Each application still draws it with its own parts — a
 * `<path>` on the web, `react-native-svg`'s `Path` on the phone — exactly as
 * each applies a shared colour with its own styling mechanism.
 *
 * It was three literals before: one per application, and a third in the
 * favicon. A check held them equal, which is not the same as there being one of
 * them — a check reports a divergence after somebody has made it, and only for
 * the copies it was told about.
 *
 * THE HEAD IS NOT WHERE IT LOOKS
 *
 * The obvious reading is a circle of radius 13 centred at (16, 15), and both
 * applications said so for a while. The arc's endpoints are 14.47 from that
 * point, so they cannot lie on it. SVG takes two endpoints, two radii and two
 * flags and *derives* the centre, which puts it at (16, 17.47) — so the drawn
 * shape starts at y 4.47 rather than y 2 and is 36.53 tall, not 39. Anything
 * measuring this path should measure it rather than assume those numbers.
 */
export const MARKER_PATH =
  'M16 41 C 16 41 6.6 27.8 5 24.4 A 13 13 0 1 1 27 24.4 C 25.4 27.8 16 41 16 41 Z' as const

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

/**
 * How much larger the selected marker is drawn.
 *
 * Here for the reason `MARKER_SIZE` and `MARKER_ANCHOR` are here: the two
 * applications have to draw the selected marker identically, and the way they
 * stopped doing so was each deciding for itself. The laptop grew it and the
 * phone did not, for as long as both have had a map, because nothing said a
 * selected marker was drawn any particular way.
 *
 * `1.2` is the laptop's existing value, kept rather than re-derived. It has
 * been on screen since the map existed and it clears a tight cluster; choosing
 * a new number would change the platform that was already right in order to
 * agree with the one that was not.
 *
 * The growth is about the anchor, not the centre. A marker's point sits on its
 * coordinate at every size, so whatever applies this has to scale from the
 * bottom centre — `MARKER_ANCHOR` — or the pin lifts off the place it names as
 * it grows.
 */
export const MARKER_SELECTED_SCALE = 1.2
