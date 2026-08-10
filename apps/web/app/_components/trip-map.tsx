'use client'

import type { Marker } from '@pinpoint/core'
import {
  ATTRIBUTION,
  DEFAULT_VIEWPORT,
  fitBounds,
  styleUrl,
  type LngLat,
  type MarkerGroup,
  type MarkerView,
} from '@pinpoint/map'
import {
  COLOUR,
  MARKER_BADGE_SIZE,
  MARKER_FOREGROUND,
  MARKER_SIZE,
  RADIUS,
  SPACE,
} from '@pinpoint/tokens'
// Named imports, not a default: maplibre-gl v6 has no default export, and the
// `import maplibregl from 'maplibre-gl'` written all over the internet is v4
// advice. `Map` and `Marker` are both aliased — the first collides with the
// global, the second with our own domain type.
import { MapLibreMap, Marker as MapLibreMarker, setWorkerUrl } from 'maplibre-gl'
import { useEffect, useRef, useState } from 'react'

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
 * blank canvas — it reads as a styling problem and is not one.
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
 * The web half of the portability boundary.
 *
 * Everything decided here is bound to `maplibre-gl`: creating the map, mounting
 * marker elements, wiring clicks and drags. Everything *decided* — the style,
 * the camera, a marker's icon and colour, which markers share a point — comes
 * from `@pinpoint/map`, which imports no renderer at all. The mobile app binds
 * the same values to a different library and gets the same map.
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
  draft,
  dropping,
  onDropAt,
  onDraftMove,
  frameTo,
  frameToken,
  centreRef,
}: {
  groups: readonly MarkerGroup<Marker>[]
  onSelectGroup: (group: MarkerGroup<Marker>) => void
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
}) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [map, setMap] = useState<MapLibreMap | null>(null)
  const draftMarkerRef = useRef<MapLibreMarker | null>(null)
  const hasDraft = draft !== null

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

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

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
      style: styleUrl(),
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
  }, [])

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
   * Markers are mounted in their own effect so that changing them never touches
   * the camera.
   */
  useEffect(() => {
    if (!map) return

    const instances = groups.map((group) =>
      new MapLibreMarker({
        element: pinElement(group, () => handlers.current.onSelectGroup(group)),
      })
        .setLngLat([group.lng, group.lat])
        .addTo(map),
    )

    return () => {
      for (const instance of instances) instance.remove()
    }
  }, [map, groups])

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

    const instance = new MapLibreMarker({
      element: draftPinElement(),
      draggable: true,
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

  return <div ref={containerRef} style={{ position: 'absolute', inset: 0 }} />
}

/**
 * A marker element.
 *
 * View-based rather than a symbol layer, and that follows from the icons being
 * emoji: a symbol layer draws from a sprite atlas, and rasterising emoji into
 * one per platform would produce output that differs between the platforms it
 * is meant to unify. View-based markers degrade in the hundreds; a trip holds
 * tens.
 *
 * No permanent label. Twenty names at city zoom overlap into unreadable text,
 * and the question the map answers at that zoom is which places are near each
 * other, not what each is called. The name is on the pin's tooltip and in the
 * details it opens.
 */
function pinElement(group: MarkerGroup<Marker>, onSelect: () => void): HTMLElement {
  const view: MarkerView = group.view

  const button = document.createElement('button')
  button.type = 'button'
  button.title = group.count > 1 ? `${group.count} places here` : view.label
  button.setAttribute(
    'aria-label',
    group.count > 1 ? `${group.count} places here` : `${view.label} (${view.typeLabel})`,
  )
  Object.assign(button.style, {
    // Deliberately no `position`. MapLibre's own stylesheet sets
    // `.maplibregl-marker { position: absolute; top: 0; left: 0 }` and applies
    // the map transform on top of that; an inline `position: relative` beats
    // the class, drops the pin back into normal flow, and the transform then
    // offsets it from wherever flow put it. Every marker ends up carrying a
    // fixed screen-pixel error — which pans convincingly and drifts off the
    // map the moment you zoom.
    //
    // The badge below still anchors correctly: `absolute` establishes a
    // containing block exactly as `relative` does.
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    // With a 2px border, content-box would make this 36px and put the
    // centre-anchored pin 2px off in each axis.
    boxSizing: 'border-box',
    width: `${MARKER_SIZE}px`,
    height: `${MARKER_SIZE}px`,
    padding: '0',
    // Buttons carry a UA margin in some browsers, and a margin on an
    // absolutely-positioned marker displaces it from the point it names.
    margin: '0',
    borderRadius: `${RADIUS.pill}px`,
    backgroundColor: view.colour,
    border: `2px solid ${view.foreground}`,
    boxShadow: '0 1px 4px rgba(0, 0, 0, 0.35)',
    fontSize: `${Math.round(MARKER_SIZE * 0.55)}px`,
    lineHeight: '1',
    cursor: 'pointer',
  } satisfies Partial<CSSStyleDeclaration>)
  button.textContent = view.icon

  if (group.count > 1) {
    // The badge is the entire mechanism that stops the pin underneath from
    // being invisible forever. Identical coordinates are the same pixel at
    // every zoom, so nothing about panning or zooming can reveal it.
    const badge = document.createElement('span')
    badge.textContent = String(group.count)
    Object.assign(badge.style, {
      position: 'absolute',
      top: `-${SPACE.xs}px`,
      right: `-${SPACE.xs}px`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: `${MARKER_BADGE_SIZE}px`,
      height: `${MARKER_BADGE_SIZE}px`,
      borderRadius: `${RADIUS.pill}px`,
      backgroundColor: COLOUR.text,
      color: MARKER_FOREGROUND,
      border: `1px solid ${MARKER_FOREGROUND}`,
      fontSize: '11px',
      fontWeight: '700',
    } satisfies Partial<CSSStyleDeclaration>)
    button.appendChild(badge)
  }

  button.addEventListener('click', (event) => {
    // Otherwise the map treats it as a click on the surface underneath — which
    // while the drop mode is armed would place a second pin on top of this one.
    event.stopPropagation()
    onSelect()
  })

  return button
}

/**
 * The unsaved marker's element.
 *
 * Deliberately unlike a saved pin: dashed, hollow, and carrying no type icon,
 * because it is not yet a place and showing it as one would make a person think
 * they had already saved it.
 *
 * Drawn above every saved marker so that dropping one onto an existing pin
 * leaves it visible and draggable rather than buried under the thing it landed
 * on — the case where being able to nudge it matters most.
 */
function draftPinElement(): HTMLElement {
  const element = document.createElement('div')
  element.setAttribute('aria-label', 'New place, not yet saved')
  element.title = 'Drag to adjust, then save'
  Object.assign(element.style, {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxSizing: 'border-box',
    width: `${MARKER_SIZE}px`,
    height: `${MARKER_SIZE}px`,
    borderRadius: `${RADIUS.pill}px`,
    backgroundColor: COLOUR.surface,
    border: `2px dashed ${COLOUR.text}`,
    boxShadow: '0 1px 6px rgba(0, 0, 0, 0.4)',
    fontSize: `${Math.round(MARKER_SIZE * 0.5)}px`,
    lineHeight: '1',
    cursor: 'grab',
    zIndex: '10',
  } satisfies Partial<CSSStyleDeclaration>)
  element.textContent = '+'

  return element
}
