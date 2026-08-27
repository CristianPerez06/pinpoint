import {
  Camera,
  Map,
  Marker as MapLibreMarker,
  type Anchor,
  type CameraRef,
  type StyleSpecification,
} from '@maplibre/maplibre-react-native'
import type { Marker, MarkerInterest, TripMember } from '@pinpoint/core'
import {
  ATTRIBUTION,
  fitBounds,
  groupCoincident,
  MAX_ZOOM,
  MIN_ZOOM,
  offsetCenter,
  zoomStep,
  type LngLat,
  type Viewport,
} from '@pinpoint/map'
import { ELEVATION, MARKER_ANCHOR, RADIUS, SPACE } from '@pinpoint/tokens'
// One subpath each, like `marker-details.tsx` and for the same reason: Metro
// does not tree-shake in development, so the package root would pull all 1767
// glyphs into the bundle.
import Minus from 'lucide-react-native/icons/minus'
import Plus from 'lucide-react-native/icons/plus'
import {
  type ReactNode,
  type Ref,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { AttributionSheet } from '@/components/attribution-sheet'
import { MarkerDetails, type Selection } from '@/components/marker-details'
import { DraftPin, Pin } from '@/components/pin'
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
/**
 * The camera centre that puts a point in the middle of what can actually be seen.
 *
 * A map with a sheet over its lower half is not being looked at whole, so
 * centring on a point is precisely how to hide it — the middle of the view is
 * behind the sheet. Shifting the centre down the screen by half the covered
 * height lifts the point into the middle of the strip that is left.
 *
 * Zero inset gives the ordinary answer back unchanged, so callers with nothing
 * covering the map do not need a special case.
 */
function visibleCentre(center: LngLat, zoom: number, bottomInset: number): LngLat {
  if (bottomInset <= 0) return center
  return offsetCenter(center, zoom, 0, bottomInset / 2)
}

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
  /*
   * A surface, not floating controls.
   *
   * Two pills over open map read as debris rather than as chrome — visible on
   * a phone in a way no amount of reasoning about it predicted. A bar guarantees
   * legibility over whatever the map happens to be drawing underneath, frames
   * the map with the same edge the header gives it at the top, and is the
   * surface search and a drop control land on rather than inventing a container
   * for themselves.
   */
  bottomRow: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopWidth: 1,
  },
  /*
   * The sight, and the reason it is a plain overlay rather than a marker.
   *
   * `@maplibre/maplibre-react-native`'s `Marker` has no `draggable` and no drag
   * events, so the laptop's mechanism — a pin you pick up and put down — has no
   * counterpart here. What replaces it is the map moving under a fixed point.
   *
   * Drawn as a `View` over the map rather than as an annotation, which is what
   * keeps it out of the tap recognisers entirely. That matters more than it
   * looks: the alternative mechanism, tapping the map to place a pin, needs
   * `onPress` on `Map`, and the comment further down records what happened the
   * last time that prop existed.
   */
  sightWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sightRing: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sightDot: { width: 7, height: 7, borderRadius: 4 },
  /*
   * Zoom, and the argument above that it has to answer.
   *
   * `bottomRow` records why search and drop live in a bar rather than as pills
   * over open map: two pills over cartography read as debris. That verdict is
   * about the trip's *actions*, and it stands. This is not one of them — zoom is
   * an instrument of the map itself, and putting it in the bar would say it is
   * one of the things you do here rather than one of the ways you look.
   *
   * What the verdict still binds is the shape. One stacked pair on one edge, so
   * there is a single object to read rather than two loose lozenges: a surface
   * with a hairline and an `sm` lift, the same vocabulary the sheets use, not
   * two floating circles.
   *
   * Right edge, because the left one already has the licence credit standing on
   * it and a credit that has to stay legible does not share a corner.
   */
  zoom: {
    position: 'absolute',
    right: SPACE.md,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    /*
      Deliberately no `overflow: 'hidden'`. On iOS that sets `masksToBounds` on
      the layer, which clips the shadow along with everything else — the lift
      simply disappears, on a style that reads as correct. Nothing needs
      clipping here: the buttons draw no fill of their own, so nothing can
      escape the rounded corners.

      The shadow is the token's ingredients composed in this platform's idiom.
      `shadowOpacity: 1` because the alpha is already inside the colour, which
      is how the token stores it; `elevation` is Android's single knob and takes
      the offset, being the only number it has.
    */
    shadowOffset: { width: 0, height: ELEVATION.sm.offsetY },
    shadowOpacity: 1,
    shadowRadius: ELEVATION.sm.blur,
    elevation: ELEVATION.sm.offsetY,
  },
  /*
   * 44 by 44, which is the floor for a target a thumb has to find while walking
   * rather than a number chosen to look right. The drawn pair is therefore
   * 44 wide and 88 tall — deliberately larger than the laptop's, because this
   * is the platform the control was actually argued for.
   */
  zoomButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  /* The one hairline between them, on the second only — two adjacent borders
     would draw two lines. */
  zoomDivider: { borderTopWidth: 1 },
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

