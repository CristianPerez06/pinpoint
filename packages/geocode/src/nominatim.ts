import { distanceKm } from '@pinpoint/map'

import { isRecord, joinContext, str } from './read'
import { DEFAULT_LIMIT } from './request'
import { guessMarkerType } from './type-guess'
import type { PlaceCandidate, SearchBias } from './types'

/**
 * Searching names in every language: OpenStreetMap's own geocoder.
 *
 * Photon answers while somebody types, and only knows a place by its local,
 * English, German or French name — "Torre Eiffel" finds a building in Mexico.
 * Nominatim matches every `name:*` tag in OpenStreetMap, which is the fix, and
 * its usage policy forbids exactly what Photon is used for: autocomplete. So it
 * is asked once, when somebody submits, and never on a keystroke or a pause.
 *
 * Free, no signup, no key. The policy asks for at most one request a second and
 * for the caller to say who it is; the first is `createEveryLanguageSearch`'s
 * job, the second each application's, since only the application knows its name.
 */

export const NOMINATIM_ENDPOINT = 'https://nominatim.openstreetmap.org/search'

/**
 * Half the side of the box results are ranked toward, in degrees.
 *
 * About 28 km of latitude either way — a city and its edges. Photon is given a
 * point and a zoom; Nominatim is given a box, and this is that zoom said as one.
 */
export const VIEWBOX_HALF_DEGREES = 0.25

function query(params: readonly (readonly [string, string])[]): string {
  return params
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join('&')
}

function clamp(value: number, low: number, high: number): number {
  return Math.min(high, Math.max(low, value))
}

/**
 * The URL for one every-language search.
 *
 * Names are asked for in English whatever language the application is in. The
 * city a result is in is compared with the trip's cities when it is saved, and
 * Photon names places in English — so "Roma" from here beside "Rome" from there
 * would offer a second city for a place the trip already has.
 *
 * The bias is a `viewbox` with `bounded=0`, which ranks what is inside first and
 * excludes nothing outside it. `bounded=1` is never sent, for the reason
 * `buildSearchUrl` gives for never sending Photon a `bbox`: a trip contains day
 * trips.
 */
export function buildNominatimUrl(
  searchQuery: string,
  options: { bias?: SearchBias; limit?: number } = {},
): string {
  const { bias, limit = DEFAULT_LIMIT } = options

  const params: (readonly [string, string])[] = [
    ['q', searchQuery],
    ['format', 'jsonv2'],
    ['limit', String(limit)],
    ['addressdetails', '1'],
    ['accept-language', 'en'],
  ]

  if (bias) {
    const west = clamp(bias.lng - VIEWBOX_HALF_DEGREES, -180, 180)
    const east = clamp(bias.lng + VIEWBOX_HALF_DEGREES, -180, 180)
    const south = clamp(bias.lat - VIEWBOX_HALF_DEGREES, -90, 90)
    const north = clamp(bias.lat + VIEWBOX_HALF_DEGREES, -90, 90)
    params.push(
      ['viewbox', `${west},${north},${east},${south}`],
      ['bounded', '0'],
    )
  }

  return `${NOMINATIM_ENDPOINT}?${query(params)}`
}

/** Nominatim sends coordinates as strings. */
function coordinate(value: unknown): number | null {
  const text = str(value)
  if (text === null) return null
  const parsed = Number(text)
  return Number.isFinite(parsed) ? parsed : null
}

/**
 * The settlement, and only a settlement.
 *
 * Photon's `city` is whatever settlement a place is in; Nominatim splits that
 * three ways by size. All three are read, and nothing wider — a county offered
 * as a city to create is a group nobody meant to make.
 */
function cityOf(address: Record<string, unknown>): string | null {
  return str(address.city) ?? str(address.town) ?? str(address.village)
}

/** As Photon's `nameOf`: a pure address still needs a name to become a marker. */
function nameOf(
  row: Record<string, unknown>,
  address: Record<string, unknown>,
): string | null {
  const name = str(row.name)
  if (name) return name

  const road = str(address.road)
  const houseNumber = str(address.house_number)
  if (road && houseNumber) return `${houseNumber} ${road}`
  if (road) return road

  return cityOf(address) ?? str(address.state) ?? str(address.country)
}

function toCandidate(
  row: unknown,
  index: number,
  bias: SearchBias | undefined,
): PlaceCandidate | null {
  if (!isRecord(row)) return null

  const address = isRecord(row.address) ? row.address : {}

  const lng = coordinate(row.lon)
  const lat = coordinate(row.lat)
  if (lng === null || lat === null) return null
  if (lng < -180 || lng > 180 || lat < -90 || lat > 90) return null

  const name = nameOf(row, address)
  if (!name) return null

  const osmType = str(row.osm_type)
  const osmId = row.osm_id
  const identity =
    osmType && (typeof osmId === 'number' || typeof osmId === 'string')
      ? `${osmType}${osmId}`
      : `idx${index}`

  const city = cityOf(address)

  return {
    id: `${index}:${identity}`,
    name,
    lng,
    lat,
    // The same OpenStreetMap tag pair Photon calls `osm_key`/`osm_value`.
    typeGuess: guessMarkerType(str(row.category), str(row.type)),
    context: joinContext(
      [
        city ?? str(address.city_district) ?? str(address.county),
        str(address.state),
        str(address.country),
      ],
      name,
    ),
    city,
    distanceKm: bias ? distanceKm(bias, { lng, lat }) : null,
  }
}

/**
 * Every usable candidate in a `jsonv2` response, in the order it ranked them.
 *
 * As defensive as Photon's parser, for the same reason: one malformed row costs
 * its own candidate, and an unreadable response yields none rather than a throw.
 */
export function toNominatimCandidates(
  payload: unknown,
  bias?: SearchBias,
): readonly PlaceCandidate[] {
  if (!Array.isArray(payload)) return []

  return payload
    .map((row, index) => toCandidate(row, index, bias))
    .filter((candidate): candidate is PlaceCandidate => candidate !== null)
}
