import { z } from 'zod'

import { markerTypeSchema } from './marker-type'

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
  price: z.number().nonnegative().nullable(),
  /** Shared by the whole trip: travelling companions visit a place together. */
  visited: z.boolean(),
  createdAt: z.iso.datetime(),
})

export type Marker = z.infer<typeof markerSchema>

/**
 * Fields a client supplies when dropping a marker.
 *
 * `visited` is absent: a marker is not visited when it is saved, and the
 * database owns that default.
 */
export const newMarkerSchema = markerSchema.pick({
  tripId: true,
  cityId: true,
  name: true,
  note: true,
  lng: true,
  lat: true,
  type: true,
  link: true,
  price: true,
})

export type NewMarker = z.infer<typeof newMarkerSchema>

/**
 * What may be changed about a marker after it exists.
 *
 * Derived from `newMarkerSchema` rather than written out again, so a field added
 * to one is editable in the other without anybody remembering to do it. The two
 * cannot drift.
 *
 * `tripId` is dropped: every access rule in the product resolves to the trip a
 * row belongs to, so an edit that could move a marker between trips would be an
 * edit that could move it out of reach. `visited` is absent for the same reason
 * it is absent from creation — it is recorded by marking a place visited, not by
 * editing a form.
 */
export const markerPatchSchema = newMarkerSchema.omit({ tripId: true }).partial()

export type MarkerPatch = z.infer<typeof markerPatchSchema>