/**
 * One of the two zoom buttons.
 *
 * `zoomTo` rather than a camera move, and that distinction is the whole point.
 * It zooms about the camera centre, so the coordinate in the middle of the view
 * stays exactly where it was — which is what makes zooming safe while the sight
 * is armed. The sight is centred on the *view* (see `sightWrap`, and the note
 * about why it is not centred on the visible strip), so the position under it is
 * the camera centre by construction, and a zoom about that centre cannot move
 * it. The pin lands where it was aimed, at whatever scale.
 *
 * The step comes from `@pinpoint/map`. Not `zoom + 1`: the range is 0–20 and
 * belongs to the shared package, and two applications each choosing their own is
 * where the marker-anchor drift defect lived.
 *
 * A spent control is drawn inert and announced as disabled rather than removed,
 * per DESIGN.md. Removing it would tell somebody using a screen reader that zoom
 * had gone, and say nothing about why.
 */
function ZoomButton({
  direction,
  zoom,
  zoomNow,
  camera,
  divided = false,
}: {
  direction: 1 | -1
  /**
   * What the map has settled at, or was framed to open at if it never has.
   * Never null: an untouched map still has a zoom, and drawing the buttons spent
   * until the first gesture would be wrong on exactly the map nobody has moved.
   */
  zoom: number
  /**
   * The zoom at the instant of a press, which is not quite the same thing.
   *
   * `zoom` above is state, so it is one render behind a settle that has already
   * happened; the ref is written synchronously in `onRegionDidChange`. Drawing
   * reads the state because that is what a render can see, and pressing reads
   * the ref because that is what is true now. They disagree for at most one
   * render, and the clamp inside `zoomStep` means the worst case is a press that
   * lands exactly where the drawing said it would.
   */
  zoomNow: () => number
  camera: { current: CameraRef | null }
  /** Whether to draw the hairline that separates this one from the one above. */
  divided?: boolean
}) {
  const theme = useTheme()
  const label = direction === 1 ? 'Zoom in' : 'Zoom out'
  // A step that arrives where it started is a control with nothing left to do.
  // Asking the shared function rather than comparing against the constants keeps
  // one opinion about where the range ends, and sidesteps comparing floats.
  const spent = zoomStep(zoom, direction) === zoom
  const Glyph = direction === 1 ? Plus : Minus

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: spent }}
      onPress={
        spent
          ? // A no-op rather than no handler, so the control stays a control.
            () => {}
          : () => {
              camera.current?.zoomTo(zoomStep(zoomNow(), direction), {
                duration: 200,
              })
            }
      }
      style={[
        styles.zoomButton,
        divided && styles.zoomDivider,
        { borderTopColor: theme.colour.line, opacity: spent ? 0.55 : 1 },
      ]}
    >
      <Glyph size={20} color={theme.colour.ink} />
    </Pressable>
  )
}

/**
 * What the workspace can ask the map to do, as opposed to tell it.
 *
 * Two methods, and both exist because they are the only two things allowed to
 * move a camera nobody else may move — `map-rendering` names them and no others.
 * Choosing a search candidate is usually a request to look somewhere that is not
 * on screen, so the alternative is asking a person to accept a position they
 * cannot see. Choosing a city is a request to re-frame on that group.
 *
 * Imperative rather than a prop, because "go here" is an event and a prop is a
 * value. Web expresses the same thing as `{ points, token }` in state, where the
 * token exists only to distinguish "asked again" from "this array is a new
 * object" on re-render. A method call has no such problem: it happens once,
 * when it is called.
 */
