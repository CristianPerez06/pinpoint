/**
 * Colour tokens. Concrete literals, resolved by nobody.
 *
 * Every value here is a six-digit hex string, which is the one colour notation
 * both a browser and React Native render without further interpretation. No
 * value refers to another value: the `styling` spec forbids emitting anything
 * the host resolves at runtime, because native styling passes such a value
 * through uninterpreted and produces an element that occupies correct layout
 * space and renders nothing — invisible to typechecking, to linting, and to
 * every test that does not inspect pixels.
 */

/**
 * One colour per marker family, and the reason they are not an even palette.
 *
 * A real wishlist is lopsided: the seeded Kyoto trip is fourteen `see` against
 * one each of `eat`, `buy`, `move` and `sleep`. If `see` took a loud colour,
 * fourteen loud pins would drown the four that carry information — and the
 * minority is the signal. Finding the one restaurant among fourteen temples is
 * exactly the question asked at lunchtime.
 *
 * So `see` is deliberately the most recessive value here, and the other four
 * are deliberately prominent. Changing that is a product decision, not a
 * palette refresh.
 *
 * The keys are the marker families defined in `@pinpoint/map`. This package
 * cannot import them — it has no dependencies, and `@pinpoint/map` depends on
 * it — so the two are tied together by a compile-time completeness check on
 * the map side rather than by an import here.
 */
export const MARKER_FAMILY_COLOURS = {
  /** Muted slate. The quiet majority. */
  see: '#7C8896',
  /** Burnt orange. */
  eat: '#D2451E',
  /** Violet. */
  buy: '#8A3FFC',
  /** Blue. */
  sleep: '#0B5FD0',
  /** Teal. */
  move: '#00857A',
} as const

export type MarkerFamilyColourKey = keyof typeof MARKER_FAMILY_COLOURS

/**
 * Drawn on top of a family colour — the pin's glyph background and its ring.
 * White against all five families above.
 */
export const MARKER_FOREGROUND = '#FFFFFF'

/** Neutrals, used by both applications for the surfaces around the map. */
export const COLOUR = {
  surface: '#FFFFFF',
  surfaceMuted: '#F2F4F6',
  border: '#D8DEE4',
  text: '#16202A',
  textMuted: '#5A6672',
  /** Failure. Distinct from every family colour, so a broken map never reads as a marker. */
  danger: '#B3261E',
  dangerSurface: '#FCEDEC',
} as const
