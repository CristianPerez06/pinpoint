import {
  Camera,
  Map,
  Marker as MapLibreMarker,
  type Anchor,
  type StyleSpecification,
} from '@maplibre/maplibre-react-native'
import type { Marker, MarkerInterest, TripMember } from '@pinpoint/core'
import {
  ATTRIBUTION,
  fitBounds,
  groupCoincident,
  type Viewport,
} from '@pinpoint/map'
import { RADIUS, SPACE } from '@pinpoint/tokens'
import { type ReactNode, useMemo, useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

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

/**
 * Room for MapLibre's own bottom ornaments — its wordmark on the left and the
 * attribution button on the right.
 *
 * Our credit sits at the bottom left too, so without this it lands on top of
 * the wordmark and both become hard to read. Lifting ours is deliberate rather
 * than turning theirs off: hiding another project's branding to fix our own
 * layout is not a trade this change gets to make.
 */
const ORNAMENT_CLEARANCE = 28

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
  bottomRow: { position: 'absolute', left: 0, right: 0 },
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
  members,
  interestFor,
  ownMemberId,
  onRecordInterest,
  onWithdrawInterest,
  onSetVisited,
  bottomRow,
}: {
  /**
   * Already narrowed by the filter. The map draws what it is given and knows
   * nothing about why something is missing — which is what stops it and the
   * workspace disagreeing about what the trip contains.
   */
  markers: readonly Marker[]
  /** Passed straight through to the details sheet; the map itself has no use for it. */
  currencyOf: (marker: Marker) => string | null
  members: readonly TripMember[]
  interestFor: (marker: Marker) => readonly MarkerInterest[]
  ownMemberId: string | null
  onRecordInterest: (marker: Marker, interested: boolean) => void
  onWithdrawInterest: (marker: Marker) => void
  onSetVisited: (marker: Marker, visited: boolean) => void
  /**
   * The trip's controls, drawn over the bottom of the map when nothing is
   * selected.
   *
   * Handed in rather than built here: what is in the row is the workspace's
   * business, and where it sits is this component's, because this is where the
   * bottom edge is already negotiated between a sheet that rises from it and a
   * credit that must stay legible above both.
   */
  bottomRow: ReactNode
}) {
  /**
   * What is open, said in identities rather than in positions.
   *
   * Not the group itself, which would be a snapshot: marking a place visited
   * changes the marker, the map redraws from the new groups, and a sheet holding
   * the old copy goes on saying "Mark visited" beside a pin that has already
   * faded. Web shipped exactly that defect and fixed it the same way.
   *
   * The index is not stored either. A filter can shrink a group out from under
   * an open sheet, and an index into the shrunken group addresses a different
   * place — silently, and looking entirely correct.
   */
  const [open, setOpen] = useState<{
    groupKey: string
    markerId: string | null
  } | null>(null)
  const theme = useTheme()
  const mode = useThemeMode()
  // The map is full-bleed, so everything drawn over it has to hold itself clear
  // of the home indicator. The licence credit is the one that matters most: a
  // credit the system draws its handle through is not legible, and legibility
  // is the condition being satisfied.
  const insets = useSafeAreaInsets()

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

  /**
   * How tall the open sheet is, so the credit can sit above it.
   *
   * The sheet is pinned to the bottom and so is the credit, so an open sheet
   * covered it completely — and the credit is a licence condition, not
   * decoration. Measured rather than assumed because the sheet grows with its
   * content up to a cap, so there is no fixed height to offset by.
   */
  const [sheetHeight, setSheetHeight] = useState(0)

  /**
   * How tall the credit is, so the trip's controls can sit above it.
   *
   * The stack at this edge is MapLibre's own ornaments, then our credit, then
   * the controls — deliberately in that order. It leaves the credit's offset
   * exactly as it was, which matters because that offset is a licence
   * condition: the controls move to accommodate it rather than the other way
   * round, and a row that is not drawn yet cannot push a credit out of view.
   */
  const [creditHeight, setCreditHeight] = useState(0)

  const groups = useMemo(() => groupCoincident([...markers]), [markers])

  /**
   * The open sheet's marker, re-resolved against current state every render.
   *
   * Null when what was open is no longer there — the filter now hides it, or it
   * was removed — and the sheet closes rather than showing something else in its
   * place.
   */
  const selection: Selection | null = useMemo(() => {
    if (!open) return null

    const group = groups.find((each) => each.key === open.groupKey)
    if (!group) return null
    if (open.markerId === null) return { group, index: null }

    const index = group.markers.findIndex((marker) => marker.id === open.markerId)
    return index === -1 ? null : { group, index }
  }, [open, groups])
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
                setOpen({
                  groupKey: group.key,
                  markerId: group.count === 1 ? group.markers[0]!.id : null,
                })
              }
            >
              <Pin
                view={group.view}
                count={group.count}
                selected={open?.groupKey === group.key}
              />
            </MapLibreMarker>
          ))}
        </Map>
      ) : (
        <View style={[styles.fill, { backgroundColor: theme.basemap.land }]} />
      )}

      {/* A licence condition, not a default. Drawn rather than relied upon. */}
      <View
        onLayout={(event) => setCreditHeight(event.nativeEvent.layout.height)}
        style={[
          styles.attribution,
          {
            backgroundColor: theme.colour.surface,
            opacity: 0.85,
            // An open sheet already carries the bottom inset in its own
            // padding, so adding it again here would float the credit.
            //
            // Unchanged by the arrival of the trip's controls, and that is the
            // point: they sit above this rather than below it, so the one piece
            // of layout that is a licence condition still has exactly two cases
            // and neither depends on how tall a row of controls happens to be.
            bottom: selection
              ? sheetHeight + SPACE.sm
              : SPACE.sm + insets.bottom + ORNAMENT_CLEARANCE,
          },
        ]}
        pointerEvents="none"
      >
        <Text style={[styles.attributionText, { color: theme.colour.inkMuted }]}>
          {ATTRIBUTION}
        </Text>
      </View>

      {/*
        Not rendered while a marker is selected, rather than rendered and
        hidden: the sheet has rounded top corners, and a row behind them would
        show through at the edges. Reading a place is not narrowing a trip, so
        nothing useful is lost — and dismissing the sheet brings the row back,
        which is what keeps the declaration and the way out concealed together
        rather than one without the other.
      */}
      {selection === null ? (
        <View
          style={[
            styles.bottomRow,
            {
              // Above MapLibre's own ornaments and above our credit, in that
              // order. Landing on either would be the same defect: covering
              // somebody's attribution to make room for our own controls.
              bottom:
                SPACE.sm + insets.bottom + ORNAMENT_CLEARANCE + creditHeight + SPACE.sm,
            },
          ]}
        >
          {bottomRow}
        </View>
      ) : null}

      {selection ? (
        <MarkerDetails
          currencyOf={currencyOf}
          selection={selection}
          members={members}
          interestFor={interestFor}
          ownMemberId={ownMemberId}
          onRecordInterest={onRecordInterest}
          onWithdrawInterest={onWithdrawInterest}
          onSetVisited={onSetVisited}
          onChoose={(index) =>
            setOpen({
              groupKey: selection.group.key,
              markerId: selection.group.markers[index]!.id,
            })
          }
          onBack={() => setOpen({ groupKey: selection.group.key, markerId: null })}
          onHeight={setSheetHeight}
          // Nothing here touches the camera, so dismissing cannot move it.
          onDismiss={() => setOpen(null)}
        />
      ) : null}
    </View>
  )
}
