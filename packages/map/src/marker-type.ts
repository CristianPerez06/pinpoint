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

export interface MarkerTypeDefinition {
  readonly id: string
  readonly label: string
  readonly family: MarkerFamily
  /**
   * Rendered as-is by both apps. Emoji keeps this package free of an icon
   * dependency and renders on web and native alike; swapping to a real icon set
   * later touches this file only — but note that it also means revisiting how
   * markers are drawn, because a symbol layer cannot render emoji without a
   * per-platform sprite atlas. The icon choice and the rendering architecture
   * are the same decision.
   */
  readonly icon: string
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
  { id: 'other', label: 'Place', family: 'see', icon: '📍' },
  { id: 'attraction', label: 'Attraction', family: 'see', icon: '⭐' },
  { id: 'temple', label: 'Temple', family: 'see', icon: '⛩️' },
  { id: 'castle', label: 'Castle', family: 'see', icon: '🏯' },
  { id: 'museum', label: 'Museum', family: 'see', icon: '🖼️' },
  { id: 'park', label: 'Park', family: 'see', icon: '🌳' },
  { id: 'viewpoint', label: 'Viewpoint', family: 'see', icon: '🌄' },

  { id: 'restaurant', label: 'Restaurant', family: 'eat', icon: '🍜' },
  { id: 'cafe', label: 'Café', family: 'eat', icon: '☕' },
  { id: 'bar', label: 'Bar', family: 'eat', icon: '🍺' },
  { id: 'street-food', label: 'Street food', family: 'eat', icon: '🍢' },

  { id: 'shop', label: 'Shop', family: 'buy', icon: '🛍️' },
  { id: 'market', label: 'Market', family: 'buy', icon: '🏪' },

  { id: 'lodging', label: 'Lodging', family: 'sleep', icon: '🛏️' },

  { id: 'station', label: 'Station', family: 'move', icon: '🚉' },
  { id: 'airport', label: 'Airport', family: 'move', icon: '✈️' },
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
