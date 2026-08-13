/**
 * The type scale.
 *
 * One typeface, Figtree, bundled with each application rather than fetched from
 * a third party at runtime — which is both the $0 constraint and the reason a
 * check asserts the file is really there. A missing font file falls back to a
 * system face silently, changing every measurement on the screen while breaking
 * no build and no typecheck.
 *
 * WHY LETTER-SPACING AND LINE HEIGHT ARE RATIOS
 *
 * CSS wants `letter-spacing: -0.022em` and a unitless `line-height`. React
 * Native wants both in absolute points. A token that committed to either unit
 * would be unusable on the other platform, so both are stored as a multiple of
 * the role's own size: web writes `${ratio}em`, native multiplies by `size`.
 * That is the same reasoning that keeps `SPACE` a number rather than `'8px'`.
 *
 * WHY THE WEIGHTS ARE ROUND HUNDREDS
 *
 * Figtree is variable and a browser will happily set 620. React Native will
 * not: it maps a weight to the nearest face the platform resolved, so 620 and
 * 600 render identically on a phone and differently on a laptop. The `styling`
 * spec requires the same role to render at the same weight on both platforms,
 * so the scale only uses steps both can honour.
 */

export interface TypeRole {
  /** Density-independent pixels. */
  readonly size: number
  /** 100–900, in steps both platforms resolve identically. */
  readonly weight: number
  /** A multiple of `size`. Negative tightens. */
  readonly letterSpacing: number
  /** A multiple of `size`. */
  readonly lineHeight: number
  /**
   * Whether digits are fixed-width.
   *
   * True wherever numbers stack into a column — a price beside a price. With
   * proportional digits a `1` is narrower than a `7`, so a column of prices
   * shifts horizontally row to row and stops being scannable, which is the one
   * thing the list has to beat a spreadsheet at.
   */
  readonly tabularNumerals: boolean
  /** Whether the role is drawn in capitals. Applied by each platform. */
  readonly uppercase: boolean
}

export const TYPE = {
  /** A place name given the whole panel — the largest thing on a screen. */
  display: {
    size: 32,
    weight: 800,
    letterSpacing: -0.033,
    lineHeight: 1.1,
    tabularNumerals: false,
    uppercase: false,
  },
  /** A selected place's name, a form's heading. */
  title: {
    size: 17,
    weight: 700,
    letterSpacing: -0.022,
    lineHeight: 1.22,
    tabularNumerals: false,
    uppercase: false,
  },
  /** A place's name in a list. */
  rowName: {
    size: 14,
    weight: 600,
    letterSpacing: -0.012,
    lineHeight: 1.3,
    tabularNumerals: false,
    uppercase: false,
  },
  /** A note, read rather than scanned. */
  body: {
    size: 13.5,
    weight: 400,
    letterSpacing: 0,
    lineHeight: 1.52,
    tabularNumerals: false,
    uppercase: false,
  },
  /** A note reduced to one line under a name. */
  note: {
    size: 12.5,
    weight: 400,
    letterSpacing: 0,
    lineHeight: 1.35,
    tabularNumerals: false,
    uppercase: false,
  },
  /** A city header, a field label — small, spaced, and in capitals. */
  label: {
    size: 11,
    weight: 700,
    letterSpacing: 0.1,
    lineHeight: 1.3,
    tabularNumerals: false,
    uppercase: true,
  },
  /** A price, a count. The reason `tabularNumerals` exists. */
  numeric: {
    size: 13,
    weight: 600,
    letterSpacing: 0,
    lineHeight: 1.3,
    tabularNumerals: true,
    uppercase: false,
  },
  /** Text inside an input or a button. */
  control: {
    size: 13.5,
    weight: 500,
    letterSpacing: 0,
    lineHeight: 1.3,
    tabularNumerals: false,
    uppercase: false,
  },
} as const satisfies Record<string, TypeRole>

export type TypeRoleName = keyof typeof TYPE

/**
 * The family name both applications must register the bundled file under.
 *
 * Shared because it is the string that has to match in two places that cannot
 * see each other — `next/font`'s declaration on web and `expo-font`'s on native.
 * A typo in either falls back to a system face and says nothing.
 */
export const FONT_FAMILY = 'Figtree'
