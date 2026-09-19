import { z } from 'zod'

import { markerTypeSchema } from './marker-type'
import { openingHoursSchema } from './opening-hours'

/**
 * A place someone wants to go.
 *
 * `lng`/`lat` are named to match what the map layer consumes, so a `Marker`
 * structurally satisfies `LngLat` from `@pinpoint/map` without this package
 * depending on it — the map package sits at the base of the graph and takes no
 * workspace dependencies.
 *
 * Optional fields are nullable rather than absent. A marker with no note holds
 * `null`, never `''` — the two are indistinguishable in a form and very
 * distinguishable in a query.
 */
export const markerSchema = z.object({
  id: z.uuid(),
  tripId: z.uuid(),
  /** Null means unassigned, which is a valid resting state, not a gap to fill. */
  cityId: z.uuid().nullable(),
  name: z.string().min(1).max(200),
  note: z.string().max(2000).nullable(),
  lng: z.number().min(-180).max(180),
  lat: z.number().min(-90).max(90),
  type: markerTypeSchema,
  /** Where the place was found — the answer to "why did we save this?". */
  link: z.url().max(2000).nullable(),
  /** In US dollars, always. Zero is a free place; null is a price nobody has entered. */
  price: z.number().nonnegative().nullable(),
  /**
   * The day this place is planned for, or null while that is undecided.
   *
   * A calendar date and never an instant. A timestamp is a different day
   * depending on where it is read, so a place put on Thursday at home would
   * come back as Wednesday once somebody is standing in Kyōto — which is
   * exactly when this has to be right. `createdAt` and `updatedAt` below are
   * correctly instants; they record moments rather than days somebody chose.
   *
   * Independent of `cityId` in both directions. A city and a day are two
   * groupings of one set of places, sitting beside each other rather than one
   * inside the other, so neither derives, defaults or constrains the other —
   * a day trip that crosses a city boundary is an ordinary thing to plan.
   *
   * Also independent of the trip's own dates, which may be absent and are not
   * a boundary. A place dated a day either side of the trip is somebody's
   * decision, not an error.
   */
  plannedOn: z.iso.date().nullable(),
  /**
   * The days the place is open and at what times, or null while nobody has
   * entered them — which is never the same as closed. See `opening-hours.ts`.
   */
  hours: openingHoursSchema.nullable(),
  /** Shared by the whole trip: travelling companions visit a place together. */
  visited: z.boolean(),
  createdAt: z.iso.datetime(),
  /**
   * When this place was last changed, maintained by the database.
   *
   * Read as the version an edit is based on: a save states the value it started
   * from, and one that no longer matches is refused rather than applied. It is
   * deliberately absent from `markerPatchSchema` below — a precondition of a
   * write is not a field somebody edits, and accepting it there would let a
   * caller assert the very thing the check exists to verify.
   */
  updatedAt: z.iso.datetime(),
})

export type Marker = z.infer<typeof markerSchema>

/**
 * Fields a client supplies when dropping a marker.
 *
 * `visited` is absent: a marker is not visited when it is saved, and the
 * database owns that default.
 */
/**
 * The fields a client may write, before either schema puts its own gloss on
 * them.
 *
 * Named once and derived from twice, so a field added to a marker is writable
 * on creation and editable afterwards without anybody remembering to do both.
 * What each of the two does with `plannedOn` differs, and that is the only
 * reason this exists separately.
 */
const writableMarkerFields = markerSchema.pick({
  tripId: true,
  cityId: true,
  name: true,
  note: true,
  lng: true,
  lat: true,
  type: true,
  link: true,
  price: true,
  plannedOn: true,
  hours: true,
})

/**
 * Fields a client supplies when dropping a marker.
 *
 * `visited` is absent: a marker is not visited when it is saved, and the
 * database owns that default.
 *
 * `plannedOn` is defaulted rather than merely nullable, unlike the three other
 * optional fields. Those are absent-as-null because the form that writes them
 * has a control for every one, so it always has something to send.
 *
 * Both applications offer a day now, so neither relies on this default any
 * longer — and it stays anyway. A client that cannot express a day is a client
 * whose places have no day, which is the ordinary case rather than a caller
 * being careless, and the failure it prevents is not hypothetical: requiring the
 * key made every save from the phone fail validation the moment this field was
 * added, in the window before the phone had a control. The type system could not
 * say so, because `createMarker` takes `unknown`. A test is what said so instead,
 * and it is still the only thing that would.
 */
export const newMarkerSchema = writableMarkerFields.extend({
  plannedOn: markerSchema.shape.plannedOn.default(null),
  // Defaulted for the same reason as `plannedOn`: a client that cannot express
  // hours yet is a client whose places have none, not one whose saves fail.
  hours: markerSchema.shape.hours.default(null),
})

export type NewMarker = z.infer<typeof newMarkerSchema>

/**
 * What may be changed about a marker after it exists.
 *
 * Derived from the shared field list rather than written out again, so the two
 * cannot drift.
 *
 * Deliberately **not** derived from `newMarkerSchema`, which is where it used
 * to come from. A default survives `.partial()`: an absent key in a patch means
 * "leave this alone", so inheriting `plannedOn`'s default would have cleared
 * the day of every place edited by anything that did not mention one — the
 * phone's every edit, for a start. The two schemas want opposite things from
 * the same absent key, which is the whole reason the field list above is
 * separate from either.
 *
 * `tripId` is dropped: every access rule in the product resolves to the trip a
 * row belongs to, so an edit that could move a marker between trips would be an
 * edit that could move it out of reach. `visited` is absent for the same reason
 * it is absent from creation — it is recorded by marking a place visited, not by
 * editing a form.
 */
export const markerPatchSchema = writableMarkerFields
  .omit({ tripId: true })
  .partial()

export type MarkerPatch = z.infer<typeof markerPatchSchema>
