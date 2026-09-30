/**
 * Motion: how long things take, and how they speed up and slow down.
 *
 * The same argument `styling` makes for colour, applied to time. A sheet that
 * slides up in 150ms on the laptop and 300ms on the phone reads as two
 * products, so every duration and curve either application animates with is a
 * name here, and a component never writes one as a literal (`motion` spec).
 *
 * The values were not invented for this module. They are the ones the laptop
 * had already settled on, one stylesheet at a time, before there was anywhere
 * to put them: 0.12s and 0.15s for colour and hover changes, 0.16–0.18s for a
 * control moving, 0.42s for a pin dropping onto the map.
 */

/** Durations, in milliseconds. */
export const DURATION = {
  /** A colour or opacity change under the pointer. Also the ceiling for a reduce-motion fade. */
  brief: 120,
  /** Hover and press feedback, a toggle's thumb. */
  quick: 150,
  /** A control moving or turning: a chevron, a pin lifting when selected. */
  standard: 180,
  /** Something arriving with a little weight: a pin dropping onto the map. */
  arrive: 420,
} as const

export type DurationName = keyof typeof DURATION

/**
 * Easing curves, as the four control points of a cubic Bézier.
 *
 * Four numbers rather than a CSS string because the phone cannot read CSS: the
 * laptop receives `cubic-bezier(x1, y1, x2, y2)` from the derived stylesheet,
 * and the phone passes the same four numbers to `Easing.bezier`. A y outside
 * 0–1 overshoots, which is how `overshoot` lands a pin a little past its place.
 */
export const EASING = {
  /** The browser's own `ease`: the default for anything unremarkable. */
  standard: [0.25, 0.1, 0.25, 1],
  /** Fast out of the gate, long settle — something moving to where it belongs. */
  settle: [0.2, 0.8, 0.3, 1],
  /** Overshoots and comes back. */
  overshoot: [0.2, 1.2, 0.4, 1],
  /** Constant speed, for things that turn continuously, like a spinner. */
  linear: [0, 0, 1, 1],
} as const satisfies Record<string, readonly [number, number, number, number]>

export type EasingName = keyof typeof EASING

/**
 * Springs: motion that stops by overshooting and settling back.
 *
 * Mass, stiffness and damping are what a physics spring is made of, and they
 * are the parameters Reanimated's `withSpring` takes, so the phone applies these
 * as they are. CSS has no spring, so the laptop has none until it needs one.
 *
 * `stop` is the hard stop in the phone's opening: the globe hits its mark and
 * bounces. Its numbers are the approved mock's bounce — a wobble about 150ms
 * long that dies away over about 40ms per cycle — written as a spring.
 */
export const SPRING = {
  stop: { mass: 1, stiffness: 2321, damping: 47.6 },
} as const satisfies Record<string, { mass: number; stiffness: number; damping: number }>

export type SpringName = keyof typeof SPRING
