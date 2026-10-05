import type { LngLat, TravelMode } from '@pinpoint/map'

import { decodePolyline } from './polyline'
import type { StreetRoute } from './types'

/**
 * FOSSGIS's public Valhalla server, asked when Stadia Maps cannot answer.
 *
 * Free, no key. Its terms (valhalla/valhalla discussion #3373): one call per
 * user per second, an `X-Client-Id` header naming the application, and credit
 * to OpenStreetMap, Valhalla and FOSSGIS. Its walking profile knows about steps
 * and footways, which is most of what a walk through a temple district is.
 */
export const VALHALLA_ENDPOINT = 'https://valhalla1.openstreetmap.de/route'

const COSTING: Readonly<Record<TravelMode, string>> = {
  walk: 'pedestrian',
  bike: 'bicycle',
  car: 'auto',
}

/**
 * The request, as a GET with the whole query in one `json` parameter.
 *
 * `endpoint` is any server speaking Valhalla's API; Stadia Maps runs the same
 * software and takes the same request (`./stadia`).
 *
 * Built by hand rather than with `URLSearchParams`, as `@pinpoint/geocode` does,
 * because React Native's polyfill is incomplete.
 */
export function buildValhallaUrl(
  from: LngLat,
  to: LngLat,
  mode: TravelMode,
  endpoint: string = VALHALLA_ENDPOINT,
): string {
  const query = {
    locations: [
      { lat: from.lat, lon: from.lng },
      { lat: to.lat, lon: to.lng },
    ],
    costing: COSTING[mode],
    units: 'kilometers',
  }
  return `${endpoint}?json=${encodeURIComponent(JSON.stringify(query))}`
}

/**
 * Whether a refusal means "there is no way", rather than "something went
 * wrong".
 *
 * Valhalla answers 400 with a numeric `error_code` both for a malformed request
 * and for an impossible one — 442 no path, 171 no road near a point, 154 too far
 * for this way of travelling. This application builds the request itself, so a
 * malformed one is not a case it meets; any coded 400 is read as no way.
 */
export function isValhallaNoRoute(status: number, body: unknown): boolean {
  return (
    status === 400 &&
    typeof body === 'object' &&
    body !== null &&
    typeof (body as { error_code?: unknown }).error_code === 'number'
  )
}

/** The route from an answer, or null when the answer cannot be read as one. */
export function parseValhalla(body: unknown): StreetRoute | null {
  const trip = (body as { trip?: unknown } | null)?.trip as
    | {
        status?: unknown
        summary?: { length?: unknown; time?: unknown }
        legs?: { shape?: unknown }[]
      }
    | undefined
  if (!trip || trip.status !== 0) return null
  const km = trip.summary?.length
  const seconds = trip.summary?.time
  const shape = trip.legs?.[0]?.shape
  if (typeof km !== 'number' || typeof seconds !== 'number' || typeof shape !== 'string') {
    return null
  }
  const line = decodePolyline(shape, 6)
  if (line.length < 2) return null
  return { km, minutes: seconds / 60, line }
}
