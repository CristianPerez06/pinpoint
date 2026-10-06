import { formatClock, formatTimeLeft, formatWalkingDistance } from '@pinpoint/core'
import type { Fix, LngLat, TravelMode } from '@pinpoint/map'
import { ELEVATION, RADIUS, SPACE, TYPE } from '@pinpoint/tokens'
import { message } from '@pinpoint/wording'
import {
  FerrostarProvider,
  ManualLocationProvider,
  useFerrostar,
  useNavigationState,
} from '@stadiamaps/ferrostar-core-react-native'
import {
  CourseFiltering,
  RouteDeviation,
  RouteDeviationTracking,
  stepAdvanceDistanceEntryAndExit,
  stepAdvanceDistanceToEndOfStep,
  TripState,
  WaypointAdvanceMode,
  WaypointKind,
  type UserLocation,
} from '@stadiamaps/ferrostar-uniffi-react-native'
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake'
import * as Location from 'expo-location'
import { createElement, useEffect, useMemo, useRef, useState } from 'react'
import {
  AccessibilityInfo,
  AppState,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { routeProvider } from '@/components/following/route-provider'
import { turnGlyph } from '@/components/following/turn-glyph'
import { useOnline } from '@/lib/connectivity'
import { useLanguage, useSay } from '@/lib/language'
import { useTheme, useThemeMode } from '@/lib/theme'
import { role } from '@/lib/type'

/**
 * Following a route on the phone (`route-following`).
 *
 * Ferrostar does the tracking: where the person is along the line, the next
 * turn, noticing they have left the route and asking for a new one. Everything
 * drawn is ours, and the map is the one already on screen — this view draws the
 * card at the top and the bar at the bottom, and hands the line and the
 * person's position up for the map to draw and the camera to follow.
 *
 * Loaded by the map with `lazy()` and nowhere else: evaluating Ferrostar
 * installs its compiled core into the JavaScript engine, and that must not
 * happen until *Start* is pressed (*Calculating a route never restarts the
 * application*). The lint rule in `eslint.config.js` keeps it that way.
 */

/**
 * When a step counts as done, when the person counts as off the route, and
 * when they have arrived. Ferrostar's own example values, proven in #282; to be
 * tuned on a real walk rather than at a desk.
 */
const NAVIGATION = {
  waypointAdvance: new WaypointAdvanceMode.WaypointWithinRange(100),
  stepAdvanceCondition: stepAdvanceDistanceEntryAndExit(30, 5, 32),
  arrivalStepAdvanceCondition: stepAdvanceDistanceToEndOfStep(10, 32),
  routeDeviationTracking: new RouteDeviationTracking.StaticThreshold({
    minimumHorizontalAccuracy: 15,
    maxAcceptableDeviation: 50,
  }),
  snappedLocationCourseFiltering: CourseFiltering.SnapToRoute,
}

/**
 * Seconds between two requests for a new route while the person stays off the
 * route. `route-following` allows one every five; `place-route`'s ceiling of
 * one a second is well clear.
 */
const RECALCULATE_AFTER_S = 5

/** What the map draws while following. */
export interface FollowProgress {
  /** The route being followed, which a new route replaces. */
  line: LngLat[] | null
  /** Where Ferrostar places the person, for the camera to keep in view. */
  here: LngLat | null
}

export interface FollowViewProps {
  to: LngLat
  mode: TravelMode
  /** The place's name, as the person wrote it. */
  name: string
  /** Where the person was when *Start* was pressed. */
  from: Fix
  /** The route came back and following has begun. */
  onStarted: () => void
  /** No route came back; the map stays as it was. */
  onCannotStart: () => void
  /** Following is over: arrived, or *Stop* pressed. */
  onEnd: (arrived: boolean) => void
  onProgress: (progress: FollowProgress) => void
  /** How much of the screen the card and the bar cover, for the camera. */
  onCovered: (covered: { top: number; bottom: number }) => void
}

export default function FollowView(props: FollowViewProps) {
  const language = useLanguage()
  const locationProvider = useMemo(() => new ManualLocationProvider(), [])
  // Fixed for the trip: a new way of travelling or language is a new trip.
  const [provider] = useState(() => routeProvider(props.mode, language))

  return (
    <FerrostarProvider
      config={NAVIGATION}
      routeProvider={provider}
      locationProvider={locationProvider}
    >
      <Following {...props} locationProvider={locationProvider} />
    </FerrostarProvider>
  )
}

type Phase = 'starting' | 'following'

function Following({
  to,
  name,
  from,
  onStarted,
  onCannotStart,
  onEnd,
  onProgress,
  onCovered,
  locationProvider,
}: FollowViewProps & { locationProvider: ManualLocationProvider }) {
  const core = useFerrostar()
  const state = useNavigationState(core)
  const theme = useTheme()
  const themeMode = useThemeMode()
  const say = useSay()
  const language = useLanguage()
  const insets = useSafeAreaInsets()

  const [phase, setPhase] = useState<Phase>('starting')
  // The callbacks change identity every render of the map; the effects below
  // run once per trip, so they read the latest through a ref.
  const handlers = useRef({ onStarted, onCannotStart, onEnd, onProgress, onCovered })
  useEffect(() => {
    handlers.current = { onStarted, onCannotStart, onEnd, onProgress, onCovered }
  })

  useEffect(() => configure(core), [core])

  // The route with its turns, from where the person was when *Start* was
  // pressed, and then following. Stopped however this view goes.
  useEffect(() => {
    let live = true
    const start = userLocationOf(from, new Date())
    locationProvider.updateLocation(start)
    void core
      .getRoutes(start, [{ coordinate: { lat: to.lat, lng: to.lng }, kind: WaypointKind.Break }])
      .then((routes) => {
        if (!live) return
        const route = routes[0]
        if (!route) {
          handlers.current.onCannotStart()
          return
        }
        core.startNavigation(route)
        setPhase('following')
        handlers.current.onStarted()
      })
      .catch(() => {
        if (live) handlers.current.onCannotStart()
      })
    return () => {
      live = false
      core.stopNavigation()
    }
    // Once per trip: the map mounts a new view for a new one.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // The device's position, at navigation accuracy, only while the app is in
  // the foreground (`device-location`): dropped on the way to the background,
  // asked for again on the way back, when Ferrostar carries on from wherever
  // the person is then.
  useEffect(() => {
    let subscription: Location.LocationSubscription | null = null
    let live = true
    const watch = async () => {
      if (subscription) return
      try {
        // Every fix, not only every few metres moved: arriving and passing a turn
        // are noticed on a position, and somebody who stops at the place sends
        // no more under a distance filter — so following never ended.
        const next = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.BestForNavigation, distanceInterval: 0, timeInterval: 1000 },
          (position) => locationProvider.updateLocation(userLocationOfPosition(position)),
        )
        if (!live || AppState.currentState !== 'active') next.remove()
        else subscription = next
      } catch {
        // Permission withdrawn in Settings mid-trip. The last position stands;
        // *Stop* is still there.
      }
    }
    void watch()
    const changes = AppState.addEventListener('change', (next) => {
      if (next === 'active') void watch()
      else if (next === 'background') {
        subscription?.remove()
        subscription = null
      }
    })
    return () => {
      live = false
      changes.remove()
      subscription?.remove()
    }
  }, [locationProvider])

  // The screen stays on while following, and only then.
  useEffect(() => {
    if (phase !== 'following') return
    void activateKeepAwakeAsync('following')
    return () => {
      deactivateKeepAwake('following')
    }
  }, [phase])

  // Arriving ends following, once. The map takes this view away when told.
  const tripState = state && core._state.tripState
  const arrived = tripState !== undefined && TripState.Complete.instanceOf(tripState)
  const ended = useRef(false)
  useEffect(() => {
    if (phase !== 'following' || !arrived || ended.current) return
    ended.current = true
    handlers.current.onEnd(true)
  }, [phase, arrived])

  const here = state.location?.coordinates ?? null
  const line = useMemo(
    () => state.routeGeometry?.map((point) => ({ lng: point.lng, lat: point.lat })) ?? null,
    [state.routeGeometry],
  )
  useEffect(() => {
    // Not once following has ended: a last move of the camera here would land
    // after the map has turned it to the place, and put the place behind its
    // details.
    if (phase !== 'following' || ended.current) return
    handlers.current.onProgress({ line, here: here ? { lng: here.lng, lat: here.lat } : null })
  }, [phase, line, here?.lng, here?.lat]) // eslint-disable-line react-hooks/exhaustive-deps

  // Off the route: finding a new one, or having found none yet. "None yet" is
  // a request that finished while the person was still off the route — the
  // line it would have replaced is the one still drawn.
  const off =
    state.routeDeviation !== undefined && RouteDeviation.Deviation.instanceOf(state.routeDeviation)
  const finding = Boolean(state.isCalculatingNewRoute)
  const [noneYet, setNoneYet] = useState(false)
  // Adjusted while rendering, as React recommends for state that follows
  // another value, so no frame shows the wrong sentence.
  const [seen, setSeen] = useState({ off, finding })
  if (seen.off !== off || seen.finding !== finding) {
    setSeen({ off, finding })
    setNoneYet(off && (noneYet || (seen.finding && !finding)))
  }

  // The arrival time is a clock reading, so it is read from a clock that ticks
  // rather than during drawing. Every fifteen seconds is finer than the minute
  // it is written to.
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const tick = setInterval(() => setNow(Date.now()), 15_000)
    return () => clearInterval(tick)
  }, [])

  // A screen reader is told each new instruction as it replaces the last.
  const instruction = state.visualInstruction?.primaryContent
  /**
   * The routing service's sentence for the next turn (`route-following`).
   *
   * Not the visual instruction's text, which is what the service gives for a
   * road sign: for a named road that is the road's name alone ("団栗通; Donguri
   * Street"), which says where but not what to do. The sentence lives on the step
   * the turn begins — the second of the steps left, the first being the stretch
   * the person is on. The sign's text stands in where there is no such step.
   */
  const sentence = state.remainingSteps?.[1]?.instruction || instruction?.text
  const toTurn = state.progress?.distanceToNextManeuver
  const toTurnText =
    toTurn === undefined ? null : say(formatWalkingDistance(language, toTurn / 1000))
  useEffect(() => {
    if (phase !== 'following' || !sentence || toTurnText === null) return
    AccessibilityInfo.announceForAccessibility(
      say(message('follow.nextTurnSpoken', { distance: toTurnText, instruction: sentence })),
    )
    // On a new instruction only, not on every metre.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, sentence])

  // The connection back while the person is still off the route: a new route at
  // once. Ferrostar reconsiders only when a position arrives, and not within
  // 50 m of where it last asked, so somebody standing still would otherwise go
  // on reading "no new route yet" with a connection (`route-following`). Asked
  // through Ferrostar's own request, so the same services and limits hold.
  const online = useOnline()
  const wasOnline = useRef(online)
  useEffect(() => {
    const back = online && !wasOnline.current
    wasOnline.current = online
    if (!back || phase !== 'following' || ended.current || core.isCalculatingNewRoute) return
    const trip = core._state.tripState
    const at = locationProvider.getSnapshot().location
    if (!at || !trip || !TripState.Navigating.instanceOf(trip)) return
    if (!RouteDeviation.Deviation.instanceOf(trip.inner.deviation)) return
    void core.getRoutes(at, trip.inner.remainingWaypoints).then((routes) => {
      const route = routes[0]
      if (route && !ended.current) core.replaceRoute(route)
    })
  }, [online, phase, core, locationProvider])

  const [covered, setCovered] = useState({ top: 0, bottom: 0 })
  useEffect(() => {
    handlers.current.onCovered(covered)
  }, [covered])

  if (phase !== 'following') return null

  const glyph = turnGlyph(instruction?.maneuverType, instruction?.maneuverModifier, state.drivingSide)
  const progress = state.progress
  const left = progress
    ? say(
        message('follow.left', {
          time: say(formatTimeLeft(language, progress.durationRemaining / 60)),
          distance: say(formatWalkingDistance(language, progress.distanceRemaining / 1000)),
        }),
      )
    : null
  const arrive = progress
    ? say(
        message('follow.arrive', {
          time: formatClock(new Date(now + progress.durationRemaining * 1000)),
        }),
      )
    : null
  const shadow = {
    shadowColor: ELEVATION.md.colour[themeMode],
    shadowOffset: { width: 0, height: ELEVATION.md.offsetY },
    shadowOpacity: 1,
    shadowRadius: ELEVATION.md.blur,
    elevation: ELEVATION.md.offsetY,
  }

  // Nothing to say about the next turn — the moment before arriving, when the
  // last step has been passed — and no card rather than an arrow on its own.
  const saysSomething = off || Boolean(sentence) || toTurnText !== null

  return (
    <>
      {saysSomething ? (
        <View
          onLayout={(event) => {
            const { y, height } = event.nativeEvent.layout
            setCovered((was) => ({ ...was, top: y + height }))
          }}
          style={[
            styles.card,
            shadow,
            { top: insets.top + SPACE.sm, backgroundColor: theme.colour.surface },
          ]}
          accessibilityLiveRegion="polite"
        >
          {off ? (
            <Text style={[styles.offRoute, { color: theme.colour.ink }]}>
              {say(message(noneYet && !finding ? 'follow.offRouteNone' : 'follow.offRoute'))}
            </Text>
          ) : (
            <>
              {/* The fill and its glyph set together, so no ground leaves the
                  arrow the colour of what it sits on. */}
              <View style={[styles.glyph, { backgroundColor: theme.colour.ink }]}>
                {createElement(glyph, { size: 26, color: theme.colour.surface, strokeWidth: 2.4 })}
              </View>
              <View style={styles.turnText}>
                {toTurnText !== null ? (
                  <Text style={[styles.toTurn, { color: theme.colour.ink }]}>{toTurnText}</Text>
              ) : null}
              {sentence ? (
                // The routing service's own words, in the language it was asked
                // for (`product-wording`).
                <Text style={[styles.instruction, { color: theme.colour.ink }]}>
                  {sentence}
                </Text>
              ) : null}
            </View>
          </>
        )}
      </View>
      ) : null}

      <View
        onLayout={(event) => {
          const { height } = event.nativeEvent.layout
          setCovered((was) => ({ ...was, bottom: height }))
        }}
        style={[
          styles.bar,
          shadow,
          { backgroundColor: theme.colour.surface, paddingBottom: insets.bottom + SPACE.md },
        ]}
      >
        <View style={styles.barText}>
          {left !== null ? (
            <Text style={[styles.left, { color: theme.colour.ink }]}>{left}</Text>
          ) : null}
          <Text style={[styles.where, { color: theme.colour.inkMuted }]} numberOfLines={1}>
            {arrive !== null ? `${name} · ${arrive}` : name}
          </Text>
        </View>
        <Pressable
          onPress={() => {
            if (ended.current) return
            ended.current = true
            onEnd(false)
          }}
          accessibilityRole="button"
          accessibilityLabel={say(message('follow.stopNamed', { name }))}
          style={({ pressed }) => [
            styles.stop,
            {
              borderColor: theme.colour.lineStrong,
              backgroundColor: pressed ? theme.colour.surfaceSunk : theme.colour.surface,
            },
          ]}
        >
          <Text style={[styles.stopText, { color: theme.colour.ink }]}>
            {say(message('follow.stop'))}
          </Text>
        </Pressable>
      </View>
    </>
  )
}

/**
 * Ferrostar's settings that are properties of the core rather than props of its
 * provider. A new route after leaving the old one replaces it, at most every
 * few seconds.
 */
function configure(core: ReturnType<typeof useFerrostar>) {
  core.minimumTimeBeforeRecalculation = RECALCULATE_AFTER_S
  core.alternativeRouteProcessor = {
    loadedAlternativeRoutes(on, routes) {
      const route = routes[0]
      if (route) on.replaceRoute(route)
    },
  }
}

/** A position for Ferrostar from one the map already holds. */
function userLocationOf(fix: Fix, at: Date): UserLocation {
  return {
    coordinates: { lat: fix.lat, lng: fix.lng },
    horizontalAccuracy: fix.accuracy ?? 0,
    courseOverGround: undefined,
    speed: undefined,
    timestamp: at,
  }
}

function userLocationOfPosition(position: Location.LocationObject): UserLocation {
  const { latitude, longitude, accuracy, heading } = position.coords
  return {
    coordinates: { lat: latitude, lng: longitude },
    horizontalAccuracy: accuracy ?? 0,
    // A negative heading is the platform saying it has none.
    courseOverGround:
      heading !== null && heading >= 0 ? { degrees: Math.round(heading), accuracy: 0 } : undefined,
    speed: undefined,
    timestamp: new Date(position.timestamp),
  }
}

const styles = StyleSheet.create({
  card: {
    position: 'absolute',
    left: SPACE.sm,
    right: SPACE.sm,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    borderRadius: RADIUS.lg,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  glyph: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  turnText: { flex: 1, minWidth: 0 },
  toTurn: { ...role(TYPE.display), fontSize: 26, lineHeight: 30 },
  instruction: { ...role(TYPE.rowName), fontSize: 15, lineHeight: 20, marginTop: 2 },
  offRoute: { ...role(TYPE.rowName), fontSize: 15, lineHeight: 20, flex: 1 },
  bar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderTopLeftRadius: RADIUS.lg,
    borderTopRightRadius: RADIUS.lg,
    paddingTop: 12,
    paddingHorizontal: SPACE.md,
  },
  barText: { flex: 1, minWidth: 0 },
  left: { ...role(TYPE.rowName) },
  where: { ...role(TYPE.note) },
  stop: {
    minHeight: 44,
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: RADIUS.pill,
    paddingHorizontal: 18,
  },
  stopText: { ...role(TYPE.control), fontWeight: '700' },
})
