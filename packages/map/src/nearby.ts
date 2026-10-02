import { distanceKm } from './distance'
import type { LngLat } from './types'

/**
 * Ordering a trip's places by how far they are (`nearby-places`).
 *
 * Here rather than in either application so the phone and the laptop cannot
 * order the same trip differently from the same point. Nothing here knows
 * whether the point is the person or the middle of the map — the sheet's
 * heading says which, and the order is the same question either way.
 */

/** Anything with a position, an identity and a name to break ties with. */
export interface NearbyPlace extends LngLat {
  id: string
  name: string
}

/** A place's place in the list: which one, and how far it is. */
export interface NearbyRow {
  id: string
  km: number
}

/**
 * Beyond this a place is a day trip rather than a walk, and its distance is
 * drawn dimmed.
 *
 * Half of search's far-away mark, on purpose: search dims a candidate that is
 * probably the wrong place, this dims a saved place that is simply not
 * somewhere to walk to. A trip's places within one city sit within about 5 km
 * of each other (`city-claim.ts`), so nothing in the city being walked comes
 * near it.
 */
export const NEARBY_FAR_KM = 50

/**
 * How much two distances may disagree with the held order before it counts as
 * drift, when nothing better is known.
 *
 * A standing phone's position wanders by a few metres, and a *Re-sort* that
 * appears and vanishes with that wander is a control nobody can trust.
 */
export const NEARBY_DRIFT_FLOOR_KM = 0.02

/**
 * The places, nearest first.
 *
 * Ties go by name and then id, so the same trip from the same point always
 * comes out in the same order — a list that swaps two equal rows each time it
 * is opened reads as having changed.
 */
export function orderByDistance(places: readonly NearbyPlace[], from: LngLat): NearbyRow[] {
  return places
    .map((place) => ({ place, km: distanceKm(from, place) }))
    .sort(
      (a, b) =>
        a.km - b.km ||
        a.place.name.localeCompare(b.place.name) ||
        (a.place.id < b.place.id ? -1 : a.place.id > b.place.id ? 1 : 0),
    )
    .map(({ place, km }) => ({ id: place.id, km }))
}

/**
 * Whether the held order now disagrees with the distances by more than
 * `toleranceKm`.
 *
 * One pass: the order has drifted exactly when some row is nearer than a row
 * above it by more than the tolerance, and the furthest row seen so far is the
 * one any later row would have to beat. Ids with no distance — a place removed
 * while the list was open — are skipped rather than read as zero.
 */
export function hasDrifted(
  order: readonly string[],
  distances: ReadonlyMap<string, number>,
  toleranceKm: number = NEARBY_DRIFT_FLOOR_KM,
): boolean {
  let furthest = -Infinity
  for (const id of order) {
    const km = distances.get(id)
    if (km === undefined) continue
    if (furthest - km > toleranceKm) return true
    if (km > furthest) furthest = km
  }
  return false
}

/**
 * The tolerance for a position reported as uncertain to `accuracyMetres`.
 *
 * Two places can swap by no more than the position itself is unsure of
 * without that meaning anything, so the device's own uncertainty is the
 * threshold — never less than the floor, because a device that claims to know
 * its position to the metre still wanders.
 */
export function driftTolerance(accuracyMetres: number | null): number {
  if (accuracyMetres === null || !Number.isFinite(accuracyMetres)) return NEARBY_DRIFT_FLOOR_KM
  return Math.max(NEARBY_DRIFT_FLOOR_KM, accuracyMetres / 1000)
}

/**
 * Beyond this uncertainty the sheet says the position is rough
 * (`nearby-places`: *A rough position says it is rough*).
 */
export const NEARBY_ROUGH_METRES = 200
