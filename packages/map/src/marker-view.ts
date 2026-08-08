import { MARKER_FAMILY_COLOURS, MARKER_FOREGROUND } from '@pinpoint/tokens'

import {
  markerTypeOf,
  type MarkerFamily,
  type MarkerTypeDefinition,
} from './marker-type'
import type { LngLat } from './types'

/**
 * Turning a marker into something a renderer can draw, without knowing what a
 * renderer is.
 *
 * The rule the specification states is that applications render a description
 * and never inspect a marker's type to decide how it looks. That is what keeps
 * web and mobile identical: there is one place a temple becomes a ⛩️ on a
 * slate pin, and both platforms read it.
 */

/**
 * Every family has a colour, checked at compile time.
 *
 * `@pinpoint/tokens` cannot import `MarkerFamily` — it declares no dependencies
 * and this package depends on it, so the import would point the wrong way. This
 * assignment is the tie instead: adding a family without adding its colour
 * fails to typecheck here rather than rendering an undefined colour somewhere
 * downstream.
 */
const FAMILY_COLOUR: Record<MarkerFamily, string> = MARKER_FAMILY_COLOURS

/**
 * What the descriptor needs from a marker.
 *
 * Structural on purpose. `Marker` from `@pinpoint/core` satisfies it without
 * this package depending on `@pinpoint/core` — the same trick `LngLat` uses,
 * and the reason this package can sit at the base of the graph.
 */
export interface MarkerViewInput extends LngLat {
  name: string
  type?: string | null
}

/** A platform-neutral description of one drawn marker. */
export interface MarkerView {
  lng: number
  lat: number
  /** Drawn as-is. Emoji today; see `MarkerTypeDefinition.icon`. */
  icon: string
  /** A six-digit hex literal from `@pinpoint/tokens`. */
  colour: string
  /** Drawn on top of `colour` — the glyph background and the pin's ring. */
  foreground: string
  /** The marker's own name. Not drawn permanently beside the pin; see the spec. */
  label: string
  /** The resolved type, for a detail view that wants to say "Temple". */
  typeId: string
  typeLabel: string
  family: MarkerFamily
}

/**
 * Describe one marker.
 *
 * Pure, total, and never throws: an unrecognised stored type resolves to the
 * fallback rather than being omitted. A marker that does not render is
 * indistinguishable from a marker that was never saved, and the person looking
 * at the map has no way to tell which happened.
 */
export function markerView(marker: MarkerViewInput): MarkerView {
  const type: MarkerTypeDefinition = markerTypeOf(marker.type)

  return {
    lng: marker.lng,
    lat: marker.lat,
    icon: type.icon,
    colour: FAMILY_COLOUR[type.family],
    foreground: MARKER_FOREGROUND,
    label: marker.name,
    typeId: type.id,
    typeLabel: type.label,
    family: type.family,
  }
}

/**
 * One drawn point, and everything sitting on it.
 *
 * Generic over the caller's marker so an application gets its own rows back
 * from a selection rather than a copy stripped down to what the map needed.
 */
export interface MarkerGroup<T extends MarkerViewInput> {
  /** Stable across renders for the same position. Usable as a list key. */
  key: string
  lng: number
  lat: number
  /** How many markers are here. `1` for the ordinary case. */
  count: number
  /** The markers at this point, in the order they were given. */
  markers: readonly T[]
  /** One description per marker above, index for index. */
  views: readonly MarkerView[]
  /**
   * What to draw at this point. The first marker's description — an arbitrary
   * but stable choice, because a group of different types has no single right
   * icon and the count badge is what says there is more here.
   */
  view: MarkerView
}

/**
 * `-0` and `0` are different keys under string conversion and identical
 * positions on a map. Normalising here stops a marker at longitude `-0` from
 * rendering as a separate point from one at `0`.
 */
function coordinateKey(lng: number, lat: number): string {
  return `${lng === 0 ? 0 : lng},${lat === 0 ? 0 : lat}`
}

/**
 * Collapse markers sharing an exact position into one drawn point.
 *
 * A geocoder frequently answers with a building's centre rather than the place
 * inside it, so two markers can hold genuinely identical coordinates. Identical
 * coordinates render to the same pixel at every zoom, which means the marker
 * drawn underneath is unreachable forever and looks like it was never saved —
 * zooming cannot separate what is not separate.
 *
 * Equality is exact, not "within a few metres". Two markers a block apart are
 * two points that overlap at low zoom and separate as you zoom in, which is the
 * behaviour a map should have; only genuinely identical coordinates need this.
 *
 * Stored coordinates are never modified. Nudging duplicates apart is the
 * obvious fix and the wrong one — the map's value depends on the positions
 * being true.
 */
export function groupCoincident<T extends MarkerViewInput>(
  markers: readonly T[],
): MarkerGroup<T>[] {
  const byPosition = new Map<string, { markers: T[]; views: MarkerView[] }>()

  for (const marker of markers) {
    const key = coordinateKey(marker.lng, marker.lat)
    let entry = byPosition.get(key)
    if (!entry) {
      entry = { markers: [], views: [] }
      byPosition.set(key, entry)
    }
    entry.markers.push(marker)
    entry.views.push(markerView(marker))
  }

  // Insertion order, so the drawn order follows the order the caller supplied
  // rather than an accident of hashing.
  return [...byPosition].map(([key, entry]) => ({
    key,
    lng: entry.markers[0]!.lng,
    lat: entry.markers[0]!.lat,
    count: entry.markers.length,
    markers: entry.markers,
    views: entry.views,
    view: entry.views[0]!,
  }))
}
