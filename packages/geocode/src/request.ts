import type { SearchBias } from './types'

/**
 * Building the query sent to the geocoder.
 *
 * Photon's public instance. Free, no signup, no key, no billing — the cost
 * constraint is why this project carried Photon and Nominatim as an open choice
 * rather than picking a metered service, and Photon over Nominatim because
 * Photon is built for search-as-you-type and Nominatim's usage policy forbids
 * it.
 *
 * The instance offers no availability guarantee and throttles extensive use, so
 * everything here is arranged to ask for as little as possible: one request per
 * pause rather than per keystroke (the caller's job), a small result limit, and
 * nothing requested that is not displayed.
 */

export const PHOTON_ENDPOINT = 'https://photon.komoot.io/api'

/**
 * How many candidates to ask for.
 *
 * Small on purpose. A list long enough to scroll is a list nobody reads, and
 * every extra result is work asked of a service given away for free.
 */
export const DEFAULT_LIMIT = 8

/**
 * How tightly results are pulled toward the focus point.
 *
 * These are Photon's own defaults, restated rather than omitted so that changing
 * one is an edit here instead of a silent dependence on an upstream default.
 * `zoom` reads as a map zoom level — 12 is roughly a city — and
 * `location_bias_scale` weighs nearness against prominence, where 0 ignores the
 * focus point entirely and 1 lets a nearby bus stop outrank a famous temple.
 */
export const DEFAULT_ZOOM = 12
export const DEFAULT_BIAS_SCALE = 0.4

export interface SearchOptions {
  bias?: SearchBias
  limit?: number
  zoom?: number
  biasScale?: number
  lang?: string
}

/**
 * Built by hand rather than with `URLSearchParams`.
 *
 * Not superstition: React Native's URL polyfill is incomplete, and a package
 * under `packages/` has to be able to resolve under either application's
 * bundler. Two lines of `encodeURIComponent` cost less than finding out.
 */
function query(params: readonly (readonly [string, string])[]): string {
  return params
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join('&')
}

/**
 * The URL for one search.
 *
 * Note what is never sent: `bbox`. Photon offers both a focus point
 * (`lat`/`lon`, which reorders results) and a bounding box (which excludes
 * everything outside it), and only the first is bias. A trip contains day trips,
 * and a search restricted to the city being planned would make the place an hour
 * away unfindable at exactly the moment somebody went looking for it.
 *
 * The focus point is derived from the markers already filed under the selected
 * city, or from the visible map, and never by resolving the city's name. A city
 * here is a label somebody chose for a group of pins; the pins say where it is.
 */
export function buildSearchUrl(
  searchQuery: string,
  options: SearchOptions = {},
): string {
  const {
    bias,
    limit = DEFAULT_LIMIT,
    zoom = DEFAULT_ZOOM,
    biasScale = DEFAULT_BIAS_SCALE,
    lang = 'en',
  } = options

  const params: (readonly [string, string])[] = [
    ['q', searchQuery],
    ['limit', String(limit)],
    ['lang', lang],
  ]

  if (bias) {
    params.push(
      ['lat', String(bias.lat)],
      ['lon', String(bias.lng)],
      ['zoom', String(zoom)],
      ['location_bias_scale', String(biasScale)],
    )
  }

  return `${PHOTON_ENDPOINT}?${query(params)}`
}
