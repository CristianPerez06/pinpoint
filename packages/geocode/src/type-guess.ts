import { FALLBACK_MARKER_TYPE, isMarkerType } from '@pinpoint/map'

/**
 * Turning the geocoder's classification into one of this product's types.
 *
 * Every result carries an OpenStreetMap tag pair — `osm_key: "amenity"`,
 * `osm_value: "restaurant"`. The value is specific and the key is coarse, so the
 * value is tried first and the key is what catches everything the value list
 * missed.
 *
 * The tables below are deliberately partial, and will always be. OpenStreetMap's
 * vocabulary runs to thousands of values and grows without this repository being
 * told, so the contract is that an unrecognised classification costs a candidate
 * nothing: it still appears, it still saves, and it opens on the fallback type
 * for the person to correct. Guessing is a convenience, never a gate.
 */

/** Specific: matched on `osm_value`. */
const BY_VALUE: Readonly<Record<string, string>> = {
  restaurant: 'restaurant',
  fast_food: 'street-food',
  food_court: 'street-food',
  street_vendor: 'street-food',
  cafe: 'cafe',
  coffee: 'cafe',
  bar: 'bar',
  pub: 'bar',
  biergarten: 'bar',

  museum: 'museum',
  gallery: 'museum',
  artwork: 'museum',
  attraction: 'attraction',
  theme_park: 'attraction',
  zoo: 'attraction',
  aquarium: 'attraction',
  viewpoint: 'viewpoint',
  castle: 'castle',
  fort: 'castle',
  temple: 'temple',
  shrine: 'temple',
  monastery: 'temple',
  place_of_worship: 'temple',
  park: 'park',
  garden: 'park',
  nature_reserve: 'park',

  marketplace: 'market',
  supermarket: 'market',
  mall: 'shop',
  department_store: 'shop',

  hotel: 'lodging',
  hostel: 'lodging',
  guest_house: 'lodging',
  motel: 'lodging',
  apartment: 'lodging',

  station: 'station',
  subway_entrance: 'station',
  bus_station: 'station',
  aerodrome: 'airport',
}

/** Coarse: matched on `osm_key` when the value said nothing. */
const BY_KEY: Readonly<Record<string, string>> = {
  tourism: 'attraction',
  historic: 'attraction',
  leisure: 'park',
  shop: 'shop',
  railway: 'station',
  aeroway: 'airport',
  natural: 'viewpoint',
}

/**
 * Guess a marker type, always returning one that exists.
 *
 * Each table entry is checked against the real type list rather than trusted, so
 * renaming a type in `@pinpoint/map` cannot leave a stale identifier here that
 * would be written to a marker and render as the fallback anyway — silently, and
 * for as long as nobody looked.
 */
export function guessMarkerType(
  osmKey: string | null | undefined,
  osmValue: string | null | undefined,
): string {
  const fromValue = osmValue ? BY_VALUE[osmValue] : undefined
  if (fromValue && isMarkerType(fromValue)) return fromValue

  const fromKey = osmKey ? BY_KEY[osmKey] : undefined
  if (fromKey && isMarkerType(fromKey)) return fromKey

  return FALLBACK_MARKER_TYPE
}
