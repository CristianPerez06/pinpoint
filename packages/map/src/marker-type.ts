/**
 * The marker types, defined in code rather than stored as data.
 *
 * A type carries visual design — an icon, and a colour — so a user-created type
 * would need an icon picker, a colour choice, and some way to stop the map
 * turning into confetti. There is no interface for creating one; adding a type is
 * an edit to the list below.
 *
 * ONE CHANNEL, AND WHY IT USED TO BE TWO
 *
 * Colour names the type. That is the whole scheme:
 *
 *   type -> colour, and type -> icon; the icon repeats what the colour says
 *
 * It used to be two channels — a closed set of five *families* decided colour,
 * and the type decided the icon — on the reasoning that a map stops being
 * readable somewhere around eight distinguishable colours, so growth had to be
 * carried by the icon. The reasoning was sound and the outcome was not. Sixteen
 * types arrived over five colours, seven of them sharing one, and a castle, a
 * museum and a park became indistinguishable except by a 15px stroked glyph. The
 * cap was never reached; the bucket was.
 *
 * So the cap moved onto the type list itself. There are seven types and the
 * budget is about eight, which means **a new type costs a colour**. That is the
 * point rather than a limitation: adding one is now a palette decision somebody
 * has to argue for, where before it was a free edit to a list — and sixteen free
 * edits are exactly how this got here. Do not add an eighth on the grounds that
 * there is room for one.
 *
 * The icon is no longer load-bearing. It reinforces a colour that has already
 * said what the place is, which is why it may be small and quiet.
 *
 * WHY THIS LIVES IN @pinpoint/map AND NOT IN @pinpoint/core
 *
 * Icons and colours are presentation, and the descriptor function that consumes
 * them sits next door beside `fitBounds`. `@pinpoint/core` keeps the half that is
 * validation — `markerTypeSchema` — and reads the valid identifiers from here.
 * That direction works because this package declares no workspace dependencies at
 * all, so `core` may depend on it and never the reverse.
 */

import { RETIRED_TYPES } from './marker-migrate'

export const MARKER_TYPE_IDS_TUPLE = [
  'place',
  'culture',
  'nature',
  'food',
  'shopping',
  'stay',
  'transport',
] as const

/**
 * A marker type. Also the key its colour is stored under in `@pinpoint/tokens`,
 * and the suffix of its `--pp-pin-*` custom property.
 */
export type MarkerType = (typeof MARKER_TYPE_IDS_TUPLE)[number]

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
 * These were emoji once. Emoji needed no dependency and rendered everywhere,
 * which is genuinely why they were chosen — but they carry their own colour, and
 * the colour is the one thing a pin is already saying. A red bowl of ramen on a
 * slate pin argues with the type it belongs to, and at 15px on a coloured
 * teardrop the detail turns to mush.
 *
 * There is one per type and no more. Nine names were retired when sixteen types
 * became seven: `star`, `castle`, `picture`, `mountain`, `coffee`, `beer`,
 * `skewer`, `storefront` and `plane`. They are gone rather than kept for later —
 * an icon with no type to name is a glyph both applications must map and nothing
 * can draw.
 *
 * The names describe what is drawn, not which library draws it. Naming them
 * after a vendor's catalogue would make swapping the catalogue a change to the
 * shared contract, which is exactly what this indirection exists to avoid.
 */
export const MARKER_ICONS = [
  'pin',
  'landmark',
  'trees',
  'utensils',
  'shopping-bag',
  'bed',
  'train',
] as const

export type MarkerIconName = (typeof MARKER_ICONS)[number]

export interface MarkerTypeDefinition {
  readonly id: MarkerType
  readonly label: string
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
 * `place` means *nothing more was determined*, and only that. It used to be
 * called `other` and used to sit in the sightseeing family alongside deliberate
 * choices like Attraction, which made a place somebody had classified look
 * identical to one nothing was known about. `attraction` now resolves to
 * `culture`, so this stays rare — which is what lets it take a near-neutral
 * rather than a colour. A pin meaning *we could not tell* should look like the
 * least classified thing on the map.
 */
export const FALLBACK_MARKER_TYPE = 'place' satisfies MarkerType

/**
 * The seven, in the order they are offered.
 *
 * `place` leads because it is the fallback and the safe answer, and the rest run
 * roughly from what a trip holds most of to what it holds least.
 */
export const MARKER_TYPES: readonly MarkerTypeDefinition[] = [
  { id: 'place', label: 'Place', icon: 'pin' },
  { id: 'culture', label: 'Culture', icon: 'landmark' },
  { id: 'nature', label: 'Nature', icon: 'trees' },
  { id: 'food', label: 'Food', icon: 'utensils' },
  { id: 'shopping', label: 'Shopping', icon: 'shopping-bag' },
  { id: 'stay', label: 'Stay', icon: 'bed' },
  { id: 'transport', label: 'Transport', icon: 'train' },
] as const

/* Keyed by `string`, not by `MarkerType`. Every caller arrives with an
   unconstrained value out of the database, and a map that only accepts the seven
   would make each of them cast on the way in. */
const BY_ID: ReadonlyMap<string, MarkerTypeDefinition> = new Map(
  MARKER_TYPES.map((type) => [type.id as string, type]),
)

export const MARKER_TYPE_IDS: readonly MarkerType[] = MARKER_TYPES.map((type) => type.id)

/**
 * Resolve a stored type value to its definition. Total: never returns undefined,
 * and never throws.
 *
 * Three cases, and the middle one is the one worth writing down:
 *
 *   a live identifier      -> its own definition
 *   a retired identifier   -> the type that replaced it, via `RETIRED_TYPES`
 *   anything else, or null -> the fallback
 *
 * The database column is unconstrained text, so a value written by an older
 * version of the app must still render — and must still mean what it meant.
 * Letting a retired identifier fall through to the fallback would turn every
 * saved temple into a generic `place` pin: no error, no failing test, no
 * typecheck complaint, and a map that is quietly wrong. See `marker-migrate.ts`.
 */
export function markerTypeOf(id: string | null | undefined): MarkerTypeDefinition {
  if (!id) return BY_ID.get(FALLBACK_MARKER_TYPE)!
  return BY_ID.get(id) ?? BY_ID.get(RETIRED_TYPES[id] ?? '') ?? BY_ID.get(FALLBACK_MARKER_TYPE)!
}

/**
 * Whether `id` is one of the seven types offered today. Answers the *write*
 * question: this is what `markerTypeSchema` refines on.
 *
 * Deliberately not a type predicate. Narrowing to `MarkerType` here would
 * propagate through zod's inference into `Marker.type`, and a `Marker` is also
 * what a *read* produces — where the value is unconstrained text and may well be
 * a retired identifier. A row holding `temple` is valid data, not a type error.
 */
export function isMarkerType(id: string): boolean {
  return BY_ID.has(id)
}

/**
 * Whether `id` is a value this system has ever defined — a live type or a retired
 * one. Distinct from `isMarkerType`, which asks only about the seven: a stored
 * `temple` is not a type any more, but it is not unknown either.
 */
export function isKnownMarkerType(id: string): boolean {
  return isMarkerType(id) || id in RETIRED_TYPES
}
