import type { Themed } from './colour'

/**
 * Elevation, stored as ingredients rather than as a shadow.
 *
 * There is no cross-platform notation for a shadow. CSS wants one string,
 * `box-shadow: 0 4px 12px #1A19171A`; React Native wants four separate style
 * properties on iOS and an `elevation` number on Android. Emitting either form
 * here would make the token unusable on the other platform — the same failure
 * the colour literals avoid, arriving through a different door.
 *
 * So each level is the parts, and each application composes them in its own
 * idiom. Offsets and radii are in density-independent pixels, like everything
 * in `layout.ts`; the colour carries its own alpha.
 *
 * There is no `x` offset because nothing here casts sideways: the light is
 * directly above, which is what makes a stack of surfaces read as a stack
 * rather than as a diagram.
 */
export interface Elevation {
  /** Eight-digit hex — the alpha is part of the value, not a separate opacity. */
  readonly colour: Themed
  /** Downward offset. */
  readonly offsetY: number
  /** Blur radius. */
  readonly blur: number
}

/**
 * Three levels and a fourth for pins, which is not one of them.
 *
 * Dark shadows are near-black at a higher alpha rather than the light theme's
 * warm ink lightened. On a dark ground a shadow works by absence of light, and
 * a tinted one reads as a smudge.
 */
export const ELEVATION = {
  /** A control, or a row lifted off its surface. */
  sm: {
    colour: { light: '#1A19170F', dark: '#00000066' },
    offsetY: 1,
    blur: 2,
  },
  /** A card, a sheet header, anything the eye should read as floating. */
  md: {
    colour: { light: '#1A19171A', dark: '#00000075' },
    offsetY: 4,
    blur: 12,
  },
  /** A panel over the map, where the thing beneath is busy. */
  lg: {
    colour: { light: '#1A191729', dark: '#00000094' },
    offsetY: 12,
    blur: 32,
  },
  /**
   * A pin against the map.
   *
   * Tighter and darker than `sm` because it has to separate a small shape from
   * cartography rather than from a flat surface — a soft shadow disappears
   * against road casings and building blocks.
   */
  pin: {
    colour: { light: '#1A19174D', dark: '#0000008C' },
    offsetY: 2,
    blur: 5,
  },
} as const satisfies Record<string, Elevation>

export type ElevationLevel = keyof typeof ELEVATION
