import { z } from 'zod'

/**
 * A trip is one shared map. Everyone travelling together works on the same
 * trip; markers belong to it.
 */
export const tripSchema = z.object({
  id: z.uuid(),
  name: z.string().min(1).max(120),
  createdAt: z.iso.datetime(),
})

export type Trip = z.infer<typeof tripSchema>

/** Fields a client supplies when creating a trip. The rest is assigned by the server. */
export const newTripSchema = tripSchema.pick({ name: true })

export type NewTrip = z.infer<typeof newTripSchema>
