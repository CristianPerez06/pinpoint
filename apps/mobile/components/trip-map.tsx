import {
  Camera,
  Map,
  Marker as MapLibreMarker,
  type Anchor,
  type StyleSpecification,
} from '@maplibre/maplibre-react-native'
import type { Marker } from '@pinpoint/core'
import {
  ATTRIBUTION,
  fitBounds,
  groupCoincident,
  type Viewport,
} from '@pinpoint/map'
import { RADIUS, SPACE } from '@pinpoint/tokens'
import { useMemo, useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'

import { MarkerDetails, type Selection } from '@/components/marker-details'
import { Pin } from '@/components/pin'
import { useThemedBasemap } from '@/lib/basemap'
import { useTheme, useThemeMode } from '@/lib/theme'

/**
 * The native half of the portability boundary — and the thing the map change
 * was built to find out.
 *
 * It works, with one correction to what it originally claimed. `mapStyle` is
 * typed `string | StyleSpecification`, so the same `styleUrl()` web used could
 * go straight in, and for a while that meant no fetching and no per-platform
 * patching. Theming ended that: OpenFreeMap publishes no dark style, so the
 * document has to be transformed before either renderer sees it.
 *
 * What the original claim was actually about survived. Both platforms still
 * fetch the same document and pass it through the same shared function, so
 * there is one style source rather than two — the transformation is shared even
 * though the fetching is not, because a package with no third-party
 * dependencies cannot fetch.
 *
 * What differs is everything about drawing, which is where it was always
 * supposed to differ: `Map` and `Camera` components instead of a constructor,
 * `Marker` wrapping a `View` instead of an HTMLElement, `StyleSheet` instead of
 * inline CSS. None of that reaches a shared package.
 */

/**
 * The shared anchor, in this renderer's vocabulary.
 *
 * `@pinpoint/map` states the anchor as a normalised point because that is what
 * describes an arbitrary shape — the web renderer takes a pixel offset and can
 * express any of them. This one takes a name from a fixed set of nine, so the
 * point has to be translated, and a point that is not one of the nine cannot be
 * expressed at all.
 *
 * `bottom` rather than `center` as the fallback, and that is a deliberate
 * choice about which way to be wrong: every marker in this product is a
 * teardrop anchored at its point, so if a future shape is not nameable, being
 * anchored at the bottom is the near-miss and being anchored at the middle is
 * the drift defect all over again.
 */
function anchorName(anchor: { x: number; y: number }): Anchor {
  const NAMES: Record<string, Anchor> = {
    '0.5,1': 'bottom',
    '0.5,0.5': 'center',
    '0.5,0': 'top',
    '0,0.5': 'left',
    '1,0.5': 'right',
    '0,0': 'top-left',
    '1,0': 'top-right',
    '0,1': 'bottom-left',
    '1,1': 'bottom-right',
  }

  return NAMES[`${anchor.x},${anchor.y}`] ?? 'bottom'
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  attribution: {
    position: 'absolute',
    left: SPACE.sm,
    bottom: SPACE.sm,
    borderRadius: RADIUS.pill,
    paddingHorizontal: SPACE.sm,
    paddingVertical: 2,
  },
  attributionText: { fontSize: 10 },
  failure: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACE.sm,
    padding: SPACE.xl,
  },
  failureTitle: { fontSize: 17, fontWeight: '700', textAlign: 'center' },
  failureDetail: { fontSize: 13, lineHeight: 20, textAlign: 'center' },
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
  const theme = useTheme()
  const mode = useThemeMode()

  /**
   * The style, fetched and repainted for the current ground.
   *
   * Changing the ground swaps `mapStyle` on the existing `Map`, which repaints
   * without remounting it — so the camera stays exactly where the person left
   * it and the markers are not rebuilt.
   */
  const basemap = useThemedBasemap(mode)

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

  /**
   * A failed style is reported rather than drawn around. Mounting the map
   * without one produces a blank canvas with correctly-placed pins over it,
   * which reads as a styling problem and is not one.
   */
  if (basemap.error !== null) {
    return (
      <View style={[styles.failure, { backgroundColor: theme.colour.surfaceMuted }]}>
        <Text style={[styles.failureTitle, { color: theme.colour.ink }]}>
          The map could not be loaded
        </Text>
        <Text style={[styles.failureDetail, { color: theme.colour.inkMuted }]}>
          The place data is fine — {basemap.error}. Your saved places are still
          here; only the map underneath them is missing.
        </Text>
      </View>
    )
  }

  return (
    <View
      style={styles.fill}
      onLayout={(event) => {
        if (viewport) return
        const { width, height } = event.nativeEvent.layout
        if (width > 0 && height > 0) setViewport({ width, height })
      }}
    >
      {basemap.style ? (
        <Map
          style={styles.fill}
          mapStyle={basemap.style as unknown as StyleSpecification}
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
              // Where the drawn pin meets its coordinate, from the shared
              // description. Neither application writes this by hand — the last
              // drift defect lived exactly in two apps choosing their own.
              anchor={anchorName(group.view.anchor)}
              onPress={() =>
                setSelection({ group, index: group.count === 1 ? 0 : null })
              }
            >
              <Pin
                view={group.view}
                count={group.count}
                selected={selection?.group.key === group.key}
              />
            </MapLibreMarker>
          ))}
        </Map>
      ) : (
        <View style={[styles.fill, { backgroundColor: theme.basemap.land }]} />
      )}

      {/* A licence condition, not a default. Drawn rather than relied upon. */}
      <View
        style={[
          styles.attribution,
          { backgroundColor: theme.colour.surface, opacity: 0.85 },
        ]}
        pointerEvents="none"
      >
        <Text style={[styles.attributionText, { color: theme.colour.inkMuted }]}>
          {ATTRIBUTION}
        </Text>
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
