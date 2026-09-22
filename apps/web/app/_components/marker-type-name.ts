import { markerTypeOf, type MarkerType } from '@pinpoint/map'
import { message, type Message, type MessageKey } from '@pinpoint/wording'

/**
 * What each marker type is called, on this platform.
 *
 * The shared package names a type and stops there — the same arrangement it
 * already has for icons, and for the same reason: the word is something a
 * person reads, and a package has no idea who is reading. `@pinpoint/wording`
 * holds the eight sentences under `markerType.<id>`.
 *
 * `Record<MarkerType, MessageKey>` is doing the same work `GLYPHS` does next
 * door: it is exhaustive, so adding a type to the shared list without a name
 * beside it is a type error on the next build rather than a blank label on a
 * pin's card. The mobile application holds its own copy against the same
 * catalogue, and fails the same way.
 *
 * Every key is written out rather than assembled from the identifier. A key
 * built as `` `markerType.${id}` `` would typecheck just as well and be
 * invisible to anything reading this repository for which sentences are
 * actually used — which is what `check:wording` does, from the other side.
 */
const TYPE_NAMES: Record<MarkerType, MessageKey> = {
  place: 'markerType.place',
  temple: 'markerType.temple',
  culture: 'markerType.culture',
  nature: 'markerType.nature',
  food: 'markerType.food',
  shopping: 'markerType.shopping',
  stay: 'markerType.stay',
  transport: 'markerType.transport',
}

/**
 * What to say for a marker type. A name, resolved by whoever draws it.
 *
 * It stops at the name deliberately — resolving here would be one helper that
 * quietly answers the language question for the whole application, which is
 * the one thing `say` takes an argument to prevent. Call sites resolve it in
 * the language in force, as they do everywhere else.
 *
 * Takes the stored identifier, which is unconstrained text — `MarkerView`
 * carries it as `string` on purpose, because a row written by an older build
 * may hold a retired type. `markerTypeOf` is the same total resolution the map
 * already runs to pick a colour and an icon, so a retired `castle` is named
 * `Culture` here exactly as it is drawn as `culture` there, and anything
 * unrecognised falls back to `Place` rather than to nothing.
 */
export function markerTypeMessage(typeId: string): Message {
  return message(TYPE_NAMES[markerTypeOf(typeId).id])
}
