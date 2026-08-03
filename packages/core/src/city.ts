import { z } from 'zod'

/**
 * A coarse grouping of markers within a trip — the spreadsheet tab.
 *
 * A city belongs to one trip and is never shared between trips: two trips
 * visiting the same place each get their own record, so renaming one never
 * reaches the other. The duplicated name costs nothing.
 *
 * Cities answer "which day are we doing?". The finer question — what is close
 * enough to bundle into one outing — is answered by the map, not by a field.
 */
export const citySchema = z.object({
  id: z.uuid(),
  tripId: z.uuid(),
  name: z.string().min(1).max(120),
  createdAt: z.iso.datetime(),
})

export type City = z.infer<typeof citySchema>

export const newCitySchema = citySchema.pick({ tripId: true, name: true })

export type NewCity = z.infer<typeof newCitySchema>
