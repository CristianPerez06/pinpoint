import {
  MARKER_ANCHOR,
  MARKER_TYPE_COLOURS,
  MARKER_SIZE,
  type Themed,
} from '@pinpoint/tokens'

import {
  markerTypeOf,
  type MarkerIconName,
  type MarkerType,
  type MarkerTypeDefinition,
} from './marker-type'
import type { LngLat } from './types'

/**
 * Turning a marker into something a renderer can draw, without knowing what a
 * renderer is — or, now, what a theme is.
 *
 * The rule the specification states is that applications render a description
 * and never inspect a marker's type to decide how it looks. What the description
 * carries changed with theming: a type *name* rather than a colour, and an icon
 * *name* rather than a glyph.
 *
 * That is not a weakening of the rule, it is the only way to keep it. A colour
 * now depends on which ground the interface is drawn on, and this package has
 * no business knowing that; an icon is a rendered component, and a package
 * declaring no third-party dependencies cannot hold one. Both are resolved by
 * the application — the type through the shared tokens, the icon through the
 * platform's icon set — and neither application decides *which* colour or
 * *which* icon, which is the part that had to stay shared.
 */

/**
 * Every type has a colour, checked at compile time.
 *
 * `@pinpoint/tokens` cannot import `MarkerType` — it declares no third-party
 * dependencies and this package depends on it, so the import would point the
 * wrong way. This assertion is the tie instead: adding a type without adding its
 * colour fails to typecheck here rather than rendering an undefined colour
 * somewhere downstream.
 *
 * It is also what makes "a new type costs a colour" a build error rather than a
 * convention.
 */
MARKER_TYPE_COLOURS satisfies Record<MarkerType, Themed>

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
  /** Optional so a draft marker, which has never been anywhere, needs no answer. */
  visited?: boolean | null
}

/**
 * Where a drawn marker meets its coordinate, normalised against the drawn box.
 *
 * `{ x: 0.5, y: 1 }` is the bottom centre — the teardrop's point.
 */
export interface MarkerAnchor {
  x: number
  y: number
}

/** A platform-neutral description of one drawn marker. */
export interface MarkerView {
  lng: number
  lat: number
  /**
   * Names an icon rather than being one. The application resolves it against
   * its own icon set; an unresolvable name draws the fallback type's icon.
   */
  icon: MarkerIconName
  /**
   * Names a colour rather than being one. The application resolves it through
   * `@pinpoint/tokens` for whichever ground it is currently drawing on.
   *
   * This is the resolved type, so a marker stored under a retired identifier
   * carries the type that replaced it rather than the string in the database.
   */
  type: MarkerType
  /** The marker's own name. Not drawn permanently beside the pin; see the spec. */
  label: string
  /** The resolved type, for a detail view that wants to say "Temple". */
  typeId: string
  typeLabel: string
  /**
   * The drawn box, and which point of it sits on `lng`/`lat`.
   *
   * Carried here rather than left to each application because the previous
   * defect — markers drifting off their coordinates as the map zoomed — lived
   * exactly in the gap between two applications each deciding their own offset.
   * Fixing one left the other wrong, and the symptom was invisible at the zoom
   * the map opens at.
   */
  size: { width: number; height: number }
  anchor: MarkerAnchor
  /** Whether the trip has been here. Drawn as muting, never as a colour. */
  visited: boolean
  /**
   * How solidly to draw this marker, between 0 and 1.
   *
   * Here rather than in each application for the same reason the box and anchor
   * are: two applications choosing their own amount is how they drift apart, and
   * the specification requires them to produce the same map from the same data.
   *
   * Muting rather than recolouring is deliberate. Colour names the type and only
   * the type, so a second meaning cannot be given to it — and lightness is
   * already spoken for here, which is why `place` is separated from `culture` by
   * hue rather than by being paler.
   */
  opacity: number
}

/**
 * How solidly a visited marker is drawn.
 *
 * Low enough to read as done at a glance among unvisited pins, high enough that
 * the glyph and the type colour are still legible: a visited place is still a
 * place, and somebody standing in the street may well be looking for the one
 * they already found.
 */
export const VISITED_OPACITY = 0.45

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
    type: type.id,
    label: marker.name,
    typeId: type.id,
    typeLabel: type.label,
    size: { width: MARKER_SIZE.width, height: MARKER_SIZE.height },
    anchor: { x: MARKER_ANCHOR.x, y: MARKER_ANCHOR.y },
    visited: marker.visited === true,
    opacity: marker.visited === true ? VISITED_OPACITY : 1,
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

/**
 * Which of a trip's markers sit exactly on a position, and under which key.
 *
 * `groupCoincident` asked in the other direction. That is the whole design of
 * this function: search hands over a position and needs to know whether the trip
 * already holds it, which is the same question the map answers every render when
 * it decides which markers share a drawn point.
 *
 * It shares `coordinateKey` rather than comparing coordinates itself, and that
 * is load-bearing rather than tidy. Both applications address an open details
 * card by the group key this normalisation produces. A match computed by a
 * separately written comparison could agree that two positions are the same
 * while disagreeing about the key they fall under, and the failure is a card
 * opening on a group that does not contain the marker it was opened for.
 *
 * Equality is exact, for the reason written above `groupCoincident`, and one
 * more that belongs here: a marker saved from search stores the geocoder's
 * position unchanged, so searching the same place again yields the identical
 * pair of numbers. The rule works because the second search is the same request
 * against the same service for the same object — not because coordinates are
 * generally comparable.
 *
 * What that deliberately does not catch: a marker whose position was corrected
 * after saving, and one dropped by pointing at the map. Both are offered as new,
 * exactly as they were before this function existed. A tolerance would catch
 * them and would also swallow the premises either side, which are the same few
 * metres away — see `place-search`, which states this as a limit rather than
 * leaving it to a constant here.
 *
 * Null rather than an empty group when nothing matches: there is no point on the
 * map to name, so there is no key to return, and a caller that has to check
 * `count > 0` is a caller that can forget to.
 */
export function markersAt<T extends MarkerViewInput>(
  position: LngLat,
  markers: readonly T[],
): { key: string; markers: readonly T[] } | null {
  const key = coordinateKey(position.lng, position.lat)
  const found = markers.filter(
    (marker) => coordinateKey(marker.lng, marker.lat) === key,
  )

  return found.length > 0 ? { key, markers: found } : null
}
