import { distanceKm } from '@pinpoint/map'

import { guessMarkerType } from './type-guess'
import type { PlaceCandidate, SearchBias } from './types'

/**
 * Turning the geocoder's GeoJSON into candidates.
 *
 * Written to survive the response changing. The service gives no availability
 * guarantee and reserves the right to change without notice, so every field is
 * read defensively, unknown properties are ignored, and one malformed feature
 * costs its own candidate rather than the whole result set. A response that
 * cannot be read at all yields no candidates — never a thrown error, which
 * would surface as a broken screen instead of as "search is unavailable".
 */

function str(value: unknown): string | null {
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : null
}

function num(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

/**
 * A name for the candidate, synthesised when the service did not supply one.
 *
 * `name` is absent for a pure address — a house number on a street has
 * `housenumber` and `street` and nothing else — and a candidate with no name
 * cannot become a marker, since a name is the one field a marker requires. So a
 * name is assembled rather than the result being dropped.
 */
function nameOf(props: Record<string, unknown>): string | null {
  const name = str(props.name)
  if (name) return name

  const street = str(props.street)
  const housenumber = str(props.housenumber)
  if (street && housenumber) return `${housenumber} ${street}`
  if (street) return street

  return str(props.city) ?? str(props.state) ?? str(props.country)
}

/**
 * Roughly where this is, for telling identically-named results apart.
 *
 * Two or three parts at most. The list exists to answer "which Starbucks", and a
 * full postal address answers it no better while making every row unreadable.
 *
 * `city`, `district`, and `county` are read opportunistically: they are not in
 * every response and are not depended upon. Absent, the context is thinner or
 * null, which costs a disambiguation hint and nothing else.
 */
function contextOf(props: Record<string, unknown>, name: string): string | null {
  const parts = [
    str(props.city) ?? str(props.district) ?? str(props.county),
    str(props.state),
    str(props.country),
  ].filter((part): part is string => part !== null && part !== name)

  const unique = [...new Set(parts)].slice(0, 3)
  return unique.length > 0 ? unique.join(', ') : null
}

function toCandidate(
  feature: unknown,
  index: number,
  bias: SearchBias | undefined,
): PlaceCandidate | null {
  if (!isRecord(feature)) return null

  const props = isRecord(feature.properties) ? feature.properties : {}
  const geometry = isRecord(feature.geometry) ? feature.geometry : null
  const coordinates = geometry && Array.isArray(geometry.coordinates)
    ? geometry.coordinates
    : null

  // No position means it cannot become a marker. Dropped, and the rest survive.
  if (!coordinates || coordinates.length < 2) return null
  const lng = num(coordinates[0])
  const lat = num(coordinates[1])
  if (lng === null || lat === null) return null
  if (lng < -180 || lng > 180 || lat < -90 || lat > 90) return null

  const name = nameOf(props)
  if (!name) return null

  const osmType = str(props.osm_type)
  const osmId = props.osm_id
  const identity =
    osmType && (typeof osmId === 'number' || typeof osmId === 'string')
      ? `${osmType}${osmId}`
      : `idx${index}`

  return {
    // Prefixed with the index so that a service returning the same OSM object
    // twice cannot produce two candidates with one key.
    id: `${index}:${identity}`,
    name,
    lng,
    lat,
    typeGuess: guessMarkerType(str(props.osm_key), str(props.osm_value)),
    context: contextOf(props, name),
    // `city` alone. `contextOf` above falls back to a district or a county for a
    // disambiguation hint, which is the right answer for reading and the wrong
    // one here — this name selects and creates cities.
    city: str(props.city),
    distanceKm: bias ? distanceKm(bias, { lng, lat }) : null,
  }
}

/**
 * Every usable candidate in a response, in the order the service ranked them.
 *
 * Anything unreadable yields an empty list rather than an error, because the
 * caller distinguishes "no matches" from "search unavailable" by how the request
 * itself went, not by whether the body parsed.
 */
export function toCandidates(
  payload: unknown,
  bias?: SearchBias,
): readonly PlaceCandidate[] {
  if (!isRecord(payload) || !Array.isArray(payload.features)) return []

  return payload.features
    .map((feature, index) => toCandidate(feature, index, bias))
    .filter((candidate): candidate is PlaceCandidate => candidate !== null)
}
