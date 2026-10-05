import type { LngLat, TravelMode } from '@pinpoint/map'

import type { StreetRoute } from './types'

/**
 * FOSSGIS's public OSRM servers, asked only when Valhalla fails.
 *
 * Run by the same association, so falling back is not a second relationship.
 * Free, no key. Its terms (routing.openstreetmap.de/about.html): one request per
 * second, a valid user agent and referrer, the required attribution and a link
 * to "fix the map". It refuses a custom `X-Client-Id` from a browser at the
 * preflight, so nothing custom is sent here from the laptop.
 */
export const OSRM_ENDPOINT = 'https://routing.openstreetmap.de'

/** Each way of travelling is a separate server, with its own profile name. */
const PROFILE: Readonly<Record<TravelMode, { server: string; profile: string }>> = {
  walk: { server: 'routed-foot', profile: 'foot' },
  bike: { server: 'routed-bike', profile: 'bike' },
  car: { server: 'routed-car', profile: 'car' },
}

export function buildOsrmUrl(from: LngLat, to: LngLat, mode: TravelMode): string {
  const { server, profile } = PROFILE[mode]
  return (
    `${OSRM_ENDPOINT}/${server}/route/v1/${profile}/` +
    `${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson`
  )
}

/** OSRM's own word for "there is no way", in a 400 or a 200. */
export function isOsrmNoRoute(body: unknown): boolean {
  const code = (body as { code?: unknown } | null)?.code
  return code === 'NoRoute' || code === 'NoSegment'
}

/** The route from an answer, or null when the answer cannot be read as one. */
export function parseOsrm(body: unknown): StreetRoute | null {
  const answer = body as {
    code?: unknown
    routes?: { distance?: unknown; duration?: unknown; geometry?: { coordinates?: unknown } }[]
  } | null
  if (answer?.code !== 'Ok') return null
  const route = answer.routes?.[0]
  const metres = route?.distance
  const seconds = route?.duration
  const coordinates = route?.geometry?.coordinates
  if (typeof metres !== 'number' || typeof seconds !== 'number' || !Array.isArray(coordinates)) {
    return null
  }
  const line = coordinates.flatMap((pair: unknown) =>
    Array.isArray(pair) && typeof pair[0] === 'number' && typeof pair[1] === 'number'
      ? [{ lng: pair[0], lat: pair[1] }]
      : [],
  )
  if (line.length < 2) return null
  return { km: metres / 1000, minutes: seconds / 60, line }
}
