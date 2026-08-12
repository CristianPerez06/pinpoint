/**
 * Colour tokens. Concrete literals, resolved by nobody.
 *
 * Every value here is a hex string — six digits, or eight where the value needs
 * an alpha channel. Both notations are rendered by a browser and by React
 * Native without further interpretation, which is the property that matters: the
 * `styling` spec forbids emitting anything the host resolves at runtime, because
 * native styling passes such a value through uninterpreted and produces an
 * element that occupies correct layout space and renders nothing — invisible to
 * typechecking, to linting, and to every test that does not inspect pixels.
 *
 * `rgba(…)` is deliberately absent even though browsers accept it. React Native
 * accepts it too, and that is exactly the trap: it works until somebody writes
 * `color-mix()` or a custom property beside it and nothing complains.
 *
 * WHY EVERY COLOUR IS A PAIR
 *
 * A colour is meaningless without the ground it is drawn on. Defining one value
 * and deriving the other by inversion produces contrast and destroys meaning —
 * see `MARKER_FAMILY_COLOURS` below, where the ranking between the five values
 * is the whole point and inversion would scramble it. So each colour is chosen
 * twice, against each ground.
 *
 * Non-colour tokens stay single-valued. Nothing about a spacing step changes
 * with the ground it sits on, and duplicating them would create two places for
 * one value to drift.
 */

export type ThemeMode = 'light' | 'dark'

/** One token, chosen against each ground. */
export interface Themed {
  readonly light: string
  readonly dark: string
}

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
 * THE DARK VALUES ARE CHOSEN, NOT DERIVED
 *
 * The light values were picked against white and several fail outright on a
 * dark ground — `sleep` at `#0B5FD0` on `#1D1B18` is close to invisible. Each
 * dark value is picked against `#1D1B18` instead, and the ranking above is
 * preserved in both: `see` is still the most recessive, the other four are still
 * prominent. A value that is legible but wrongly ranked does not satisfy this.
 *
 * The keys are the marker families defined in `@pinpoint/map`. This package
 * cannot import them — it declares no dependencies, and `@pinpoint/map` depends
 * on it — so the two are tied together by a compile-time completeness check on
 * the map side rather than by an import here.
 */
export const MARKER_FAMILY_COLOURS = {
  /** Muted slate. The quiet majority. */
  see: { light: '#7C8896', dark: '#98A3B0' },
  /** Burnt orange. */
  eat: { light: '#D2451E', dark: '#F0653A' },
  /** Violet. */
  buy: { light: '#8A3FFC', dark: '#A97BFF' },
  /** Blue. */
  sleep: { light: '#0B5FD0', dark: '#4A8FE8' },
  /** Teal. */
  move: { light: '#00857A', dark: '#16A99C' },
} as const satisfies Record<string, Themed>

export type MarkerFamilyColourKey = keyof typeof MARKER_FAMILY_COLOURS

/**
 * The pin's glyph, drawn on top of a family colour.
 *
 * White on the light theme, against five values chosen to carry it. On the dark
 * theme the pins are the lighter element and the glyph inverts with them: white
 * on `see`'s dark value clears about 2:1, which is thin at a 16px stroked icon,
 * where near-black clears comfortably against all five.
 *
 * This is the one place the two themes differ in kind rather than in value, and
 * it follows from the families being lifted rather than darkened.
 */
export const MARKER_FOREGROUND: Themed = { light: '#FFFFFF', dark: '#171614' }

/**
 * Neutrals and the accent, used by both applications for the surfaces around
 * the map.
 *
 * The neutrals carry a warm bias rather than being a pure grey ramp. That is a
 * choice and not an accident: it is what makes the amber read as chosen rather
 * than dropped onto a stock palette, and the basemap below is warmed to match so
 * the map and the interface share one ground instead of looking stapled
 * together.
 */
export const COLOUR = {
  /** Behind everything. */
  ground: { light: '#FBFAF8', dark: '#171614' },
  /** Rails, cards, sheets — anything that sits above the ground. */
  surface: { light: '#FFFFFF', dark: '#201E1B' },
  /** Fields, hover states, chips. */
  surfaceMuted: { light: '#F3F2EF', dark: '#2A2724' },
  /** Recessed: sticky headers, footers, anything that reads as behind. */
  surfaceSunk: { light: '#EFEDE8', dark: '#1B1A17' },
  /** The hairline between rows. */
  line: { light: '#E4E2DC', dark: '#34302B' },
  /** A border meant to be seen — a control's edge rather than a divider. */
  lineStrong: { light: '#D3D0C8', dark: '#443F38' },
  /** Names and values. */
  ink: { light: '#1A1917', dark: '#F2F0EC' },
  /** Notes, counts, labels. */
  inkMuted: { light: '#6E6A63', dark: '#A09A91' },
  /** Placeholders, and text that is deliberately hard to notice. */
  inkFaint: { light: '#9C978E', dark: '#7C766D' },

  /**
   * The accent, and why it is amber.
   *
   * It carries the primary action, the current selection, and the focus ring,
   * so it must be distinguishable from all five marker families at a glance —
   * an accent that reads as a sixth family would make the map's own colour
   * vocabulary ambiguous. Amber is nowhere near slate, orange-red, violet,
   * blue, or teal, and it is warm against the cool greyscale basemap.
   */
  accent: { light: '#E39A2B', dark: '#F0AE4A' },
  /**
   * The accent as text, and this is not interchangeable with `accent`.
   *
   * `#E39A2B` on white clears about 2:1, which is unreadable. Anything written
   * in the accent uses this instead — the same hue taken down to a value that
   * carries. On the dark ground the relationship inverts and the bright amber
   * is already the readable one, so the two values converge.
   */
  accentInk: { light: '#8A5A0B', dark: '#F0AE4A' },
  /** Behind a selected row. */
  accentWash: { light: '#FBF1DF', dark: '#33291A' },
  /** The focus ring. Alpha, so it reads over a surface or over the map. */
  accentRing: { light: '#E39A2B61', dark: '#F0AE4A6B' },

  /** Failure. Distinct from every family colour, so a broken map never reads as a marker. */
  danger: { light: '#B3261E', dark: '#F2857C' },
  dangerSurface: { light: '#FCEDEC', dark: '#33211F' },
} as const satisfies Record<string, Themed>

/**
 * The basemap's own colours.
 *
 * These are not decoration. `@pinpoint/map` rewrites the upstream style
 * document with them, which is how the map ends up sharing the interface's
 * warm ground instead of arriving as a stranger's grey. They live here rather
 * than in the map package for the same reason every other colour does: one
 * place a colour is written.
 *
 * Values are chosen against positron's structure — a near-greyscale style whose
 * quietness is what lets five saturated pins be the only strong colour on
 * screen.
 */
export const BASEMAP_COLOUR = {
  /** Everything that is not water, park, road, or building. */
  land: { light: '#EFEEE9', dark: '#1D1B18' },
  /** Building footprints and blocks. */
  block: { light: '#E7E5DF', dark: '#232019' },
  /** The road surface itself. */
  road: { light: '#FFFFFF', dark: '#2F2B25' },
  /** The line around a road, which is what separates it from the land. */
  roadCasing: { light: '#E2DFD8', dark: '#262219' },
  water: { light: '#D8DEE0', dark: '#1A1F22' },
  park: { light: '#E4E7DE', dark: '#1F241F' },
  /** The map's own text. Deliberately quiet — our markers are the subject. */
  label: { light: '#A8A29A', dark: '#6B655C' },
} as const satisfies Record<string, Themed>