export interface TripMapRef {
  /**
   * Move the camera to a position, framed the way a single marker is framed.
   *
   * `bottomInset` is how much of the map is about to be covered from the bottom,
   * in pixels. It is a parameter rather than something read from this component's
   * own state because the covering thing does not exist yet when this is called:
   * choosing a search result moves the camera and opens the form together, and by
   * the time the form has reported its height the camera has already arrived in
   * the wrong place.
   */
  flyTo: (position: LngLat, bottomInset?: number) => void
  /**
   * Frame a group of positions, the way the map frames a trip when it opens.
   *
   * Separate from `flyTo` rather than an overload of it, because they answer
   * different questions: one puts a known point on screen, the other works out
   * what view holds a set of them. `flyTo` reaching the same answer for a
   * single-element array is a property of the shared derivation, not a reason to
   * merge the two names.
   *
   * An empty set moves nothing. There is no view that frames no places, and
   * moving somewhere arbitrary would be worse than staying — which is what
   * `map-rendering` requires for a city that holds nothing.
   *
   * `bottomInset` is optional here and required in spirit above, which is the
   * one real difference between them. `flyTo` has to be told because the thing
   * about to cover the map does not exist yet when it is called. Nothing new
   * appears when a city is chosen — the toolbar was already there and this
   * component has already measured it — so left unsaid, the frame is computed
   * against whatever currently stands on the bottom edge. Pass a value only to
   * describe something this component cannot see.
   */
  frameOn: (points: readonly LngLat[], bottomInset?: number) => void
}

