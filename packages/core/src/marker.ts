import { z } from 'zod'

/**
 * A place someone wants to go.
 *
 * `lng`/`lat` are named to match what the map layer consumes, so a `Marker`
 * structurally satisfies `LngLat` from `@pinpoint/map` without this package
 * depending on it — the map package sits at the base of the graph and takes no
 * workspace dependencies.
 */
export const markerSchema = z.object({
  id: z.uuid(),
  tripId: z.uuid(),
  name: z.string().min(1).max(200),
  note: z.string().max(2000).nullable(),
  lng: z.number().min(-180).max(180),
  lat: z.number().min(-90).max(90),
  createdAt: z.iso.datetime(),
})

export type Marker = z.infer<typeof markerSchema>

/** Fields a client supplies when dropping a marker. */
export const newMarkerSchema = markerSchema.pick({
  tripId: true,
  name: true,
  note: true,
  lng: true,
  lat: true,
})

export type NewMarker = z.infer<typeof newMarkerSchema>
