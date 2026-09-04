'use client'

import type { Marker } from '@pinpoint/core'
import {
  ATTRIBUTION,
  MAP_CREDITS,
  frameAround,
  liftOffset,
  offsetCenter,
  DEFAULT_VIEWPORT,
  MAX_ZOOM,
  MIN_ZOOM,
  zoomStep,
  type LngLat,
  type Rect,
  type MarkerAnchor,
  type MarkerGroup,
  type StyleDocument,
} from '@pinpoint/map'
// Named imports, not a default: maplibre-gl v6 has no default export, and the
// `import maplibregl from 'maplibre-gl'` written all over the internet is v4
// advice. `Map` and `Marker` are both aliased — the first collides with the
// global, the second with our own domain type.
import {
  MapLibreMap,
  Marker as MapLibreMarker,
  setWorkerUrl,
  type StyleSpecification,
} from 'maplibre-gl'
import { useEffect, useMemo, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'

import { DraftPin, Pin } from '@/app/_components/pin'
import { Menu } from '@/app/_components/ui'
import { themedBasemap } from '@/lib/basemap'
import { useColourScheme } from '@/lib/use-colour-scheme'

import styles from './trip-map.module.css'

// Without this the map renders as a blank box and reports nothing at all.
import 'maplibre-gl/dist/maplibre-gl.css'

/**
 * Tell MapLibre where its worker is. Without this the map draws no tiles and
 * barely says why.
 *
 * v6 parses tiles in a module worker whose URL it derives from its own
 * `import.meta.url`. That is right for loose files and wrong under a bundler:
 * Turbopack emits the worker as a content-hashed asset under
 * `/_next/static/media/` while the library asks for it beside its own chunk, so
 * the request 404s and the browser rejects Next's HTML error page for its MIME
 * type.
 *
 * Remember the shape of that failure. The main thread still owns the camera and
 * mounts markers as DOM, so the pins land in exactly the right places over a
 * blank canvas — it reads as a styling problem and is not one. The style fetch
 * below can now fail with the same symptom from a different cause, which is why
 * it reports rather than falling back.
 *
 * The file is copied into `public/maplibre/` by `scripts/copy-maplibre-worker.mjs`,
 * which runs on every `dev` and `build`. A literal path rather than a clever
 * `new URL(...)` because this one can be checked with `curl`.
 */
setWorkerUrl('/maplibre/maplibre-gl-worker.mjs')

export interface DraftPosition {
  lng: number
  lat: number
}

/**
 * Where MapLibre should put the element, given where the shared description
 * says the marker's point is.
 *
 * Expressed as an offset from the element's centre rather than as one of
 * MapLibre's named anchors, because the named set cannot express an arbitrary
 * point and this way nothing has to be re-derived if the pin's shape changes.
 * The renderer places the element's centre at the coordinate; moving it by
 * `(0.5 - x)` of the width and `(0.5 - y)` of the height puts the named point
 * there instead.
 *
 * No application writes this offset by hand. That is the whole point: the last
 * drift defect lived in two applications each choosing their own, so fixing one
 * left the other wrong.
 */
function offsetFor(
  anchor: MarkerAnchor,
  size: { width: number; height: number },
): [number, number] {
  return [size.width * (0.5 - anchor.x), size.height * (0.5 - anchor.y)]
}

/**
 * The renderer's own type for a style, which the shared package cannot use.
 *
 * `@pinpoint/map` describes a style document structurally, because naming
 * `maplibre-gl`'s type there would mean depending on a renderer — and the whole
 * portability boundary is that it does not. The two describe the same JSON; only
 * one of them is allowed to say so in `maplibre-gl`'s vocabulary, and this is the
 * seam where that translation belongs.
 */
function asRendererStyle(document: StyleDocument): StyleSpecification {
  return document as unknown as StyleSpecification
}

/**
 * How much clear map a described place is given above whatever describes it.
 *
 * Read twice by `liftOffset` — once to decide whether a place needs moving at
 * all, and once for how far — so a place already within this of the chrome's
 * edge is lifted rather than left resting on it.
 */
const LIFT_MARGIN = 32

/**
 * One of the two zoom buttons.
 *
 * `spent` rather than `disabled`, and the difference is the point. The
 * `disabled` attribute takes a control out of the tab order and screen readers
 * skip it, so at maximum zoom somebody arriving by keyboard would find the
 * zoom-in button gone rather than unavailable — and nothing would say why.
 * DESIGN.md settles this: `aria-disabled`, a no-op handler, and an inert
 * treatment.
 *
 * The glyphs are drawn rather than typed. `+` and `-` as characters take the
 * font's own weight, width and vertical centring, and the two do not match each
 * other at any size — the minus sits high and light beside a plus that does not.
 */
function ZoomButton({
  direction,
  spent,
  onPress,
}: {
  direction: 1 | -1
  spent: boolean
  onPress: () => void
}) {
  const label = direction === 1 ? 'Zoom in' : 'Zoom out'

  return (
    <button
      type="button"
      className={styles.zoomButton}
      aria-label={label}
      title={label}
      aria-disabled={spent || undefined}
      onClick={spent ? undefined : onPress}
    >
      <svg
        viewBox="0 0 16 16"
        className={styles.zoomGlyph}
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        aria-hidden="true"
      >
        <line x1="3.5" y1="8" x2="12.5" y2="8" />
        {direction === 1 ? <line x1="8" y1="3.5" x2="8" y2="12.5" /> : null}
      </svg>
    </button>
  )
}

/**
 * The web half of the portability boundary.
 *
 * Everything decided here is bound to `maplibre-gl`: creating the map, mounting
 * marker elements, wiring clicks and drags. Everything *decided* — the style,
 * the camera, which family and icon a marker takes, where its point sits, which
 * markers share a point — comes from `@pinpoint/map`, which imports no renderer
 * at all. The mobile app binds the same values to a different library and gets
 * the same map.
 *
 * It owns no data. Markers, grouping, and the unsaved marker's position all
 * arrive as props, so this file has nothing to say about what a place is.
 *
 * `'use client'` is not a preference. The renderer needs a canvas and a DOM, so
 * there is nothing for a server to render.
 */
export function TripMap({
  groups,
  revealed,
  onSelectGroup,
  selectedKey,
  draft,
  dropping,
  onDropAt,
  onDraftMove,
  frameTo,
  frameToken,
  centreRef,
  onMarkersInView,
  floor = 0,
  covered = null,
}: {
  groups: readonly MarkerGroup<Marker>[]
  /**
   * One point the filter is not drawing, shown anyway because the person named
   * it — search recognised a place the trip already holds.
   *
   * Separate from `groups` rather than merged into it by the caller, and the
   * separation is the point: this pin is drawn, and it is counted nowhere. It
   * does not frame the map, it does not answer "are any markers in view", and
   * it is not what the filter says the trip contains. The draft pin has exactly
   * this shape and exists for the same reason — something on the map that the
   * trip's own set does not include.
   *
   * Null whenever the point is already drawn, so nothing is ever drawn twice.
   */
  revealed: MarkerGroup<Marker> | null
  onSelectGroup: (group: MarkerGroup<Marker>) => void
  /** Which drawn point is selected, so the pin can show it. */
  selectedKey: string | null
  /** The place being added, before it is saved. Null when nothing is being added. */
  draft: DraftPosition | null
  dropping: boolean
  onDropAt: (position: DraftPosition) => void
  onDraftMove: (position: DraftPosition) => void
  /**
   * Points to frame when `frameToken` changes. Empty leaves the camera alone.
   *
   * Points rather than markers, because the two things that ask for a re-frame
   * want the same treatment from different sources: a city's saved markers, and
   * the single position of a place just chosen from search. `fitBounds` already
   * answers a one-point list with that point at a zoom that shows its
   * surroundings, so the second case needs no special handling.
   */
  frameTo: readonly LngLat[]
  frameToken: number
  /**
   * How much of the bottom of the map is covered by chrome standing right
   * across it.
   *
   * Zero at a laptop width, where the tools are in the bar above the map and
   * the one panel that does stand on the map is a card in a corner rather than
   * a band across it. At a phone width it is the height of whatever holds the
   * edge — the toolbar, or the sheet that replaces it. Measured by the
   * workspace, which is the only thing that can see both the map and what is
   * over it.
   *
   * Three things here need it: framing, the licence credit, which has to rise
   * off the floor rather than sit under it, and the zoom control, which has to
   * clear both.
   */
  floor?: number
  /**
   * The part of the map its chrome is standing over, as a rectangle.
   *
   * `floor` above answers "how much of the map's height is gone", which is the
   * question framing and the two corner controls ask. This answers "is *this
   * place* behind something", which is the question the lift asks, and a height
   * cannot answer it — asked with a height alone it says yes for every place on
   * the map, which is how a dropped pin ended up off the top of it.
   *
   * Null when nothing stands over the map at all.
   */
  covered?: Rect | null
  /** Where the map is looking, for biasing search. A ref because it changes on every pan. */
  centreRef: { current: DraftPosition | null }
  /**
   * Whether any drawn marker is inside the current view.
   *
   * A boolean rather than a count, and reported when a movement finishes rather
   * than during it: a count would change on most frames of a drag, and this
   * drives a note that would then flicker through a pan it is not about.
   *
   * Phrased in the renderer's own terms — what is drawn, and where the camera
   * is — because this file knows nothing about why some markers are missing.
   * Whoever narrowed them decides what to say.
   */
  onMarkersInView: (anyInView: boolean) => void
}) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [map, setMap] = useState<MapLibreMap | null>(null)
  /**
   * The settled zoom, and the one thing about the camera this file does keep in
   * React state.
   *
   * The centre next to it is deliberately a ref, because `move` fires on every
   * frame of a wheel or a drag and re-rendering the workspace through a pan
   * would be absurd. This is not that: it is written on `zoomend` only, so it
   * costs one render per finished gesture, and it buys the two buttons a
   * correct inert state at either end of the range. Nothing else reads it —
   * anything wanting the live zoom should ask the map.
   *
   * Null only for the single render between the map existing and the effect
   * below reporting, which is read as "not at either end" and is true far more
   * often than not.
   */
  const [zoom, setZoom] = useState<number | null>(null)
  const draftMarkerRef = useRef<MapLibreMarker | null>(null)
  const hasDraft = draft !== null

  const mode = useColourScheme()

  /**
   * How tall whatever is standing on the bottom-right corner is.
   *
   * The attribution, today and probably always. Measured rather than assumed,
   * because its height is not a constant: the credit is a single 20px strip at
   * a comfortable window width and wraps to two lines on a narrow one, and an
   * offset written for the first case leaves the buttons sitting exactly on the
   * second. That was found by looking at it at 420px, not by reasoning — the
   * gap closed to zero.
   *
   * MapLibre stacks its own corner controls with floats rather than flex, so
   * there is no way to join that stack from the outside and be pushed up by it.
   * The phone has the same problem at the same edge and answers it the same
   * way: `trip-map.tsx` measures the bar so the licence credit can rise off it.
   *
   * Zero when there is nothing there, which puts the buttons at the plain inset
   * — right for a map with no attribution, and unreachable while there is one.
   */
  const [cornerHeight, setCornerHeight] = useState(0)
  useEffect(() => {
    if (!map) return

    const corner = map
      .getContainer()
      .querySelector('.maplibregl-ctrl-bottom-right')
    if (!(corner instanceof HTMLElement)) return

    const measure = () => setCornerHeight(corner.offsetHeight)

    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(corner)
    return () => observer.disconnect()
  }, [map])

  /**
   * How tall our own credit is, measured for the same reason the corner is.
   *
   * It is one line at 390px and two at 320px with a long enough licence string,
   * and the zoom control has to clear whichever it turns out to be. The corner
   * measurement above answers the laptop; this one answers the phone, and
   * exactly one of them is non-zero at a time because each belongs to a width
   * where the other is not drawn.
   */
  /*
   * The floor, held in a ref as well as a prop.
   *
   * The two framing effects must not re-run because something opened over the
   * map — re-framing is a thing the person asks for, and `map-rendering` is
   * explicit that nothing else moves the camera. They need the current value at
   * the moment they fire, not a dependency on it.
   */
  const floorRef = useRef(floor)
  useEffect(() => {
    floorRef.current = floor
  }, [floor])

  const creditRef = useRef<HTMLDivElement | null>(null)
  const [creditHeight, setCreditHeight] = useState(0)
  useEffect(() => {
    const credit = creditRef.current
    if (!credit) return
    const measure = () => setCreditHeight(credit.offsetHeight)
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(credit)
    return () => observer.disconnect()
  }, [])

  /** Whether the credits sheet is open. Local: it is about the map, not the trip. */
  const [creditsOpen, setCreditsOpen] = useState(false)

  /**
   * Whatever is being described stays clear of whatever is describing it.
   *
   * A sheet rising over the lower half of the map is the exact condition under
   * which centring on a point hides it, and the point this one is about is the
   * pin somebody just tapped. `map-rendering` asks for the narrow version of
   * this — the position moves "only far enough, if at all" — and both halves of
   * that clause were false here. It moved when nothing was in front of the pin,
   * because it asked a height whether a point was covered and a height says yes
   * to every point; and it moved too far, because the height it asked was
   * larger than the map. A pin dropped in the middle of a 614px map landed 25px
   * above its top edge.
   *
   * `liftOffset` answers both, and returns null rather than zero for "do not
   * move" — the offset is applied to the *place*, so zero would mean centring
   * the camera on it, which is a move and the loudest one available.
   *
   * Applied to the place rather than to the current centre, which is what keeps
   * this idempotent: re-running while its own animation is still in flight
   * computes the same destination rather than travelling again from wherever
   * the camera has got to.
   *
   * Not a re-frame: the zoom is untouched and `frameToken` is not involved, so
   * this stays inside "nothing else moves the camera". It is the same request
   * the person already made, honoured against a map that is now smaller than it
   * was.
   */
  /**
   * Every point that gets a pin: the trip's drawn set, plus a revealed one.
   *
   * Used only where a pin is drawn or lifted clear of chrome. Framing and the
   * "any markers in view" question both stay on `groups`, because a pin shown
   * because somebody named it is not evidence about what the filter left.
   */
  const shown = useMemo(
    () => (revealed ? [...groups, revealed] : groups),
    [groups, revealed],
  )

  useEffect(() => {
    if (!map || !covered) return

    const described =
      draft ??
      shown.find((group) => group.key === selectedKey)?.markers[0] ??
      null
    if (!described) return

    const container = map.getContainer()
    const where = map.project([described.lng, described.lat])
    const dy = liftOffset(
      { x: where.x, y: where.y },
      covered,
      { width: container.clientWidth, height: container.clientHeight },
      // A margin, so a pin resting a few pixels above the chrome still gets
      // lifted clear of it rather than sitting on its edge.
      LIFT_MARGIN,
    )
    if (dy === null) return

    const target = offsetCenter(
      { lng: described.lng, lat: described.lat },
      map.getZoom(),
      0,
      dy,
    )
    map.easeTo({ center: [target.lng, target.lat], duration: 260 })
  }, [map, covered, draft, selectedKey, shown])

  /**
   * The style has to be fetched and transformed before the renderer can be
   * given one, so it is state rather than a value.
   */
  const [style, setStyle] = useState<StyleDocument | null>(null)
  const [styleError, setStyleError] = useState<string | null>(null)

  // Callbacks reached through refs so that the effects binding them to the
  // renderer do not tear down and rebuild every time the parent re-renders.
  // Written in an effect rather than during render: a ref mutated mid-render is
  // a value React is entitled to discard, and the lint rule that says so is
  // right even though this particular case would have worked.
  const handlers = useRef({ onSelectGroup, onDropAt, onDraftMove })
  useEffect(() => {
    handlers.current = { onSelectGroup, onDropAt, onDraftMove }
  })

  /**
   * Framing happens from the markers present at mount, and afterwards only when
   * `frameToken` changes — which is to say, only when somebody asked. Re-framing
   * whenever the data reference changed would yank the view back from wherever
   * they had panned it, and saving a marker would move the map.
   */
  const initialFraming = useRef(frameTo)

  /** Fetch and repaint. Re-runs when the ground changes, and only then. */
  useEffect(() => {
    let live = true

    themedBasemap(mode).then(
      (document) => {
        if (live) setStyle(document)
      },
      (cause: unknown) => {
        if (!live) return
        setStyleError(
          cause instanceof Error ? cause.message : 'the map style could not be loaded',
        )
      },
    )

    return () => {
      live = false
    }
  }, [mode])

  /** The map itself, created once the first style has arrived. */
  useEffect(() => {
    const container = containerRef.current
    if (!container || !style) return

    // The measured surface, not the window: the map does not fill the viewport,
    // and framing against the wrong box puts markers under the edges.
    const rect = container.getBoundingClientRect()
    const viewport =
      rect.width > 0 && rect.height > 0
        ? { width: rect.width, height: rect.height }
        : // Styles have not resolved yet. A wrong-but-sane frame beats a
          // division by zero.
          DEFAULT_VIEWPORT

    const camera = frameAround(initialFraming.current, viewport, floorRef.current)

    const instance = new MapLibreMap({
      container,
      style: asRendererStyle(style),
      center: [camera.center.lng, camera.center.lat],
      zoom: camera.zoom,
      // Our range, not the renderer's. `maplibre-gl` defaults to 0-22 while
      // `fitBounds` never returns more than 20, so without this the end of the
      // range depended on which instrument you left the camera with: a wheel
      // could reach 22 and nothing could frame its way back. Binding it here
      // makes the wheel, a trackpad pinch, MapLibre's own keyboard zoom and the
      // buttons below all agree, and the buttons inherit the clamp rather than
      // being the only thing that knows about it.
      minZoom: MIN_ZOOM,
      maxZoom: MAX_ZOOM,
      // Not compact: compact collapses to an "i" button, and a button that
      // says nothing until it is pressed does not credit anybody. Attribution
      // is a licence condition of the tiles, not a decoration.
      attributionControl: { compact: false, customAttribution: ATTRIBUTION },
    })

    setMap(instance)

    return () => {
      instance.remove()
      setMap(null)
    }
    // Created from the first style only. Later styles go through `setStyle`
    // below, which keeps the camera and the markers where they are — rebuilding
    // the map on a theme change would throw the view away.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [style !== null])

  /**
   * A theme change repaints the map in place.
   *
   * `setStyle` swaps the document without touching the camera, and the markers
   * are DOM elements the renderer only positions — so nothing is refetched,
   * nothing is remounted, and the view does not move.
   */
  const appliedStyle = useRef<StyleDocument | null>(null)
  useEffect(() => {
    if (!map || !style) return
    if (appliedStyle.current === null) {
      appliedStyle.current = style
      return
    }
    if (appliedStyle.current === style) return

    appliedStyle.current = style
    map.setStyle(asRendererStyle(style))
  }, [map, style])

  /** Where the map is looking, kept current for whatever wants to bias by it. */
  useEffect(() => {
    if (!map) return

    const report = () => {
      const centre = map.getCenter()
      centreRef.current = { lng: centre.lng, lat: centre.lat }
    }

    report()
    map.on('move', report)
    return () => {
      map.off('move', report)
    }
  }, [map, centreRef])

  /**
   * How far in the map is, read when it stops rather than while it moves.
   *
   * `zoomend` and never `zoom` or `move`. The distinction is the whole reason
   * the centre beside this is a ref: the live events fire per frame, and a
   * value in state that changes per frame re-renders the workspace — and with
   * it every marker's props — through a gesture that is about looking, not
   * about the data.
   */
  useEffect(() => {
    if (!map) return

    const report = () => setZoom(map.getZoom())

    report()
    map.on('zoomend', report)
    return () => {
      map.off('zoomend', report)
    }
  }, [map])

  /**
   * Whether anything drawn is on screen, answered after the camera settles and
   * again whenever the drawn set changes.
   *
   * The second half is what makes it useful: narrowing a filter while the map
   * sits still moves no camera, so `moveend` never fires and only re-running on
   * `groups` notices that the survivors are all somewhere else.
   *
   * Reads the camera rather than the last reported centre, because a marker at
   * the edge of the view is in it and a centre cannot say that.
   *
   * The callback is a dependency rather than reached through the handlers ref.
   * That ref exists to keep the renderer bindings — clicks, drags — from being
   * torn down and rebuilt on every parent render, and this effect binds one
   * cheap listener, so it has nothing to protect. Going through the ref anyway
   * broke immediately: the ref object survives a hot reload while the code that
   * built it does not, so adding a handler to it crashed every already-open tab
   * with a key the surviving object had never had.
   */
  useEffect(() => {
    if (!map) return

    const report = () => {
      const bounds = map.getBounds()
      onMarkersInView(
        groups.some((group) => bounds.contains([group.lng, group.lat])),
      )
    }

    report()
    map.on('moveend', report)
    return () => {
      map.off('moveend', report)
    }
  }, [map, groups, onMarkersInView])

  /**
   * Markers are mounted in their own effect so that changing them never touches
   * the camera.
   *
   * Each one is a React root rendered into an element the renderer owns. That
   * buys one icon mapping and one pin shape for the map, the list, and the
   * details panel — the alternative was building an SVG by hand here and
   * keeping it in step with a component by eye.
   */
  useEffect(() => {
    if (!map) return

    const mounted = shown.map((group) => {
      const element = document.createElement('button')
      element.type = 'button'
      element.className = styles.marker
      element.title = group.count > 1 ? `${group.count} places here` : group.view.label
      element.setAttribute(
        'aria-label',
        group.count > 1
          ? `${group.count} places here`
          : `${group.view.label} (${group.view.typeLabel})`,
      )

      element.addEventListener('click', (event) => {
        // Otherwise the map treats it as a click on the surface underneath —
        // which while the drop mode is armed would place a second pin on top of
        // this one.
        event.stopPropagation()
        handlers.current.onSelectGroup(group)
      })

      const root = createRoot(element)
      root.render(
        <Pin
          view={group.view}
          count={group.count}
          selected={group.key === selectedKey}
        />,
      )

      const marker = new MapLibreMarker({
        element,
        offset: offsetFor(group.view.anchor, group.view.size),
      })
        .setLngLat([group.lng, group.lat])
        .addTo(map)

      return { marker, root }
    })

    return () => {
      for (const { marker, root } of mounted) {
        marker.remove()
        // Unmounting synchronously inside a cleanup runs while React may still
        // be rendering, which it warns about; a microtask puts it after.
        queueMicrotask(() => root.unmount())
      }
    }
  }, [map, shown, selectedKey])

  /**
   * Pointing at the map creates a place, but only when that was armed first.
   *
   * Without arming, every stray click while panning would drop a pin. The
   * cursor changes so that the armed state is visible rather than remembered.
   */
  useEffect(() => {
    if (!map || !dropping) return

    const canvas = map.getCanvas()
    const previousCursor = canvas.style.cursor
    canvas.style.cursor = 'crosshair'

    const drop = (event: { lngLat: { lng: number; lat: number } }) => {
      handlers.current.onDropAt({ lng: event.lngLat.lng, lat: event.lngLat.lat })
    }

    map.on('click', drop)
    return () => {
      map.off('click', drop)
      canvas.style.cursor = previousCursor
    }
  }, [map, dropping])

  /**
   * The unsaved marker.
   *
   * Created when one starts existing and removed when it stops, keyed on
   * whether there is one rather than on where it is — rebuilding it on every
   * coordinate change would destroy the element mid-drag and drop the gesture.
   * Its position is synced separately below.
   */
  useEffect(() => {
    if (!map || !hasDraft) return

    const element = document.createElement('div')
    element.className = `${styles.marker} ${styles.draft}`
    element.setAttribute('aria-label', 'New place, not yet saved')
    element.title = 'Drag to adjust, then save'

    const root = createRoot(element)
    root.render(<DraftPin />)

    const instance = new MapLibreMarker({
      element,
      draggable: true,
      offset: offsetFor({ x: 0.5, y: 1 }, { width: 32, height: 42 }),
    })
      .setLngLat([draft.lng, draft.lat])
      .addTo(map)

    instance.on('dragend', () => {
      const position = instance.getLngLat()
      handlers.current.onDraftMove({ lng: position.lng, lat: position.lat })
    })

    draftMarkerRef.current = instance

    return () => {
      instance.remove()
      draftMarkerRef.current = null
      queueMicrotask(() => root.unmount())
    }
    // `draft` is read once, for the starting position. Every later move goes
    // through the sync effect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, hasDraft])

  useEffect(() => {
    if (draft && draftMarkerRef.current) {
      draftMarkerRef.current.setLngLat([draft.lng, draft.lat])
    }
  }, [draft])

  /**
   * A requested re-frame: selecting a city. Never automatic — the first render
   * is skipped because mounting already framed, and a city holding no markers
   * leaves the camera exactly where it is rather than flying somewhere arbitrary.
   */
  const framedToken = useRef(frameToken)
  useEffect(() => {
    if (!map) return
    if (framedToken.current === frameToken) return
    framedToken.current = frameToken

    if (frameTo.length === 0) return

    const rect = map.getContainer().getBoundingClientRect()
    const viewport =
      rect.width > 0 && rect.height > 0
        ? { width: rect.width, height: rect.height }
        : DEFAULT_VIEWPORT

    const camera = frameAround(frameTo, viewport, floorRef.current)
    map.flyTo({
      center: [camera.center.lng, camera.center.lat],
      zoom: camera.zoom,
    })
  }, [map, frameToken, frameTo])

  /**
   * A failed style is reported rather than drawn around.
   *
   * The alternative — mounting the map with no style — is a blank canvas with
   * correctly-placed pins over it, which is the exact symptom of a bug already
   * fixed once from a different cause, and reads as a styling problem every
   * time.
   */
  if (styleError !== null) {
    return (
      <div className={styles.failure} role="alert">
        <p className={styles.failureTitle}>The map could not be loaded</p>
        <p className={styles.failureDetail}>
          The place data is fine — {styleError}. Your saved places are still
          here; only the map underneath them is missing.
        </p>
      </div>
    )
  }

  return (
    <div className={styles.frame}>
      <div ref={containerRef} className={styles.canvas} />

      {/*
        The sight, drawn only while the map is armed.

        The other half of `marker-capture`'s "how a position is indicated
        follows the shape of the screen": a pointer indicates a coordinate
        directly, and a screen operated by touch frames the map under a fixed
        sight instead — because a finger covers the place it is aiming at.
        Neither is a fallback for the other, and the laptop keeps arming and
        tapping at every width above the phone's.

        Not a marker: it belongs to the screen rather than to the map, so it
        must not move when the map does. `pointer-events: none`, so the map
        underneath still pans and zooms with the sight sitting over it.
      */}
      {dropping ? <span className={styles.sight} aria-hidden /> : null}

      {/*
        The licence credit, ours rather than the renderer's.

        Only at a phone width, where a bar flush to the bottom edge lands on top
        of MapLibre's own control — and the credit is a condition of the tiles,
        not decoration, so being covered is a licence problem rather than an
        untidy one. MapLibre's control is stood down at the same width in the
        stylesheet, so exactly one credit is ever on screen and exactly one is
        ever in the accessibility tree.

        The phone answered this first and this is the same answer: our own strip
        riding above whatever holds the floor, expanding into the projects the
        map is built from. `ATTRIBUTION` and `MAP_CREDITS` both come from
        `@pinpoint/map`, so neither application gets to invent its own account
        of where the map came from.

        A `Menu`, which means the sheet it opens is dismissed by an outside
        press and by Escape and hands focus back — the same contract as every
        other panel in the chrome, for free.
      */}
      <div
        ref={creditRef}
        className={styles.credit}
        style={{ bottom: `calc(${floor}px + var(--pp-space-sm))` }}
      >
        <Menu
          name="About this map"
          label={ATTRIBUTION}
          tone="quiet"
          open={creditsOpen}
          onOpen={setCreditsOpen}
        >
          <p className={styles.creditsHeading}>About this map</p>
          <p className={styles.creditsBlurb}>Four projects, none of them ours.</p>
          {MAP_CREDITS.map((credit) => (
            <a
              key={credit.url}
              href={credit.url}
              target="_blank"
              rel="noreferrer noopener"
              className={styles.creditRow}
            >
              <span className={styles.creditName}>{credit.name}</span>
              <span className={styles.creditRole}>{credit.role}</span>
            </a>
          ))}
        </Menu>
      </div>

      {/*
        Zoom, as something you can see.

        Drawn only once the map exists, which is the same condition as "the map
        is visible" — there is nothing to zoom before that, and a control over a
        box that is not yet a map would be the only thing on screen.

        Not a re-frame. `frameToken` is untouched and the centre does not move,
        so this stays inside `map-rendering`'s "nothing else SHALL move the
        camera": the person asked, with a button instead of a wheel.

        The live zoom is read from the map at the moment of the press rather
        than from the state above. They agree — the state is written on every
        settle — but the map is the thing that knows, and a press is exactly the
        moment when asking it costs nothing.
      */}
      {map ? (
        <div
          className={styles.zoom}
          role="group"
          aria-label="Zoom"
          // Rises off the credit rather than clearing a height guessed at once.
          // The gap is a token; only the thing being cleared is a measurement.
          /*
           * Above everything standing on this edge, which the specification
           * requires by name: the zoom control "overlaps neither it nor
           * anything else standing on that edge", at any window or device size.
           *
           * Three terms, and at most two are ever non-zero. `cornerHeight` is
           * MapLibre's credit and belongs to the laptop; `floor` and
           * `creditHeight` are the toolbar and our own credit and belong to the
           * phone. Adding all three is therefore the same as choosing between
           * them, without this file having to ask how wide the window is.
           *
           * That was the intent and it was not true. `floor` was measured as
           * the distance from the map's bottom edge up to the top of the tools,
           * which at a laptop width are in the bar *above* the map — so it came
           * out larger than the map and this sum put the control off the
           * document, at every laptop width, reachable by nothing. It is true
           * now because `floor` counts only chrome standing right across the
           * map, and at a laptop width nothing does.
           */
          style={{
            bottom: `calc(${cornerHeight + floor + creditHeight}px + var(--pp-space-md))`,
          }}
        >
          <ZoomButton
            direction={1}
            // A step that arrives where it started is a control with nothing
            // left to do. Asking the shared function rather than comparing
            // against `MAX_ZOOM` here keeps one opinion about where the range
            // ends, and sidesteps the float comparison entirely.
            spent={zoom !== null && zoomStep(zoom, 1) === zoom}
            onPress={() =>
              map.zoomTo(zoomStep(map.getZoom(), 1), { duration: 200 })
            }
          />
          <ZoomButton
            direction={-1}
            spent={zoom !== null && zoomStep(zoom, -1) === zoom}
            onPress={() =>
              map.zoomTo(zoomStep(map.getZoom(), -1), { duration: 200 })
            }
          />
        </div>
      ) : null}
    </div>
  )
}
