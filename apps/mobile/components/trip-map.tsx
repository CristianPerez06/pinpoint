import { Camera, Map, Marker as MapLibreMarker } from '@maplibre/maplibre-react-native'
import type { Marker } from '@pinpoint/core'
import {
  ATTRIBUTION,
  fitBounds,
  groupCoincident,
  styleUrl,
  type MarkerGroup,
  type Viewport,
} from '@pinpoint/map'
import {
  COLOUR,
  MARKER_BADGE_SIZE,
  MARKER_FOREGROUND,
  MARKER_SIZE,
  RADIUS,
  SPACE,
} from '@pinpoint/tokens'
import { useMemo, useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'

import { MarkerDetails, type Selection } from '@/components/marker-details'

/**
 * The native half of the portability boundary — and the thing this whole change
 * was built to find out.
 *
 * It works. `mapStyle` on `Map` is typed `string | StyleSpecification`, so the
 * same `styleUrl()` that web hands to `maplibre-gl` goes straight in here. No
 * fetching a style document, no per-platform patching, no second style source
 * to keep in step. The camera arrives the same way: `fitBounds` returns
 * `{ center, zoom }` and `initialViewState` takes exactly that.
 *
 * What differs is everything about drawing, which is where it was always
 * supposed to differ: `Map` and `Camera` components instead of a constructor,
 * `Marker` wrapping a `View` instead of an HTMLElement, `StyleSheet` instead of
 * inline CSS. None of that reaches a shared package.
 */

const styles = StyleSheet.create({
  fill: { flex: 1 },
  pinContainer: {
    width: MARKER_SIZE,
    height: MARKER_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pin: {
    width: MARKER_SIZE,
    height: MARKER_SIZE,
    borderRadius: RADIUS.pill,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinIcon: { fontSize: Math.round(MARKER_SIZE * 0.5) },
  badge: {
    position: 'absolute',
    top: -SPACE.xs,
    right: -SPACE.xs,
    minWidth: MARKER_BADGE_SIZE,
    height: MARKER_BADGE_SIZE,
    borderRadius: RADIUS.pill,
    backgroundColor: COLOUR.text,
    borderWidth: 1,
    borderColor: MARKER_FOREGROUND,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: { color: MARKER_FOREGROUND, fontSize: 11, fontWeight: '700' },
  attribution: {
    position: 'absolute',
    left: SPACE.sm,
    bottom: SPACE.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACE.xs,
    paddingVertical: 2,
  },
  attributionText: { fontSize: 10, color: COLOUR.text },
})

export function TripMap({
  markers,
  currencyOf,
}: {
  markers: readonly Marker[]
  /** Passed straight through to the details sheet; the map itself has no use for it. */
  currencyOf: (marker: Marker) => string | null
}) {
  const [selection, setSelection] = useState<Selection | null>(null)

  /**
   * Measured once and then frozen. `onLayout` fires again on rotation, and
   * re-framing then would drag the view back from wherever it had been panned
   * to — framing happens on opening and never afterwards.
   */
  const [viewport, setViewport] = useState<Viewport | null>(null)

  const groups = useMemo(() => groupCoincident([...markers]), [markers])
  const camera = useMemo(
    () => (viewport ? fitBounds([...markers], { viewport }) : null),
    // Deliberately not depending on `markers`: the frame is decided by the
    // markers present when the surface was first measured.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [viewport],
  )

  return (
    <View
      style={styles.fill}
      onLayout={(event) => {
        if (viewport) return
        const { width, height } = event.nativeEvent.layout
        if (width > 0 && height > 0) setViewport({ width, height })
      }}
    >
      <Map
        style={styles.fill}
        mapStyle={styleUrl()}
        // The native attribution control is an "i" button that says nothing
        // until it is pressed. It stays on because it opens the full notice,
        // but the visible credit below is what satisfies the licence.
        attribution
        //
        // Deliberately NO `onPress` here to dismiss the sheet. On iOS the
        // annotation carries its own tap recogniser (MLRNPointAnnotation
        // `_handleTap`) and the map view carries another; a single tap on a
        // pin can fire both. A map-level handler that cleared the selection
        // therefore undid the one the marker had just set, and tapping a pin
        // did nothing at all — no sheet, no error, no clue.
        //
        // Dismissal is the sheet's own close button, which is what the
        // specification asks for. Tap-to-dismiss can come back if it is ever
        // worth making the two recognisers agree.
      >
        {camera ? (
          // Initial state, not a controlled camera: a controlled one would
          // re-apply on every render and fight the person panning.
          <Camera
            initialViewState={{
              center: [camera.center.lng, camera.center.lat],
              zoom: camera.zoom,
            }}
          />
        ) : null}

        {groups.map((group) => (
          <MapLibreMarker
            key={group.key}
            id={group.key}
            lngLat={[group.lng, group.lat]}
            onPress={() =>
              setSelection({ group, index: group.count === 1 ? 0 : null })
            }
          >
            <Pin group={group} />
          </MapLibreMarker>
        ))}
      </Map>

      {/* A licence condition, not a default. Drawn rather than relied upon. */}
      <View style={styles.attribution} pointerEvents="none">
        <Text style={styles.attributionText}>{ATTRIBUTION}</Text>
      </View>

      {selection ? (
        <MarkerDetails
          currencyOf={currencyOf}
          selection={selection}
          onChoose={(index) => setSelection({ ...selection, index })}
          onBack={() => setSelection({ ...selection, index: null })}
          // Nothing here touches the camera, so dismissing cannot move it.
          onDismiss={() => setSelection(null)}
        />
      ) : null}
    </View>
  )
}

/**
 * View-based, like web, and for the same reason: the icons are emoji, and a
 * symbol layer would need them rasterised into a per-platform sprite atlas —
 * producing output that differs between the two platforms it is meant to
 * unify. `Marker` places a real React Native view on the map projection, so the
 * emoji renders as the system draws it.
 *
 * No permanent label. Twenty names at city zoom overlap into unreadable text.
 */
function Pin({ group }: { group: MarkerGroup<Marker> }) {
  const { view } = group

  return (
    // Explicit size rather than sizing to content. The iOS annotation derives
    // its frame from this view and `_setCenterOffset:` bails out on a zero
    // width or height, which would leave the pin anchored wrong and its tap
    // target somewhere other than where it is drawn.
    <View style={styles.pinContainer}>
      <View
        style={[
          styles.pin,
          { backgroundColor: view.colour, borderColor: view.foreground },
        ]}
        accessibilityLabel={
          group.count > 1
            ? `${group.count} places here`
            : `${view.label} (${view.typeLabel})`
        }
      >
        <Text style={styles.pinIcon}>{view.icon}</Text>
      </View>

      {group.count > 1 ? (
        // The badge is the entire mechanism that stops the marker underneath
        // from being invisible forever — identical coordinates are the same
        // pixel at every zoom.
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{group.count}</Text>
        </View>
      ) : null}
    </View>
  )
}
