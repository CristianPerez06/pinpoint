import { type ReactNode, useEffect, useState } from 'react'
import { Modal, StyleSheet, useWindowDimensions } from 'react-native'
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'

import { FLOAT_DISTANCE, SURFACE_TIMING } from '@/lib/motion'

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
  const [mounted, setMounted] = useState(open)
  // Mounted in the render that opens it, so it is never a frame late.
  if (open && !mounted) setMounted(true)

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
  }, [open, mounted, reduce, shown])

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
