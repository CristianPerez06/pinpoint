'use client'

import type { Marker } from '@pinpoint/core'
import {
  ATTRIBUTION,
  DEFAULT_VIEWPORT,
  fitBounds,
  groupCoincident,
  styleUrl,
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
import { MapLibreMap, Marker as MapLibreMarker } from 'maplibre-gl'
import { useEffect, useMemo, useRef, useState } from 'react'

import { MarkerDetails, type Selection } from '@/app/_components/marker-details'

// Without this the map renders as a blank box and reports nothing at all.
import 'maplibre-gl/dist/maplibre-gl.css'

/**
 * The web half of the portability boundary.
 *
 * Everything decided here is bound to `maplibre-gl`: creating the map, mounting
 * marker elements, wiring clicks. Everything *decided* — the style, the camera,
 * a marker's icon and colour, which markers share a point — comes from
 * `@pinpoint/map`, which imports no renderer at all. The mobile app binds the
 * same values to a different library and gets the same map.
 *
 * `'use client'` is not a preference. The renderer needs a canvas and a DOM, so
 * there is nothing for a server to render.
 */
export function TripMap({ markers }: { markers: readonly Marker[] }) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [map, setMap] = useState<MapLibreMap | null>(null)
  const [selection, setSelection] = useState<Selection | null>(null)

  const groups = useMemo(() => groupCoincident([...markers]), [markers])

  /**
   * Framing happens once, from the markers present at mount, and never again.
   * Re-framing when the data reference changes would yank the view back from
   * wherever the person had panned it.
   */
  const framing = useRef(markers)

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

    const camera = fitBounds([...framing.current], { viewport })

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

  /**
   * Markers are mounted in their own effect so that changing them never touches
   * the camera. Read-only today; this is the shape the write path needs.
   */
  useEffect(() => {
    if (!map) return

    const instances = groups.map((group) =>
      new MapLibreMarker({ element: pinElement(group, () => {
        setSelection({ group, index: group.count === 1 ? 0 : null })
      }) })
        .setLngLat([group.lng, group.lat])
        .addTo(map),
    )

    return () => {
      for (const instance of instances) instance.remove()
    }
  }, [map, groups])

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div ref={containerRef} style={{ position: 'absolute', inset: 0 }} />

      {selection ? (
        <MarkerDetails
          selection={selection}
          onChoose={(index) => setSelection({ ...selection, index })}
          onBack={() => setSelection({ ...selection, index: null })}
          // Dismissal touches no map method, so the camera cannot move.
          onDismiss={() => setSelection(null)}
        />
      ) : null}
    </div>
  )
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
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: `${MARKER_SIZE}px`,
    height: `${MARKER_SIZE}px`,
    padding: '0',
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
    // Otherwise the map treats it as a click on the surface underneath.
    event.stopPropagation()
    onSelect()
  })

  return button
}
