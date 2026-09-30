import { SPRING } from '@pinpoint/tokens'

/**
 * When everything in the opening happens.
 *
 * The one table the `motion` spec allows a platform-only sequence to keep: every
 * time in the opening is here and nowhere else. The numbers are the approved
 * mock's (`openspec/changes/animate-the-apps-and-the-splash/mock/splash.html`),
 * in milliseconds from the moment the first animated frame is drawn.
 */
export const SPLASH_TIMING = {
  full: {
    /** The icon, still — the still launch image and this are the same picture. */
    hold: 200,
    /** The pin fills out into 3D, grows and rises; the view rises; the world appears. */
    grow: 500,
    /** Each of the three spins: speeding up, then the hard stop and its bounce. */
    spinAccel: 350,
    spinSettle: 230,
    /** How far the right spin and the second left spin turn the globe, in degrees. */
    spinDegrees: 70,
    /** The globe lifts and fades into the app. */
    exit: 280,
  },
  short: {
    hold: 150,
    grow: 500,
    exit: 250,
  },
  /** Reduce motion: no animation, a fade no longer than `DURATION.brief`. */
  still: {
    exit: 120,
  },
} as const

export type OpeningVersion = keyof typeof SPLASH_TIMING

/** Where the animation ends — when the app may appear, if it is ready. */
export function animationEnd(version: OpeningVersion): number {
  if (version === 'full') {
    const f = SPLASH_TIMING.full
    return f.hold + f.grow + 3 * (f.spinAccel + f.spinSettle)
  }
  if (version === 'short') return SPLASH_TIMING.short.hold + SPLASH_TIMING.short.grow
  return 0
}

export function exitDuration(version: OpeningVersion): number {
  return SPLASH_TIMING[version].exit
}

/** Everything the scene needs to draw one frame. */
export interface Pose {
  /** 0 → 1 as the pin fills out, grows and rises, and the view rises. */
  readonly grow: number
  /** How far the globe has turned from where it started, in degrees; right is positive. */
  readonly spin: number
  /** The pin's sway from each hard stop, in radians. */
  readonly sway: number
}

const clamp = (x: number) => Math.min(1, Math.max(0, x))
const easeIn = (p: number) => p * p

/**
 * One spin: it speeds up evenly until it hits `to`, then stops hard and
 * bounces around it like a spring struck at that speed.
 *
 * The bounce is `SPRING.stop` — the same named spring the tokens hold — solved
 * rather than stepped, so a frame drawn late lands where it should.
 */
function spin(t: number, from: number, to: number): number {
  const { spinAccel: accel, spinSettle: settle } = SPLASH_TIMING.full
  if (t <= 0) return from
  const distance = to - from
  if (t < accel) return from + distance * easeIn(t / accel)
  const speed = (2 * distance) / accel // degrees per millisecond at the moment of the stop
  const { mass, stiffness, damping } = SPRING.stop
  const decay = damping / (2 * mass) // per second
  const omega = Math.sqrt(stiffness / mass - decay * decay) // per second
  const s = Math.min(t - accel, settle) / 1000
  return to + ((speed * 1000) / omega) * Math.exp(-decay * s) * Math.sin(omega * s)
}

/** What the opening looks like `t` milliseconds in. */
export function pose(version: OpeningVersion, t: number): Pose {
  if (version === 'still') return { grow: 0, spin: 0, sway: 0 }
  const { hold, grow } = SPLASH_TIMING[version]
  const g = clamp((t - hold) / grow)
  if (version === 'short') return { grow: g, spin: 0, sway: 0 }

  const f = SPLASH_TIMING.full
  const turn = f.spinAccel + f.spinSettle
  const first = hold + grow
  const legs: [number, number, number][] = [
    [first, 0, f.spinDegrees],
    [first + turn, f.spinDegrees, 0],
    [first + 2 * turn, 0, -f.spinDegrees],
  ]
  let degrees = 0
  let sway = 0
  for (const [start, from, to] of legs) {
    if (t < start) break
    degrees = spin(t - start, from, to)
    // The pin feels each stop: it leans against the overshoot while the globe settles.
    sway = t - start >= f.spinAccel ? -(degrees - to) * 0.02 : 0
  }
  return { grow: g, spin: degrees, sway }
}
