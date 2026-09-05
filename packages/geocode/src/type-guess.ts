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

/**
 * Specific: matched on `osm_value`.
 *
 * This table is the one place the type collapse *gained* precision rather than
 * losing it. `zoo` and `aquarium` were both flattened into `attraction` because
 * the old list had nowhere better to put them; they now go to `nature`, which is
 * what somewhere you go to look at living things is. A tag says more than a
 * stored identifier can — see `RETIRED_TYPES` in `@pinpoint/map`, which only ever
 * sees `attraction` and so must send a zoo saved earlier to `culture`.
 */
const BY_VALUE: Readonly<Record<string, string>> = {
  restaurant: 'food',
  fast_food: 'food',
  food_court: 'food',
  street_vendor: 'food',
  cafe: 'food',
  coffee: 'food',
  bar: 'food',
  pub: 'food',
  biergarten: 'food',

  museum: 'culture',
  gallery: 'culture',
  artwork: 'culture',
  attraction: 'culture',
  castle: 'culture',
  fort: 'culture',
  temple: 'culture',
  shrine: 'culture',
  monastery: 'culture',
  place_of_worship: 'culture',
  /* Neither culture nor nature, and not worth an eighth colour. `culture` is
     where the rest of the built attractions are. */
  theme_park: 'culture',

  zoo: 'nature',
  aquarium: 'nature',
  viewpoint: 'nature',
  park: 'nature',
  garden: 'nature',
  nature_reserve: 'nature',

  marketplace: 'shopping',
  supermarket: 'shopping',
  mall: 'shopping',
  department_store: 'shopping',

  hotel: 'stay',
  hostel: 'stay',
  guest_house: 'stay',
  motel: 'stay',
  apartment: 'stay',

  station: 'transport',
  subway_entrance: 'transport',
  bus_station: 'transport',
  aerodrome: 'transport',
}

/**
 * Coarse: matched on `osm_key` when the value said nothing.
 *
 * `leisure` -> `nature` looks like a decision and is not: it resolved to `park`
 * before, and `park` is one of the two types `nature` absorbs, so this is the
 * same grouping written under a new name.
 */
const BY_KEY: Readonly<Record<string, string>> = {
  tourism: 'culture',
  historic: 'culture',
  leisure: 'nature',
  natural: 'nature',
  shop: 'shopping',
  railway: 'transport',
  aeroway: 'transport',
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
