import { type ReactNode, useEffect, useLayoutEffect, useState } from 'react'
import { Modal, StyleSheet, useWindowDimensions } from 'react-native'
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'

import { FLOAT_DISTANCE, SURFACE_TIMING } from '@/lib/motion'

/**
 * How tall the sheets that hold a list or a place stand: Filter, Nearby, the
 * trips, the cities, the people and a place's details (`workspace-chrome`, *A
 * panel raised on a phone-shaped screen rises from the edge*).
 *
 * A fixed height rather than a ceiling. They used to choose their own — 0.8,
 * 0.85, 0.62, 0.5 — and to grow with what they held, so a long list left a
 * sliver of map and the same sheet stood at a different height every time it
 * opened. Half the window leaves the other half of the map in view, whichever of
 * them is open.
 *
 * Definite pixels, so a scroller inside has a height to fill rather than asking
 * a parent sized to its children (`AGENTS.md`).
 */
export const SHEET_HEIGHT = 0.5

/** `SHEET_HEIGHT` of a window, in pixels. */
export function sheetHeight(windowHeight: number): number {
  return Math.round(windowHeight * SHEET_HEIGHT)
}

/**
 * Sheets whose `Modal` is still up while their closing animation plays.
 *
 * Only closing ones, not every one that is up: a picker opened from inside an
 * open sheet — a date, from the trips sheet — is presented on top of it, which
 * iOS allows. What it refuses is presenting while one is on its way out.
 *
 * Marked while rendering, not from an effect, and an opening sheet decides in
 * a layout effect, not while rendering. The press that closes one sheet and
 * opens another renders both in one pass and only then runs effects, so this
 * way every closing sheet in that pass is marked before any opening one looks,
 * in whichever order the two happen to render. Marked from an effect instead,
 * the set was still empty when People looked, and it opened into the trips
 * sheet exactly as before.
 */
const closing = new Set<symbol>()
/** Sheets asked to open, each waiting for `closing` to empty. */
const waiting = new Set<() => void>()

function release() {
  if (closing.size > 0) return
  for (const go of [...waiting]) go()
}

/**
 * A surface opened over the screen, arriving and leaving with the shared timing
 * (`motion`, *A surface opening over a screen arrives and leaves with the shared
 * timing*).
 *
 * Every sheet was a `Modal` with `animationType="slide"`, which is the
 * system's own slide at the system's own speed: no token reached it and it did
 * not read reduce motion. This is that `Modal` with the system's animation
 * turned off and ours drawn inside it, and nothing else — each sheet keeps its
 * own backdrop, its `KeyboardAvoidingView` and its surface exactly as they were
 * (see `AGENTS.md` on why the `KeyboardAvoidingView` must stay a bare
 * positioner). The whole of the content moves, as the system's slide moved it.
 *
 * `edge` slides in from the bottom edge, for a sheet standing on it. `floating`
 * rises a short way into place as it fades, for something drawn in the middle
 * of the screen, as the laptop's corner card does.
 *
 * WHY IT HOLDS THE MODAL OPEN
 *
 * A `Modal` made invisible takes its children with it in the same frame, so a
 * closing animation inside one never gets drawn. This keeps the `Modal` up for
 * the length of the closing animation after `open` turns false, and lets it go
 * once that has played. Nothing in it can be pressed meanwhile: the content is
 * set to take no touches the moment it is dismissed.
 *
 * WHY ONE WAITS FOR ANOTHER
 *
 * Holding the `Modal` open has a cost: iOS shows one modal at a time and ignores
 * a request to show a second while the first is still up. So a press that closes
 * one sheet and opens another — People, from inside the trips sheet — closed the
 * first and silently never showed the second. Nothing failed and nothing was
 * logged; the press simply did nothing. A sheet asked to open while another is
 * still up now waits for it to be gone, and appears then.
 */
export function Sheet({
  open,
  onRequestClose,
  placement = 'edge',
  children,
}: {
  open: boolean
  /** Android's back button, as `Modal` names it. */
  onRequestClose: () => void
  placement?: 'edge' | 'floating'
  children: ReactNode
}) {
  const [key] = useState(() => Symbol('sheet'))
  const [mounted, setMounted] = useState(open)
  /** Asked to open, and waiting for any sheet still closing to be gone. */
  const [queued, setQueued] = useState(false)
  if (open && !mounted && !queued) setQueued(true)
  if (!open && queued) setQueued(false)

  // See `closing` for why this is written here rather than in an effect.
  if (mounted && !open) closing.add(key)
  else closing.delete(key)

  // Before paint, so a sheet with nothing to wait for still opens in the frame
  // it was asked to.
  useLayoutEffect(() => {
    if (!queued) return
    const go = () => {
      waiting.delete(go)
      setQueued(false)
      setMounted(true)
    }
    waiting.add(go)
    release()
    return () => {
      waiting.delete(go)
    }
  }, [queued])

  // Its `Modal` gone — closed, or taken with the screen — lets whoever is waiting
  // go a frame later, once the native modal has been dismissed rather than
  // merely asked to be.
  useEffect(() => {
    if (!mounted) return
    return () => {
      closing.delete(key)
      requestAnimationFrame(release)
    }
  }, [mounted, key])

  const reduce = useReducedMotion()
  const { height } = useWindowDimensions()
  const shown = useSharedValue(0)

  useEffect(() => {
    if (!mounted) return
    if (open) {
      shown.value = withTiming(1, reduce ? SURFACE_TIMING.reduced : SURFACE_TIMING.open)
      return
    }
    const leave = reduce ? SURFACE_TIMING.reduced : SURFACE_TIMING.close
    shown.value = withTiming(0, leave)
    const done = setTimeout(() => setMounted(false), leave.duration)
    return () => clearTimeout(done)
  }, [open, mounted, reduce, shown, key])

  const style = useAnimatedStyle(() => {
    if (reduce) return { opacity: shown.value }
    if (placement === 'edge') return { transform: [{ translateY: (1 - shown.value) * height }] }
    return {
      opacity: shown.value,
      transform: [{ translateY: (1 - shown.value) * FLOAT_DISTANCE }],
    }
  })

  if (!mounted) return null
  return (
    <Modal visible animationType="none" transparent onRequestClose={onRequestClose}>
      <Animated.View
        style={[styles.fill, style]}
        pointerEvents={open ? 'auto' : 'none'}
        // Gone for a screen reader too, from the moment it is dismissed.
        accessibilityElementsHidden={!open}
        importantForAccessibility={open ? 'auto' : 'no-hide-descendants'}
      >
        {children}
      </Animated.View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
})
