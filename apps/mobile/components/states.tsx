import {
  COLOUR,
  DURATION,
  EASING,
  MARKER_HOLE,
  MARKER_PATH,
  MARKER_SIZE,
  RADIUS,
  SPACE,
  TYPE,
} from '@pinpoint/tokens'
import { message, type Message } from '@pinpoint/wording'
import { type ReactNode, useEffect } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated'
import Svg, { Path } from 'react-native-svg'

import { useSay } from '@/lib/language'
import { useTheme } from '@/lib/theme'
import { role } from '@/lib/type'

/**
 * Loading, broken, and correctly empty — in React Native's idiom.
 *
 * These are the same three states the web app renders and deliberately not the
 * same components. The `styling` spec is explicit that platforms share token
 * values and not styling code, class-name vocabulary, or component markup; a
 * component has to render something, and `<div>` and `<View>` are not the same
 * something. A shared spinner is the rule's subject, not a way around it.
 *
 * Every measurement below comes from `@pinpoint/tokens` and every colour from
 * the theme it resolves, which is what keeps this looking like the same product
 * as the web app without either one importing the other's markup.
 */

/** The globe's sheet: frames, and how they are laid out. See `icon-globe.mjs`. */
const FRAMES = 72
const COLUMNS = 9
const ROWS = 8
/** The globe's diameter, in points. The laptop's is the same 48px. */
const GLOBE = 48
/** The pin stands on the sphere's middle at a little over half its height, as the opening's does. */
const PIN_HEIGHT = GLOBE * 0.62
const PIN_WIDTH = (PIN_HEIGHT * MARKER_SIZE.width) / MARKER_SIZE.height
/**
 * The outline round the pin, in the pin's own units (its 32 × 42 box). Half of
 * it shows outside the pin: about a point and a half at this size.
 */
const PIN_OUTLINE = 4
const HOLE_PATH = (() => {
  const { cx, cy, r } = MARKER_HOLE
  return `M${cx + r} ${cy} A${r} ${r} 0 1 0 ${cx - r} ${cy} A${r} ${r} 0 1 0 ${cx + r} ${cy} Z`
})()

const styles = StyleSheet.create({
  panel: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACE.sm,
    padding: SPACE.xl,
  },
  muted: { ...role(TYPE.body), textAlign: 'center' },
  failed: {
    borderWidth: 1,
    borderRadius: RADIUS.md,
    margin: SPACE.md,
  },
  failedText: { ...role(TYPE.body), fontWeight: '600', textAlign: 'center' },
  globe: {
    width: GLOBE,
    height: GLOBE,
    // Room above for the pin's head, which clears the sphere's top edge.
    marginTop: GLOBE * 0.14,
  },
  sphere: {
    width: GLOBE,
    height: GLOBE,
    borderRadius: GLOBE / 2,
    overflow: 'hidden',
  },
  sheet: { width: GLOBE * COLUMNS, height: GLOBE * ROWS },
  pin: { position: 'absolute', left: (GLOBE - PIN_WIDTH) / 2, top: GLOBE / 2 - PIN_HEIGHT },
})

/**
 * The product's globe, turning, where the map will be (`motion`, *The map's
 * waiting area shows the turning globe*).
 *
 * `assets/globe.png` is 72 frames of one turn in a 9 × 8 grid, cut by
 * `.github/scripts/icon-globe.mjs` at three times this size. A clipped window
 * the size of one frame is moved across it frame by frame, at a constant speed,
 * one full turn per `DURATION.turn` — the same sheet, layout and speed the
 * laptop steps through with CSS.
 *
 * The pin is drawn on top from the mark's own definition, the teardrop with its
 * hole knocked out, so the globe turns behind the hole. Its colour is the
 * mark's, the same on both grounds. With reduce motion on, nothing turns: the
 * first frame stands still.
 */
function Globe() {
  const reduce = useReducedMotion()
  const turn = useSharedValue(0)

  useEffect(() => {
    if (reduce) return
    turn.value = withRepeat(
      withTiming(FRAMES, { duration: DURATION.turn, easing: Easing.bezier(...EASING.linear) }),
      -1,
    )
    return () => cancelAnimation(turn)
  }, [reduce, turn])

  const step = useAnimatedStyle(() => {
    const frame = Math.floor(turn.value) % FRAMES
    return {
      transform: [
        { translateX: -(frame % COLUMNS) * GLOBE },
        { translateY: -Math.floor(frame / COLUMNS) * GLOBE },
      ],
    }
  })

  return (
    <View style={styles.globe} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <View style={styles.sphere}>
        <Animated.Image source={require('../assets/globe.png')} style={[styles.sheet, step]} />
      </View>
      <Svg
        width={PIN_WIDTH}
        height={PIN_HEIGHT}
        viewBox={`0 0 ${MARKER_SIZE.width} ${MARKER_SIZE.height}`}
        style={styles.pin}
      >
        {/* The outline first, in the sphere's own amber, then the pin over it.
            Over the sphere the outline disappears into it; where the head rises
            above the sphere it traces the pin against the ground — which on the
            dark ground is nearly the pin's own colour, and the head was lost in
            it. The same drawing on both grounds, as the mark is. */}
        <Path
          d={`${MARKER_PATH} ${HOLE_PATH}`}
          fill="none"
          stroke={COLOUR.accent.light}
          strokeWidth={PIN_OUTLINE}
          strokeLinejoin="round"
        />
        <Path d={`${MARKER_PATH} ${HOLE_PATH}`} fill={COLOUR.inkOnAccent.light} fillRule="evenodd" />
      </Svg>
    </View>
  )
}

export function LoadingState({
  label = message('loading.map'),
}: {
  /**
   * What is being waited for, as the whole sentence rather than a noun dropped
   * into one — `Loading {what}…` holds together in English only.
   */
  label?: Message
}) {
  const theme = useTheme()
  const say = useSay()

  return (
    <View style={styles.panel}>
      <Globe />
      {/* Words as well as motion: an animation on its own is indistinguishable
          from a stalled one, and this is the state most often mistaken for
          emptiness. */}
      <Text style={[styles.muted, { color: theme.colour.inkMuted }]}>
        {say(label)}
      </Text>
    </View>
  )
}

export function FailedState({
  message,
  children,
}: {
  message: string
  children?: ReactNode
}) {
  const theme = useTheme()

  return (
    <View
      style={[
        styles.panel,
        styles.failed,
        {
          backgroundColor: theme.colour.dangerSurface,
          borderColor: theme.colour.danger,
        },
      ]}
    >
      <Text style={[styles.failedText, { color: theme.colour.danger }]}>
        {message}
      </Text>
      {children}
    </View>
  )
}

export function EmptyState({ children }: { children: ReactNode }) {
  const theme = useTheme()

  return (
    <View style={styles.panel}>
      <Text style={[styles.muted, { color: theme.colour.inkMuted }]}>{children}</Text>
    </View>
  )
}
