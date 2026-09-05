/**
 * What a stored type identifier means now.
 *
 * The type column is unconstrained text and rows exist that were written by
 * earlier builds. Sixteen types became seven, so nine identifiers no longer name
 * anything — and a row carrying one is not corrupt. It is a place somebody saved,
 * classified correctly at the time, and it has to keep meaning what it meant.
 *
 * WHY THIS IS A TABLE AND NOT THE FALLBACK
 *
 * `markerTypeOf` already resolves an unrecognised value to `FALLBACK_MARKER_TYPE`,
 * which is right for a string no build ever wrote and wrong for these nine.
 * Letting `temple` fall through would draw every saved temple as a generic
 * `place` pin: no exception, no failing test, nothing for a typecheck to catch,
 * and a map that is quietly wrong in a way only somebody who knows the trip would
 * notice. That is the exact failure this repository keeps re-learning to look for.
 *
 * WHY IT IS RESOLVED ON READ AND NOT MIGRATED
 *
 * A rewriting migration would have to be correct on the first attempt against
 * rows that cannot be restored, and it buys nothing this table does not. It would
 * also leave any client still running older code writing retired identifiers into
 * a column that had just been cleaned. Nothing is rewritten; the meaning is
 * applied every time the value is read.
 *
 * This table is permanent, not transitional. A row may carry a retired identifier
 * indefinitely, so these entries are kept for as long as the rows might exist —
 * which is to say, for good. Nothing here is ever deleted; entries are only added,
 * the next time a type is retired.
 *
 * ONE THING IT CANNOT DO
 *
 * It is lossy by construction, because all it sees is the stored string. A zoo
 * saved before this change was stored as `attraction` — the old list had nowhere
 * better to put it — so it resolves to `culture` along with every other
 * `attraction`. A zoo saved afterwards is stored as `nature`, because the
 * geocoder can see the `zoo` tag that the stored value threw away. The two
 * disagree, permanently, and no table indexed on the identifier can reconcile
 * them. See `@pinpoint/geocode`'s `type-guess.ts`, which answers a different
 * question from richer input.
 */

import type { MarkerType } from './marker-type'

/**
 * Retired identifier -> the type that replaced it.
 *
 * Exhaustive over every identifier this system has ever defined and no longer
 * offers. `marker-type.test.ts` asserts that, and asserts that none of them
 * reaches the fallback by omission.
 */
export const RETIRED_TYPES: Readonly<Record<string, MarkerType>> = {
  /* Sightseeing, which was one family of seven types and is now three types.
     `attraction` goes to `culture` rather than to the fallback: somebody who
     marked a place worth seeing said more than nothing, and `place` means
     nothing was determined. */
  temple: 'culture',
  castle: 'culture',
  museum: 'culture',
  attraction: 'culture',

  park: 'nature',
  viewpoint: 'nature',

  /* Renamed rather than merged. `other` meant "we could not tell" and still
     does; only the identifier and the label changed. */
  other: 'place',

  restaurant: 'food',
  cafe: 'food',
  bar: 'food',
  'street-food': 'food',

  shop: 'shopping',
  market: 'shopping',

  lodging: 'stay',

  station: 'transport',
  airport: 'transport',
}
