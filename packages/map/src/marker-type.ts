/**
 * The marker types, defined in code rather than stored as data.
 *
 * A type carries visual design — an icon, and a family that decides its colour
 * — so a user-created type would need an icon picker, a colour choice, and some
 * way to stop the map turning into confetti. There is no interface for creating
 * one; adding a type is an edit to the list below.
 *
 * Two visual channels, deliberately separated:
 *
 *   family -> colour, and the set of families never grows
 *   type   -> icon, and the set of types may grow freely
 *
 * A map stops being readable somewhere around eight distinguishable colours. By
 * carrying growth in the icon channel the list can expand without the map
 * degrading — but only while every new type is assigned to an existing family.
 *
 * WHY THIS LIVES IN @pinpoint/map AND NOT IN @pinpoint/core
 *
 * Icons and colour families are presentation, and the descriptor function that
 * consumes them sits next door beside `fitBounds`. `@pinpoint/core` keeps the
 * half that is validation — `markerTypeSchema` — and reads the valid
 * identifiers from here. That direction works because this package declares no
 * workspace dependencies at all, so `core` may depend on it and never the
 * reverse.
 */

export const MARKER_FAMILIES = ['see', 'eat', 'buy', 'sleep', 'move'] as const

export type MarkerFamily = (typeof MARKER_FAMILIES)[number]

/**
 * The icons a type may name, and why these are names rather than icons.
 *
 * An icon is a rendered component, and this package declares no third-party
 * dependencies — so it cannot hold one. What it holds is the identifier, and
 * each application maps it to something from its own icon set. That mapping is
 * an exhaustive record on both sides, so a name added here without a glyph
 * beside it fails to typecheck in both applications rather than drawing an
 * empty pin.
 *
 * These were emoji until this change. Emoji needed no dependency and rendered
 * everywhere, which is genuinely why they were chosen — but they carry their
 * own colour, and the colour is the one thing a pin is already saying. A red
 * bowl of ramen on a slate `see` pin argues with the family it belongs to, and
 * at 15px on a coloured teardrop the detail turns to mush.
 *
 * The names describe what is drawn, not which library draws it. Naming them
 * after a vendor's catalogue would make swapping the catalogue a change to the
 * shared contract, which is exactly what this indirection exists to avoid.
 */
export const MARKER_ICONS = [
  'pin',
  'star',
  'landmark',
  'castle',
  'picture',
  'trees',
  'mountain',
  'utensils',
  'coffee',
  'beer',
  'skewer',
  'shopping-bag',
  'storefront',
  'bed',
  'train',
  'plane',
] as const

export type MarkerIconName = (typeof MARKER_ICONS)[number]

export interface MarkerTypeDefinition {
  readonly id: string
  readonly label: string
  readonly family: MarkerFamily
  /**
   * Names an icon; is not one. Resolved by each application against its own
   * icon set — see `MARKER_ICONS`.
   */
  readonly icon: MarkerIconName
}

/**
 * The type a marker takes when nothing better is known — an unmatched import, a
 * pin dropped by hand, a geocoder result with no useful category.
 *
 * It sits in `see` because a saved place with no other signal is most often
 * somewhere to go and look at. The alternative, a sixth family for "unknown",
 * would spend a colour on the least informative case.
 */
export const FALLBACK_MARKER_TYPE = 'other'

export const MARKER_TYPES: readonly MarkerTypeDefinition[] = [
  { id: 'other', label: 'Place', family: 'see', icon: 'pin' },
  { id: 'attraction', label: 'Attraction', family: 'see', icon: 'star' },
  { id: 'temple', label: 'Temple', family: 'see', icon: 'landmark' },
  { id: 'castle', label: 'Castle', family: 'see', icon: 'castle' },
  { id: 'museum', label: 'Museum', family: 'see', icon: 'picture' },
  { id: 'park', label: 'Park', family: 'see', icon: 'trees' },
  { id: 'viewpoint', label: 'Viewpoint', family: 'see', icon: 'mountain' },

  { id: 'restaurant', label: 'Restaurant', family: 'eat', icon: 'utensils' },
  { id: 'cafe', label: 'Café', family: 'eat', icon: 'coffee' },
  { id: 'bar', label: 'Bar', family: 'eat', icon: 'beer' },
  { id: 'street-food', label: 'Street food', family: 'eat', icon: 'skewer' },

  { id: 'shop', label: 'Shop', family: 'buy', icon: 'shopping-bag' },
  { id: 'market', label: 'Market', family: 'buy', icon: 'storefront' },

  { id: 'lodging', label: 'Lodging', family: 'sleep', icon: 'bed' },

  { id: 'station', label: 'Station', family: 'move', icon: 'train' },
  { id: 'airport', label: 'Airport', family: 'move', icon: 'plane' },
] as const

const BY_ID = new Map(MARKER_TYPES.map((type) => [type.id, type]))

export const MARKER_TYPE_IDS = MARKER_TYPES.map((type) => type.id)

/**
 * Resolve a stored type value to its definition, falling back rather than
 * returning undefined. The database column is unconstrained text, so a value
 * written by an older version of the app must still render.
 */
export function markerTypeOf(id: string | null | undefined): MarkerTypeDefinition {
  return (id ? BY_ID.get(id) : undefined) ?? BY_ID.get(FALLBACK_MARKER_TYPE)!
}

export function isMarkerType(id: string): boolean {
  return BY_ID.has(id)
}
