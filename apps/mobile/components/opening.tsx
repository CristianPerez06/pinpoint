import { EASING } from '@pinpoint/tokens'
import { message } from '@pinpoint/wording'
import { GLView, type ExpoWebGLRenderingContext } from 'expo-gl'
import * as SplashScreen from 'expo-splash-screen'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Image, StyleSheet, useWindowDimensions, View } from 'react-native'
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'

import { useSay } from '@/lib/language'
import { usePreferences } from '@/lib/preferences'
import { SPLASH_SPHERE_WIDTH, SPLASH_STAGE_WIDTH } from '@/lib/splash/geometry'
import { createScene, type SplashScene } from '@/lib/splash/scene'
import { animationEnd, exitDuration, pose, type OpeningVersion } from '@/lib/splash/timeline'
import { useTheme } from '@/lib/theme'

/*
 * The operating system's still launch image stays up until the opening has
 * drawn its first frame. Called here, at module scope, because a call from
 * inside a component can arrive after the operating system has already taken
 * the image down (`expo-splash-screen`'s own advice).
 */
void SplashScreen.preventAutoHideAsync().catch(() => {})

/**
 * If the 3D opening has not drawn within this long of the icon appearing,
 * something is wrong with 3D on this phone. The icon then stays as it is and
 * fades into the app, as it does with reduce motion on, rather than keeping
 * anybody waiting for an animation that is not coming.
 */
const FIRST_FRAME_DEADLINE = 2000

/**
 * The phone's opening: the icon turns into a 3D pin on a spinning globe, then
 * lifts away to show the app (`motion` spec).
 *
 * Drawn over the app rather than instead of it, so the app mounts and loads
 * underneath while the globe finishes — the opening never holds the loading
 * back. `ready` is the launch gate being open; `onDone` is called once the
 * opening has faded and can be unmounted.
 *
 * Which version plays is decided once, at mount: the full one on the first
 * launch of an install, the short one after that, and the still icon when
 * reduce motion is on.
 *
 * WHY THE HANDOVER HAS TWO STEPS
 *
 * The operating system's still image cannot wait for the 3D view's first
 * frame, because on Android the 3D view is not created until the app's own
 * window draws — which it does not while the system's launch screen is held
 * up. Each would wait for the other. So the system hands over to this
 * component's own copy of the icon, identical in size and place, and that copy
 * gives way to the 3D view once its first frame — which is the same icon — is
 * on screen. Neither step changes a pixel.
 */
export function Opening({ ready, onDone }: { ready: boolean; onDone: () => void }) {
  const reduceMotion = useReducedMotion()
  const { openingPlayed, markOpeningPlayed } = usePreferences()
  const [version] = useState<OpeningVersion>(() =>
    reduceMotion ? 'still' : openingPlayed ? 'short' : 'full',
  )
  const theme = useTheme()
  const say = useSay()
  const { width } = useWindowDimensions()
  const stage = Math.min(width, SPLASH_STAGE_WIDTH)
  const ground = theme.colour.ground

  const [ended, setEnded] = useState(version === 'still')
  const [drawing, setDrawing] = useState(false)

  // The icon is on screen: the system's copy can go, and the 3D view has its deadline.
  const iconShown = useRef(false)
  const onIconShown = useCallback(() => {
    if (iconShown.current) return
    iconShown.current = true
    SplashScreen.hide()
  }, [])
  useEffect(() => {
    if (version === 'still' || drawing) return
    const deadline = setTimeout(() => setEnded(true), FIRST_FRAME_DEADLINE)
    return () => clearTimeout(deadline)
  }, [version, drawing])

  // Leave once the animation has ended and the app is ready — whichever is later.
  const leaving = useSharedValue(0)
  useEffect(() => {
    if (!ended || !ready) return
    const duration = exitDuration(drawing ? version : 'still')
    leaving.value = withTiming(1, { duration, easing: Easing.bezier(...EASING.settle) })
    const done = setTimeout(onDone, duration)
    return () => clearTimeout(done)
  }, [ended, ready, version, drawing, leaving, onDone])

  // The globe lifts slightly as it fades. The still icon only fades.
  const lift = drawing ? 0.1 : 0
  const style = useAnimatedStyle(() => ({
    opacity: 1 - leaving.value,
    transform: [{ scale: 1 + lift * leaving.value }],
  }))

  const scene = useRef<SplashScene | null>(null)
  const frame = useRef(0)
  useEffect(
    () => () => {
      cancelAnimationFrame(frame.current)
      scene.current?.dispose()
    },
    [],
  )

  const onContextCreate = useCallback(
    (gl: ExpoWebGLRenderingContext) => {
      try {
        scene.current = createScene(gl, stage)
      } catch {
        // No 3D on this phone. The icon stays, and fades into the app.
        setEnded(true)
        return
      }
      const end = animationEnd(version)
      /*
       * The clock starts once the first frame is on screen, not when it was
       * asked for. Drawing the first frame includes preparing the phone's
       * shaders, and a clock already running through that would open on a
       * frame from partway through the animation.
       */
      let start: number | null = null
      const draw = () => {
        const t = start === null ? 0 : performance.now() - start
        scene.current?.draw(pose(version, Math.min(t, end)), ground)
        if (start === null) {
          start = performance.now()
          setDrawing(true)
        }
        if (t < end) {
          frame.current = requestAnimationFrame(draw)
          return
        }
        // The last frame stays on screen: the globe holds still until the app is ready.
        if (version === 'full') markOpeningPlayed()
        setEnded(true)
      }
      frame.current = requestAnimationFrame(draw)
    },
    [stage, version, ground, markOpeningPlayed],
  )

  return (
    <Animated.View
      style={[StyleSheet.absoluteFill, { backgroundColor: ground }, style]}
      accessible
      accessibilityLabel={say(message('app.name'))}
    >
      {/* Given up on (ended without ever drawing), the 3D view is taken away. */}
      {version !== 'still' && (drawing || !ended) ? (
        <View style={styles.centre}>
          <GLView style={{ width: stage, height: stage }} onContextCreate={onContextCreate} />
        </View>
      ) : null}
      {drawing ? null : (
        <View style={[StyleSheet.absoluteFill, styles.centre, { backgroundColor: ground }]}>
          <Image
            source={require('../assets/splash-icon.png')}
            style={styles.icon}
            onLoadEnd={onIconShown}
          />
        </View>
      )}
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  centre: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  icon: { width: SPLASH_SPHERE_WIDTH, height: SPLASH_SPHERE_WIDTH },
})
