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
 * So the cap moved onto the type list itself. There are eight types and the
 * budget is about eight, which means **a new type costs a colour**. That is the
 * point rather than a limitation: adding one is now a palette decision somebody
 * has to argue for, where before it was a free edit to a list — and sixteen free
 * edits are exactly how this got here. Do not add a ninth on the grounds that
 * there is room for one: there is not. The wheel's last open span went to
 * `culture`, and the budget is spent rather than nearly spent.
 *
 * THE EIGHTH, AND WHAT IT COST
 *
 * The collapse first went to seven and folded Temple into `culture`. That is the
 * one merge that reproduced the problem one level down: a sightseeing trip is
 * mostly temples, so a temple and a museum sharing a colour is the same field of
 * identical pins, smaller. `temple` is the eighth type, it takes the slate
 * because the recessive value follows the majority and the majority is temples,
 * and `culture` — castles, museums, galleries — took the last hue on the wheel.
 * That is the rule above being paid rather than waived.
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
  'temple',
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
 * There is one per type and no more. Eight names were retired when sixteen types
 * became eight: `star`, `picture`, `mountain`, `coffee`, `beer`, `skewer`,
 * `storefront` and `plane`. They are gone rather than kept for later — an icon
 * with no type to name is a glyph both applications must map and nothing can
 * draw. `castle` was among them for exactly one change and came back when
 * `culture` needed a glyph of its own.
 *
 * `landmark` is the columned facade, and it moved. It was `culture`'s while
 * `culture` held the temples; it is `temple`'s now, because it is the one glyph
 * in the set that actually draws a temple. `culture` took `castle`. Two names,
 * two types, and the swap is the whole of it — do not read `landmark` as still
 * meaning sightseeing-in-general.
 *
 * The names describe what is drawn, not which library draws it. Naming them
 * after a vendor's catalogue would make swapping the catalogue a change to the
 * shared contract, which is exactly what this indirection exists to avoid.
 */
export const MARKER_ICONS = [
  'pin',
  'landmark',
  'castle',
  'trees',
  'utensils',
  'shopping-bag',
  'bed',
  'train',
] as const

export type MarkerIconName = (typeof MARKER_ICONS)[number]

/**
 * A type: an identifier, an icon's name, and nothing that can be drawn.
 *
 * **There is deliberately no label.** What a type is called is words somebody
 * reads, and this package held the only ones it had — which is exactly the
 * value a screen could draw as it stood, and exactly why it stayed English.
 * The words live in `@pinpoint/wording` under `markerType.<id>`, resolved by
 * each application from the identifier, the same way the icon already is.
 *
 * Nothing is added here to point at them: the identifier *is* the key. `icon`
 * needs a name of its own because it differs from the type — `temple` draws
 * `landmark` — and a label would not, so a second name for the same thing
 * would only be a second thing to keep in step.
 */
export interface MarkerTypeDefinition {
  readonly id: MarkerType
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
 * The eight, in the order they are offered.
 *
 * `place` leads because it is the fallback and the safe answer, and the rest run
 * roughly from what a trip holds most of to what it holds least. `temple` is
 * second because it is the most: the seeded Kyoto trip carried eight of them
 * against four of everything else sightseeing put together, which is the count
 * the recessive slate follows.
 */
export const MARKER_TYPES: readonly MarkerTypeDefinition[] = [
  { id: 'place', icon: 'pin' },
  { id: 'temple', icon: 'landmark' },
  { id: 'culture', icon: 'castle' },
  { id: 'nature', icon: 'trees' },
  { id: 'food', icon: 'utensils' },
  { id: 'shopping', icon: 'shopping-bag' },
  { id: 'stay', icon: 'bed' },
  { id: 'transport', icon: 'train' },
] as const

/* Keyed by `string`, not by `MarkerType`. Every caller arrives with an
   unconstrained value out of the database, and a map that only accepts the eight
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
 * saved castle into a generic `place` pin: no error, no failing test, no
 * typecheck complaint, and a map that is quietly wrong. See `marker-migrate.ts`.
 */
export function markerTypeOf(id: string | null | undefined): MarkerTypeDefinition {
  if (!id) return BY_ID.get(FALLBACK_MARKER_TYPE)!
  return BY_ID.get(id) ?? BY_ID.get(RETIRED_TYPES[id] ?? '') ?? BY_ID.get(FALLBACK_MARKER_TYPE)!
}

/**
 * Whether `id` is one of the eight types offered today. Answers the *write*
 * question: this is what `markerTypeSchema` refines on.
 *
 * Deliberately not a type predicate. Narrowing to `MarkerType` here would
 * propagate through zod's inference into `Marker.type`, and a `Marker` is also
 * what a *read* produces — where the value is unconstrained text and may well be
 * a retired identifier. A row holding `castle` is valid data, not a type error.
 */
export function isMarkerType(id: string): boolean {
  return BY_ID.has(id)
}

/**
 * Whether `id` is a value this system has ever defined — a live type or a retired
 * one. Distinct from `isMarkerType`, which asks only about the eight: a stored
 * `castle` is not a type any more, but it is not unknown either.
 */
export function isKnownMarkerType(id: string): boolean {
  return isMarkerType(id) || id in RETIRED_TYPES
}
