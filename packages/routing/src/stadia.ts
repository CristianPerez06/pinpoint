import type { LngLat, TravelMode } from '@pinpoint/map'

import { buildValhallaUrl } from './valhalla'

/**
 * Stadia Maps' routing service, the first one asked (#281).
 *
 * It runs Valhalla, so the request and the answer are Valhalla's, read by the
 * same functions. Its free plan is a fixed monthly allowance that stops rather
 * than bills, and is non-commercial — the same condition FOSSGIS sets.
 *
 * Both applications pass the same key as `api_key`. Without one, Stadia
 * recognises a browser by the address it sends as `Origin`, which is how
 * `localhost` answers keyless. Stadia's preflight allows `Stadia-Auth` and
 * `Content-Type` only, so the key goes in the query rather than a header.
 */
export const STADIA_ENDPOINT = 'https://api.stadiamaps.com/route/v1'

export function buildStadiaUrl(from: LngLat, to: LngLat, mode: TravelMode, apiKey?: string): string {
  const url = buildValhallaUrl(from, to, mode, STADIA_ENDPOINT)
  return apiKey ? `${url}&api_key=${encodeURIComponent(apiKey)}` : url
}
