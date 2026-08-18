'use client'

import type { Marker } from '@pinpoint/core'
import {
  ATTRIBUTION,
  DEFAULT_VIEWPORT,
  fitBounds,
  type LngLat,
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
import { useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'

import { DraftPin, Pin } from '@/app/_components/pin'
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
}: {
  groups: readonly MarkerGroup<Marker>[]
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
  const draftMarkerRef = useRef<MapLibreMarker | null>(null)
  const hasDraft = draft !== null

  const mode = useColourScheme()

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
  const handlers = useRef({ onSelectGroup, onDropAt, onDraftMove, onMarkersInView })
  useEffect(() => {
    handlers.current = { onSelectGroup, onDropAt, onDraftMove, onMarkersInView }
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

    const camera = fitBounds([...initialFraming.current], { viewport })

    const instance = new MapLibreMap({
      container,
      style: asRendererStyle(style),
      center: [camera.center.lng, camera.center.lat],
      zoom: camera.zoom,
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
   * Whether anything drawn is on screen, answered after the camera settles and
   * again whenever the drawn set changes.
   *
   * The second half is what makes it useful: narrowing a filter while the map
   * sits still moves no camera, so `moveend` never fires and only re-running on
   * `groups` notices that the survivors are all somewhere else.
   *
   * Reads the camera rather than the last reported centre, because a marker at
   * the edge of the view is in it and a centre cannot say that.
   */
  useEffect(() => {
    if (!map) return

    const report = () => {
      const bounds = map.getBounds()
      handlers.current.onMarkersInView(
        groups.some((group) => bounds.contains([group.lng, group.lat])),
      )
    }

    report()
    map.on('moveend', report)
    return () => {
      map.off('moveend', report)
    }
  }, [map, groups])

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

    const mounted = groups.map((group) => {
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
  }, [map, groups, selectedKey])

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

    const camera = fitBounds([...frameTo], { viewport })
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

  return <div ref={containerRef} className={styles.canvas} />
}