export function TripMap({
  ref,
  markers,
  currencyOf,
  members,
  interestFor,
  ownMemberId,
  onRecordInterest,
  onWithdrawInterest,
  onSetVisited,
  onEditMarker,
  onDeleteMarker,
  removingId,
  onAbandonCapture,
  bottomRow,
  dropping,
  draft,
  confirmBar,
  formSheet,
  formHeight,
  centreRef,
}: {
  ref?: Ref<TripMapRef>
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
  /** Passed straight through to the details sheet, which is where they are reached from. */
  onEditMarker: (marker: Marker) => void
  onDeleteMarker: (marker: Marker) => void
  /** The place whose removal is in flight, so the details sheet can say so. */
  removingId: string | null
  /**
   * Give up on the place being added, because a saved one is being read instead.
   *
   * Reading and adding cannot both be happening: they want the same bottom edge
   * and they mean opposite things. Rather than letting a tap silently set a
   * selection nobody can see — which is what it did, and which then produced a
   * sheet out of nowhere when the form was cancelled — the tap ends the addition
   * outright.
   *
   * Nothing is stored either way, so this costs whatever had been typed and no
   * more. That is a real cost and it is the deliberate trade: a tap that appears
   * to do nothing is worse than a tap that does the obvious thing.
   */
  onAbandonCapture: () => void
  /**
   * The trip's controls, drawn over the bottom of the map when nothing is
   * selected.
   *
   * Handed in rather than built here: what is in the row is the workspace's
   * business, and where it sits is this component's, because this is where the
   * bottom edge is already negotiated between the sheets that rise from it and a
   * credit that must stay legible over the map behind them.
   */
  bottomRow: ReactNode
  /**
   * Whether the sight is armed.
   *
   * Armed is a deliberate state the person entered, never something a gesture
   * produces: panning and zooming create nothing, which is what the
   * specification asks for and what an unarmed map has always done.
   */
  dropping: boolean
  /**
   * The position a place is being saved at, drawn while its form is open.
   *
   * Null while nothing is being added. This is what makes the half-height form
   * worth having: the map behind it is the only way to confirm the place is the
   * one that was meant, and a map with nothing marked on it confirms nothing.
   */
  draft: LngLat | null
  /**
   * The form for the place being added, standing on the bottom edge.
   *
   * Handed in like `bottomRow` and `confirmBar`, and for the stronger version of
   * the same reason: it is a second tenant of an edge that already has to keep a
   * licence credit legible above whatever is standing there for any length of
   * time.
   */
  formSheet: ReactNode
  /**
   * How tall the open form has settled at, or 0 when none is open.
   *
   * Told rather than measured, unlike the bar and the marker sheet. Those are
   * whatever their contents make them; this one chooses between two heights it
   * already knows, and it is the only thing on this edge that a person can resize
   * by hand.
   */
  formHeight: number
  /**
   * What stands on the bottom edge while the sight is armed, in place of the
   * trip's ordinary controls. Handed in for the same reason `bottomRow` is: what
   * is in it belongs to the workspace, where it sits belongs here.
   */
  confirmBar: ReactNode
  /**
   * Where the map is centred, written on every settle.
   *
   * A ref rather than state because this changes on every settle of every pan,
   * and re-rendering the workspace for each of them would be absurd — the same
   * reasoning that made web's search bias a ref. Everything that reads it does so
   * at the moment of a press, by which point the map has settled.
   */
  centreRef: { current: LngLat | null }
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
   * How tall the bar of controls is, so the credit can sit above it.
   *
   * The bar is pinned to the bottom and so is the credit, so the bar covered it
   * completely — and the credit is a licence condition, not decoration. Measured
   * rather than assumed because what stands in the bar is the workspace's
   * business, so there is no height here to hard-code.
   *
   * Deliberately not reset when the bar unmounts for a sheet. The last
   * measurement is what holds the credit still while the sheet is open, which is
   * the point of anchoring to this rather than to the sheet.
   */
  const [barHeight, setBarHeight] = useState(0)

  /**
   * The camera, held so search can move it.
   *
   * The `Camera` below stays uncontrolled — `initialViewState` and nothing else —
   * because a controlled one re-applies on every render and fights the person
   * panning. A ref adds the one motion that has to be possible without making the
   * camera a value that React owns.
   */
  const cameraRef = useRef<CameraRef>(null)
  /** Whether the credit has been pressed and the sources are being read. */
  const [creditsOpen, setCreditsOpen] = useState(false)
  /**
   * The current zoom, written on every settle.
   *
   * Kept as a ref as well as in the state below, and read at the moment of a
   * press by everything that needs a value *now* — the offset arithmetic that
   * lifts a draft clear of the form, and the buttons. How far a pixel reaches on
   * the ground depends entirely on it, so an offset computed at a stale zoom is
   * an offset of the wrong distance.
   */
  const zoomRef = useRef<number | null>(null)

  /**
   * The same number, as state, so the buttons can be drawn correctly.
   *
   * Affordable here in a way it is not on the laptop, and the difference is the
   * event rather than the platform. Web must keep zoom out of state because
   * `move` fires on every frame of a wheel or a drag; `onRegionDidChange` fires
   * on **settle**, which is why the centre and the zoom are already written
   * there. So this costs one render per finished gesture and buys a correct
   * inert state at either end of the range.
   *
   * Null until the first settle, which is why nothing reads it directly — see
   * `currentZoom` below.
   */
  const [zoom, setZoom] = useState<number | null>(null)

  /**
   * Which draft the camera has already been lifted for.
   *
   * Written only from inside the effect below, so it never records an intention
   * that a render did not carry out. Keyed on the position rather than set as a
   * flag because correcting a position produces a *new* draft that has to be
   * lifted again, and clearing the form produces none at all.
   */
  const liftedForRef = useRef<string | null>(null)

  /**
   * Getting the draft clear of the form that just opened over it.
   *
   * The fly path handles its own offset, because it knows where it is going
   * before the form exists. The other two paths do not fly at all: dropping a pin
   * and correcting one both leave the camera exactly where the person put it, and
   * the position they chose is the middle of the view — which is the first thing
   * the sheet covers.
   *
   * So this eases, and only far enough. It is not a re-frame: the zoom does not
   * change and the point they chose does not move. What moves is the amount of it
   * they can see.
   */
  useEffect(() => {
    if (!draft || formHeight <= 0) {
      if (!draft) liftedForRef.current = null
      return
    }

    const key = `${draft.lng},${draft.lat},${formHeight}`
    if (liftedForRef.current === key) return
    liftedForRef.current = key

    const zoom = zoomRef.current
    if (zoom === null) return

    const target = visibleCentre(draft, zoom, formHeight)
    cameraRef.current?.easeTo({
      center: [target.lng, target.lat],
      duration: 280,
    })
  }, [draft, formHeight])

  useImperativeHandle(
    ref,
    () => ({
      flyTo: (position: LngLat, bottomInset = 0) => {
        // Framed by the shared derivation rather than a zoom written here. A
        // single point has no extent to fit, and what that should mean is
        // already decided once in `@pinpoint/map` for both platforms.
        const camera = fitBounds([position], viewport ? { viewport } : {})
        // Centred on the visible strip rather than on the view, so the place
        // lands above whatever is about to cover the bottom of the map instead
        // of behind it.
        const target = visibleCentre(camera.center, camera.zoom, bottomInset)
        cameraRef.current?.flyTo({
          center: [target.lng, target.lat],
          zoom: camera.zoom,
        })
      },
      frameOn: (points: readonly LngLat[], bottomInset?: number) => {
        // Guarded here rather than left to `fitBounds`, which answers an empty
        // set with `DEFAULT_CAMERA` — a real camera pointing at a default place.
        // Flying there would be the map wandering off for a city that holds
        // nothing, which is the one outcome the specification rules out.
        if (points.length === 0) return
        // The same expression as `lift` below, and it has to be written twice:
        // `lift` is declared after this hook, so naming it here would be a
        // reference into its own temporal dead zone on every render.
        const covered = bottomInset ?? (formSheet ? formHeight : barHeight)
        const camera = fitBounds(points, viewport ? { viewport } : {})
        const target = visibleCentre(camera.center, camera.zoom, covered)
        cameraRef.current?.flyTo({
          center: [target.lng, target.lat],
          zoom: camera.zoom,
        })
      },
    }),
    [viewport, barHeight, formSheet, formHeight],
  )

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

  /*
   * How far the credit stands off the bottom edge.
   *
   * Two cases, not three. The marker sheet is deliberately absent: a credit that
   * tracks it stops reading as a corner credit on the map and starts reading as a
   * caption belonging to the sheet, sliding up and down as the sheet resizes.
   * Reading a place is a glance, so the sheet covers the credit for as long as
   * that glance lasts and no longer — the map's own state, which is what the
   * licence asks to carry the credit, still shows it unprompted.
   *
   * The form is not a glance. It stands on the bottom edge while a place is being
   * described, keeps the map behind it visible so the position can be confirmed,
   * and is the one thing here a person can resize by hand — so the credit rises
   * off it rather than spending that whole time underneath it.
   *
   * Never a sum. Exactly one of these is drawn at a time.
   */
  const lift = formSheet ? formHeight : barHeight
  const camera = useMemo(
    () => (viewport ? fitBounds([...markers], { viewport }) : null),
    // Deliberately not depending on `markers`: the frame is decided by the
    // markers present when the surface was first measured.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [viewport],
  )

  /**
   * The zoom the buttons work from: where the map has settled, or where it was
   * framed to open if it has not settled yet.
   *
   * The fallback is the point. `onRegionDidChange` fires on settle, and an
   * untouched map never settles — so a map nobody has moved would draw both
   * buttons spent, permanently, if null were read as "cannot zoom". The framing
   * camera is where the map actually is until something moves it, so it is the
   * honest answer rather than a placeholder.
   *
   * Null only before the surface has been measured, which is also before the
   * map itself is mounted.
   */
  const currentZoom = zoom ?? camera?.zoom ?? null

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
          /*
            Both native ornaments off, and the credit below takes their place.

            The attribution control was an "i" button that says nothing until it
            is pressed — a third view at this edge, sized and tinted by the
            platform, aligning with neither of the other two. What it opens is
            reached by pressing the credit instead, which is where somebody
            looks for it and is already the thing the licence is satisfied by.

            The wordmark is courtesy rather than a condition: MapLibre Native is
            BSD-licensed and asks for the notice in the distribution, not on the
            map. It was stacked under our credit, and the gap between them was a
            guess at the height of a view this side cannot measure — different
            on each platform, so it was drawn overlapping. Nothing stacks now.

            The credit itself is not negotiable in the way these two were: the
            OpenStreetMap data is ODbL, and `map-rendering` requires it visible
            without interaction.
          */
          attribution={false}
          logo={false}
          /*
            Where the map is, written down on every settle.
            
            This is what the sight reads when somebody confirms a position, and
            what place search reads to bias a query. Both read it at the moment of
            a press, never during the movement, so a ref is enough and no render
            is provoked by panning.

            The event also carries `userInteraction`, which says whether a person
            caused this or the camera did. Deliberately not branched on: the
            position under the sight is wherever the map is, and how it came to be
            there does not change what is under the sight. Recording only
            person-driven settles would leave the ref stale after a flight and
            hand the next press a position from before it.
          */
          onRegionDidChange={(event) => {
            const [lng, lat] = event.nativeEvent.center
            centreRef.current = { lng, lat }
            // Kept for the same reason the centre is, and read at the same
            // moments: how far a pixel reaches on the ground depends entirely on
            // it, so an offset computed at the wrong zoom is an offset of the
            // wrong distance.
            zoomRef.current = event.nativeEvent.zoom
            setZoom(event.nativeEvent.zoom)
          }}
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
              ref={cameraRef}
              initialViewState={{
                center: [camera.center.lng, camera.center.lat],
                zoom: camera.zoom,
              }}
              /*
                Our range, held on the camera rather than only in the buttons.

                A pinch is then bounded by the same range as a button and as
                `fitBounds`, instead of the range depending on which instrument
                was used. The laptop binds the same two values on its map
                constructor for the same reason.
              */
              minZoom={MIN_ZOOM}
              maxZoom={MAX_ZOOM}
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
              onPress={() => {
                // Whatever was being added is given up first, so that the
                // selection this sets is never hidden behind a form or competing
                // with an armed sight.
                if (formSheet !== null || dropping) onAbandonCapture()
                setOpen({
                  groupKey: group.key,
                  markerId: group.count === 1 ? group.markers[0]!.id : null,
                })
              }}
            >
              <Pin
                view={group.view}
                count={group.count}
                selected={open?.groupKey === group.key}
              />
            </MapLibreMarker>
          ))}

          {/*
            The place being added, drawn after the saved markers so it sits above
            them. Putting one at or near an existing marker has to leave it
            visible rather than buried.

            It is not among `groups`, so it contributes nothing to framing and is
            counted nowhere — the trip does not have it yet.

            The anchor comes from the shared token, like every other pin here.
            Neither application writes this by hand: two apps choosing their own
            is where the last drift defect lived.
          */}
          {draft ? (
            <MapLibreMarker
              id="draft"
              lngLat={[draft.lng, draft.lat]}
              anchor={anchorName(MARKER_ANCHOR)}
            >
              <DraftPin />
            </MapLibreMarker>
          ) : null}
        </Map>
      ) : (
        <View style={[styles.fill, { backgroundColor: theme.basemap.land }]} />
      )}

      {/*
        The sight, at the geometric centre of the map view.

        Centred on the map rather than on the space left visible above the
        confirm bar, and that distinction is the whole defect this is written to
        avoid. MapLibre centres its camera on its own view, so the coordinate the
        map reports as its centre is the one under the middle of the *view* —
        including the strip the bar is covering. Centring the sight on what the
        eye reads as the middle would put it a good thirty points away from the
        position it claims to mark, in the same direction every time, and a pin
        that lands consistently north of where it was aimed is the drift defect
        this project has already shipped once.

        `pointerEvents="none"` so it cannot take a touch the map needs. It never
        needs one: the sight is not what is pressed, the confirm bar is.
      */}
      {dropping ? (
        <View style={styles.sightWrap} pointerEvents="none">
          <View
            style={[
              styles.sightRing,
              {
                borderColor: theme.colour.accent,
                backgroundColor: theme.colour.surface,
                opacity: 0.9,
              },
            ]}
          >
            <View
              style={[styles.sightDot, { backgroundColor: theme.colour.accent }]}
            />
          </View>
        </View>
      ) : null}

      {/*
        Zoom, as something a thumb can reach.

        Rendered after the sight so it is drawn above it. `sightWrap` is
        `pointerEvents="none"` and steals no touches, so this is about z-order
        and nothing else — but the sight covers the whole view, so without this
        ordering the buttons would be underneath it.

        Hidden while the capture form is open. The form takes half the screen or
        more; the strip of map left is the only way to confirm the place is the
        one that was meant, and a control floating in that strip costs more of it
        than it gives. Nothing is lost — the position is already chosen by then,
        and the way to change it is to cancel and aim again.

        Hidden while a marker sheet is open, and this one follows the credit
        rather than deciding for itself. `lift` is deliberately blind to that
        sheet — a thing that tracked it would slide up and down as the sheet
        resized, which is the objection recorded there — so a stack anchored to
        `lift` would sit behind it, half-covered and unpressable. Reading a place
        is a glance, and the credit already spends that glance underneath. A
        control that is absent is honest; one that is half-visible and inert is
        not.

        Not hidden while the sight is armed. That is exactly when a stepped zoom
        earns its place: framing a point under a fixed sight is the one moment
        somebody needs to change scale without moving the map, which is precisely
        what zooming about the centre does.
      */}
      {camera && currentZoom !== null && formSheet === null && selection === null ? (
        <View
          style={[
            styles.zoom,
            {
              backgroundColor: theme.colour.surface,
              borderColor: theme.colour.line,
              shadowColor: theme.elevation.sm.colour,
              // Rises off whatever holds the floor, exactly as the credit does
              // and off the same measurement — the bar, or the marker sheet, or
              // nothing. Both the bar and the form carry the device's bottom
              // inset in their own padding, so adding it again here would float
              // the stack off the edge it is standing on.
              bottom: lift + SPACE.md,
            },
          ]}
        >
          <ZoomButton
            direction={1}
            zoom={currentZoom}
            zoomNow={() => zoomRef.current ?? currentZoom}
            camera={cameraRef}
          />
          <ZoomButton
            direction={-1}
            zoom={currentZoom}
            zoomNow={() => zoomRef.current ?? currentZoom}
            camera={cameraRef}
            divided
          />
        </View>
      ) : null}

      {/*
        A licence condition, not a default. Drawn rather than relied upon.

        Pressable as well as visible, which is what let the native "i" button go:
        the notice is now behind the words that name the sources rather than
        beside them. The requirement is unaffected — what the licence asks to be
        visible is the credit, and that is what is drawn; the sheet is the
        expansion, and `AttributionSheet` records why it is ours and not the
        renderer's.
      */}
      <Pressable
        onPress={() => setCreditsOpen(true)}
        accessibilityRole="button"
        accessibilityLabel="Map data credits"
        accessibilityHint="Opens the projects this map is built from"
        style={[
          styles.attribution,
          {
            backgroundColor: theme.colour.surface,
            opacity: 0.85,
            // Sits directly on whatever holds the floor, with nothing between
            // them now. Both the bar and the form carry the bottom inset in
            // their own padding, so adding it again here would float the credit.
            bottom: lift + SPACE.sm,
          },
        ]}
      >
        <Text style={[styles.attributionText, { color: theme.colour.inkMuted }]}>
          {ATTRIBUTION}
        </Text>
      </Pressable>

      <AttributionSheet
        open={creditsOpen}
        onClose={() => setCreditsOpen(false)}
      />

      {/*
        Not rendered while a marker is selected, rather than rendered and
        hidden: the sheet has rounded top corners, and a row behind them would
        show through at the edges. Reading a place is not narrowing a trip, so
        nothing useful is lost — and dismissing the sheet brings the row back,
        which is what keeps the declaration and the way out concealed together
        rather than one without the other.
      */}
      {/*
        The form for a place being added, which takes the bottom edge from
        everything else while it is open.

        Rendered here rather than over the whole screen so that the map it leaves
        visible is genuinely the map — our credit rises off the top of it, exactly
        as it does off the bar. The marker sheet is the exception, and `lift`
        records why.
      */}
      {formSheet}

      {formSheet === null && selection === null ? (
        <View
          onLayout={(event) => setBarHeight(event.nativeEvent.layout.height)}
          style={[
            styles.bottomRow,
            {
              backgroundColor: theme.colour.surface,
              borderColor: theme.colour.line,
              // Flush to the bottom of the screen, carrying the inset in its own
              // padding so its contents clear the home indicator.
              paddingBottom: insets.bottom,
            },
          ]}
        >
          {/*
            The trip's controls, or the confirmation the sight is waiting for.

            One slot rather than two, measured by one `onLayout`, so the credit
            rises off whichever is standing there without either case having to
            be remembered separately. Arming replaces the
            controls instead of adding to them, which is also what says the map is
            doing something other than what it usually does.
          */}
          {dropping ? confirmBar : bottomRow}
        </View>
      ) : null}

      {formSheet === null && selection ? (
        <MarkerDetails
          currencyOf={currencyOf}
          selection={selection}
          members={members}
          interestFor={interestFor}
          ownMemberId={ownMemberId}
          onRecordInterest={onRecordInterest}
          onWithdrawInterest={onWithdrawInterest}
          onSetVisited={onSetVisited}
          onEdit={onEditMarker}
          onDelete={onDeleteMarker}
          removingId={removingId}
          onChoose={(index) =>
            setOpen({
              groupKey: selection.group.key,
              markerId: selection.group.markers[index]!.id,
            })
          }
          onBack={() => setOpen({ groupKey: selection.group.key, markerId: null })}
          // Nothing here touches the camera, so dismissing cannot move it.
          onDismiss={() => setOpen(null)}
        />
      ) : null}
    </View>
  )
}
