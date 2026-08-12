import type { LngLat } from './types'

/**
 * How far apart two points are on the ground.
 *
 * Lives here rather than in whichever package happens to need it first. It is
 * pure geometry with no dependency, it belongs beside `boundsOf` and
 * `fitBounds`, and more than one thing wants it: search has to say how far a
 * result is from where somebody is planning, and "what is near me right now" —
 * the one question a spreadsheet fundamentally cannot answer — is the same
 * function against a different origin.
 */

/** Mean earth radius, in kilometres. */
const EARTH_RADIUS_KM = 6371

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180
}

/**
 * Great-circle distance between two points, in kilometres.
 *
 * Haversine on a sphere. The earth is an ellipsoid and this is therefore wrong
 * by a fraction of a percent — irrelevant at the precision anybody reads a
 * distance at, and doubly irrelevant to the question it was added for, which is
 * whether a search result is on the right continent.
 *
 * Longitude difference is wrapped before use. Without that, a pair either side
 * of the antimeridian differs by nearly 360 degrees and the answer comes back as
 * most of the way around the planet rather than the few kilometres it actually
 * is.
 */
export function distanceKm(a: LngLat, b: LngLat): number {
  const lat1 = toRadians(a.lat)
  const lat2 = toRadians(b.lat)
  const dLat = lat2 - lat1

  // Wrap into [-180, 180] so the short way round is the one measured.
  let dLng = b.lng - a.lng
  dLng = ((((dLng + 180) % 360) + 360) % 360) - 180

  const dLngRad = toRadians(dLng)

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLngRad / 2) ** 2

  // `min(1, …)` guards the square root: floating point can push `h` a hair over
  // 1 for antipodal points, and `asin` of that is NaN.
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)))
}
