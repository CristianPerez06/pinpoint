import { DURATION, EASING } from '@pinpoint/tokens'
import { Easing, SlideInDown, SlideOutDown, type WithTimingConfig } from 'react-native-reanimated'

/**
 * The phone's timings for something arriving and leaving, built once from the
 * shared tokens so that every sheet and every pin reads the same numbers the
 * laptop's stylesheet does (`motion`, *Speeds and motion curves are shared
 * tokens*).
 *
 * `open` and `close` are the pair every surface uses: arriving takes `arrive`
 * on the curve that settles, leaving takes `standard` on the standard curve, so
 * dismissing is always quicker than opening. `reduced` is what any of them
 * becomes with reduce motion on: no movement, only a fade no longer than
 * `brief`, which is the ceiling the `motion` spec sets.
 */
export const SURFACE_TIMING = {
  open: { duration: DURATION.arrive, easing: Easing.bezier(...EASING.settle) },
  close: { duration: DURATION.standard, easing: Easing.bezier(...EASING.standard) },
  reduced: { duration: DURATION.brief, easing: Easing.bezier(...EASING.linear) },
} as const satisfies Record<string, WithTimingConfig & { duration: number }>

/** A pin being put down: it falls, lands a little past its point and settles. */
export const DROP_TIMING = {
  duration: DURATION.arrive,
  easing: Easing.bezier(...EASING.overshoot),
} as const satisfies WithTimingConfig

/**
 * How far the pin falls, and how far a floating surface moves into place. The
 * laptop's numbers (`pin.module.css`, `ui.module.css`), so both apps travel the
 * same distance where the surfaces are the same shape.
 */
export const DROP_DISTANCE = 14
export const FLOAT_DISTANCE = 16

/** A deleted pin shrinks toward its point to this scale as it fades. */
export const LEAVING_SCALE = 0.6

/**
 * The same pair as layout animations, for a sheet that is not a `Modal` and is
 * simply mounted and unmounted — the details sheet over the map. Built from
 * `SURFACE_TIMING` so the two cannot drift. Under reduce motion a layout
 * animation is skipped by default, so the sheet appears and goes at once, which
 * the `motion` spec allows.
 */
export const SHEET_ENTERING = SlideInDown.duration(SURFACE_TIMING.open.duration).easing(
  SURFACE_TIMING.open.easing,
)
export const SHEET_EXITING = SlideOutDown.duration(SURFACE_TIMING.close.duration).easing(
  SURFACE_TIMING.close.easing,
)
