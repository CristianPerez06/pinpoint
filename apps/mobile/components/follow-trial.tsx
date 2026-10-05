import {
  Camera,
  GeoJSONSource,
  Layer,
  Map,
  type CameraRef,
  type CircleLayerSpecification,
  type LineLayerSpecification,
  type StyleSpecification,
} from '@maplibre/maplibre-react-native'
import { formatWalkingDistance } from '@pinpoint/core'
import {
  ATTRIBUTION,
  LOCATION_SOURCE,
  locationFeature,
  locationLayers,
  ROUTE_SOURCE,
  routeFeature,
  routeLayers,
  type LngLat,
  type TravelMode,
} from '@pinpoint/map'
import { STADIA_ENDPOINT } from '@pinpoint/routing'
import { SPACE, TYPE } from '@pinpoint/tokens'
import { message } from '@pinpoint/wording'
import {
  FerrostarProvider,
  SimulatedLocationProvider,
  useFerrostar,
  useNavigationState,
  withJsonOptions,
  type RouteProvider,
} from '@stadiamaps/ferrostar-core-react-native'
import {
  CourseFiltering,
  RouteDeviation,
  RouteDeviationTracking,
  stepAdvanceDistanceEntryAndExit,
  stepAdvanceDistanceToEndOfStep,
  WaypointAdvanceMode,
  WaypointKind,
  WellKnownRouteProvider,
  type UserLocation,
} from '@stadiamaps/ferrostar-uniffi-react-native'
import * as Location from 'expo-location'
import { useEffect, useMemo, useRef, useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { Button } from '@/components/ui'
import { useThemedBasemap } from '@/lib/basemap'
import { config } from '@/lib/config'
import { useLanguage, useSay } from '@/lib/language'
import { useTheme, useThemeMode } from '@/lib/theme'
import { role } from '@/lib/type'

/**
 * The trial behind `app/dev/follow.tsx` — see there for what it is and how to
 * open it.
 *
 * Its own module, loaded only when that screen opens, because importing
 * Ferrostar is not free: it installs its compiled core into the JavaScript
 * engine as the module is evaluated, and every screen file is evaluated when the
 * app starts. Kept here, nothing of Ferrostar runs for anyone who never opens
 * the trial.
 */
/** Valhalla's name for each way of travelling, as `@pinpoint/routing` asks it. */
const COSTING: Readonly<Record<TravelMode, string>> = {
  walk: 'pedestrian',
  bike: 'bicycle',
  car: 'auto',
}

/** Valhalla's narrative languages for the two the product speaks. */
const NARRATIVE = { en: 'en-US', es: 'es-ES' } as const

/**
 * When a step counts as done and when the person counts as off the route.
 * Ferrostar's example values; tuning them is #279's.
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
 * Seconds between two automatic requests for a new route. `place-route` allows
 * one a second from a device; this stays well clear of it.
 */
const RECALCULATE_AFTER_S = 5

/** How far "Leave the route" moves the simulated position, sideways to it. */
const LEAVE_BY_M = 150

export default function FollowTrial({
  to,
  mode,
}: {
  to: LngLat | null
  mode: TravelMode
}) {
  const language = useLanguage()

  /**
   * One provider for both kinds of position. Ferrostar's simulated one walks a
   * route by itself once given one, and otherwise passes on whatever it is
   * handed — which is how the device's own position reaches it.
   */
  const locationProvider = useMemo(() => new SimulatedLocationProvider(), [])
  useEffect(() => () => locationProvider.stop(), [locationProvider])

  /**
   * Stadia only, with the key both applications use. Ferrostar's own Valhalla
   * adapter, because it needs the turn-by-turn steps `@pinpoint/routing` does
   * not keep. Falling back to FOSSGIS while following is #279's to decide.
   */
  const routeProvider = useMemo<RouteProvider>(
    () => ({
      kind: 'adapter',
      provider: withJsonOptions(
        WellKnownRouteProvider.Valhalla.new({
          endpointUrl: `${STADIA_ENDPOINT}?api_key=${encodeURIComponent(config.stadia.apiKey)}`,
          profile: COSTING[mode],
          optionsJson: undefined,
        }),
        { language: NARRATIVE[language] },
      ),
    }),
    [mode, language],
  )

  return (
    <FerrostarProvider
      config={NAVIGATION}
      routeProvider={routeProvider}
      locationProvider={locationProvider}
    >
      <Trial to={to} locationProvider={locationProvider} />
    </FerrostarProvider>
  )
}

type Phase = 'idle' | 'finding' | 'none' | 'following'

function Trial({
  to,
  locationProvider,
}: {
  to: LngLat | null
  locationProvider: SimulatedLocationProvider
}) {
  const core = useFerrostar()
  const state = useNavigationState(core)
  const say = useSay()
  const language = useLanguage()
  const mode = useThemeMode()
  const theme = useTheme()
  const basemap = useThemedBasemap(mode)
  const insets = useSafeAreaInsets()
  const cameraRef = useRef<CameraRef>(null)

  const [phase, setPhase] = useState<Phase>('idle')
  const [simulating, setSimulating] = useState(true)
  const simulatingRef = useRef(simulating)
  useEffect(() => {
    simulatingRef.current = simulating
  }, [simulating])

  useEffect(
    () => configure(core, () => (simulatingRef.current ? locationProvider : null)),
    [core, locationProvider],
  )

  // The device's position, for as long as the screen is open. While the
  // simulation runs the provider ignores it.
  useEffect(() => {
    let subscription: Location.LocationSubscription | null = null
    let live = true
    void (async () => {
      const { granted } = await Location.requestForegroundPermissionsAsync()
      if (!granted || !live) return
      subscription = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.BestForNavigation, distanceInterval: 2 },
        (position) => locationProvider.updateLocation(userLocationOf(position)),
      )
      if (!live) subscription.remove()
    })()
    return () => {
      live = false
      subscription?.remove()
    }
  }, [locationProvider])

  const here = state.location?.coordinates ?? null


  // Keep the person in view.
  useEffect(() => {
    if (!here || phase !== 'following') return
    cameraRef.current?.easeTo({ center: [here.lng, here.lat], zoom: 16, duration: 600 })
  }, [here?.lng, here?.lat, phase]) // eslint-disable-line react-hooks/exhaustive-deps

  async function start() {
    const from = locationProvider.getSnapshot().location
    if (!to || !from) return
    setPhase('finding')
    try {
      const routes = await core.getRoutes(from, [
        { coordinate: { lat: to.lat, lng: to.lng }, kind: WaypointKind.Break },
      ])
      const route = routes[0]
      if (!route) {
        setPhase('none')
        return
      }
      core.startNavigation(route)
      if (simulating) locationProvider.setRoute(route)
      setPhase('following')
    } catch {
      setPhase('none')
    }
  }

  function stop() {
    if (standing.current) clearInterval(standing.current)
    locationProvider.stop()
    core.stopNavigation()
    setPhase('idle')
  }

  /**
   * Steps sideways off the line and stays there, so Ferrostar sees the person
   * leave it. Stays, rather than reporting once: Ferrostar only reconsiders the
   * route when a position arrives, so a single report landing inside its wait
   * between requests would never be looked at again. A phone keeps reporting;
   * this does too, once a second, until the new route restarts the simulation —
   * which then ignores these.
   */
  const standing = useRef<ReturnType<typeof setInterval> | null>(null)
  function leave() {
    const at = locationProvider.getSnapshot().location
    if (!at) return
    const off = sideways(at, LEAVE_BY_M)
    locationProvider.stop()
    locationProvider.updateLocation(off)
    if (standing.current) clearInterval(standing.current)
    standing.current = setInterval(
      () => locationProvider.updateLocation({ ...off, timestamp: new Date() }),
      1000,
    )
  }
  useEffect(() => () => {
    if (standing.current) clearInterval(standing.current)
  }, [])

  function toggleSimulation() {
    if (simulating) locationProvider.stop()
    setSimulating(!simulating)
  }

  const line = state.routeGeometry?.map((point) => ({ lng: point.lng, lat: point.lat }))
  const instruction = state.visualInstruction?.primaryContent.text
  const toTurn = state.progress?.distanceToNextManeuver

  const status = !to
    ? message('trial.follow.noDestination')
    : phase === 'finding'
      ? message('trial.follow.finding')
      : phase === 'none'
        ? message('trial.follow.none')
        : state.isCalculatingNewRoute ||
            (phase === 'following' && RouteDeviation.Deviation.instanceOf(state.routeDeviation))
          ? message('trial.follow.offRoute')
          : null

  return (
    <View style={[styles.screen, { backgroundColor: theme.colour.ground }]}>
      {basemap.style ? (
        <Map
          style={styles.map}
          mapStyle={basemap.style as unknown as StyleSpecification}
          attribution={false}
          logo={false}
        >
          <Camera
            ref={cameraRef}
            initialViewState={to ? { center: [to.lng, to.lat], zoom: 14 } : undefined}
          />
          {line && line.length > 1 ? (
            <GeoJSONSource id={ROUTE_SOURCE} data={routeFeature(line)}>
              {routeLayers(mode, 'street').map((layer) => (
                <Layer
                  key={layer.id}
                  id={layer.id}
                  type="line"
                  layout={layer.layout as LineLayerSpecification['layout']}
                  paint={layer.paint as LineLayerSpecification['paint']}
                />
              ))}
            </GeoJSONSource>
          ) : null}
          {here ? (
            <GeoJSONSource id={LOCATION_SOURCE} data={locationFeature(here)}>
              {locationLayers(
                { ...here, accuracy: state.location?.horizontalAccuracy ?? null },
                mode,
              ).map((layer) => (
                <Layer
                  key={layer.id}
                  id={layer.id}
                  type="circle"
                  paint={layer.paint as CircleLayerSpecification['paint']}
                />
              ))}
            </GeoJSONSource>
          ) : null}
        </Map>
      ) : (
        <View style={styles.map} />
      )}

      <View
        style={[
          styles.panel,
          {
            backgroundColor: theme.colour.surface,
            borderTopColor: theme.colour.line,
            paddingBottom: insets.bottom + SPACE.md,
          },
        ]}
      >
        {phase === 'following' && instruction ? (
          <Text style={[styles.instruction, { color: theme.colour.ink }]}>{instruction}</Text>
        ) : null}
        {phase === 'following' && toTurn !== undefined ? (
          <Text style={[styles.note, { color: theme.colour.inkMuted }]}>
            {say(
              message('trial.follow.toTurn', {
                distance: say(formatWalkingDistance(language, toTurn / 1000)),
              }),
            )}
          </Text>
        ) : null}
        {status ? (
          <Text style={[styles.note, { color: theme.colour.inkMuted }]}>{say(status)}</Text>
        ) : null}

        <View style={styles.actions}>
          {phase === 'following' ? (
            <Button label={say(message('trial.follow.stop'))} onPress={stop} />
          ) : (
            <Button
              label={say(message('trial.follow.start'))}
              tone="primary"
              disabled={!to || phase === 'finding'}
              onPress={() => void start()}
            />
          )}
          <Button
            label={say(message(simulating ? 'trial.follow.real' : 'trial.follow.simulate'))}
            disabled={phase === 'following'}
            onPress={toggleSimulation}
          />
          {phase === 'following' && simulating ? (
            <Button label={say(message('trial.follow.leave'))} onPress={leave} />
          ) : null}
        </View>

        <Text style={[styles.credit, { color: theme.colour.inkMuted }]}>{ATTRIBUTION}</Text>
      </View>
    </View>
  )
}

/**
 * Ferrostar's settings that are properties of the core rather than props of
 * its provider. A new route after leaving the old one replaces it, and the
 * simulation, if one is running, carries on along the new one.
 */
function configure(
  core: ReturnType<typeof useFerrostar>,
  simulation: () => SimulatedLocationProvider | null,
) {
  core.minimumTimeBeforeRecalculation = RECALCULATE_AFTER_S
  core.alternativeRouteProcessor = {
    loadedAlternativeRoutes(on, routes) {
      const route = routes[0]
      if (!route) return
      on.replaceRoute(route)
      simulation()?.setRoute(route)
    },
  }
}

function userLocationOf(position: Location.LocationObject): UserLocation {
  return {
    coordinates: { lat: position.coords.latitude, lng: position.coords.longitude },
    horizontalAccuracy: position.coords.accuracy ?? 0,
    courseOverGround: undefined,
    speed: undefined,
    timestamp: new Date(position.timestamp),
  }
}

/**
 * A point `metres` to the right of the direction of travel, or north of the
 * position when there is no direction yet. Flat-earth arithmetic, which is
 * exact enough over a hundred and fifty metres.
 */
function sideways(at: UserLocation, metres: number): UserLocation {
  const course = at.courseOverGround?.degrees
  const bearing = ((course === undefined ? -90 : course) + 90) * (Math.PI / 180)
  const lat = at.coordinates.lat
  const perDegree = 111_320
  return {
    ...at,
    coordinates: {
      lat: lat + (metres * Math.cos(bearing)) / perDegree,
      lng: at.coordinates.lng + (metres * Math.sin(bearing)) / (perDegree * Math.cos((lat * Math.PI) / 180)),
    },
    horizontalAccuracy: 5,
    timestamp: new Date(),
  }
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  map: { flex: 1 },
  panel: {
    paddingHorizontal: SPACE.lg,
    paddingTop: SPACE.md,
    gap: SPACE.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  instruction: role(TYPE.title),
  note: role(TYPE.note),
  credit: role(TYPE.note),
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACE.sm },
})
