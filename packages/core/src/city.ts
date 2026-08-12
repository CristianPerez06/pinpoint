import { z } from 'zod'

import { CURRENCY_CODE_PATTERN } from './price'

/**
 * A coarse grouping of markers within a trip — the spreadsheet tab.
 *
 * A city belongs to one trip and is never shared between trips: two trips
 * visiting the same place each get their own record, so renaming one never
 * reaches the other. The duplicated name costs nothing.
 *
 * Cities answer "which day are we doing?". The finer question — what is close
 * enough to bundle into one outing — is answered by the map, not by a field.
 *
 * The name is whatever the person chose for a group of nearby places. It is
 * usually a real city, and nothing depends on it being one — no lookup resolves
 * it to a position, because the markers filed under it already say where the
 * group is.
 */
export const citySchema = z.object({
  id: z.uuid(),
  tripId: z.uuid(),
  name: z.string().min(1).max(120),
  /**
   * What the prices of this city's markers are denominated in.
   *
   * Null means unknown, and unknown is shown as a bare amount rather than
   * assumed. It sits on the city rather than the trip so one trip can cross a
   * border, and on the city rather than each marker so it is said once.
   */
  currency: z.string().regex(CURRENCY_CODE_PATTERN).nullable(),
  createdAt: z.iso.datetime(),
})

export type City = z.infer<typeof citySchema>

export const newCitySchema = citySchema.pick({
  tripId: true,
  name: true,
  currency: true,
})

export type NewCity = z.infer<typeof newCitySchema>

/**
 * What may be changed about a city after it exists.
 *
 * A city is usually created mid-flow while saving a place, with whatever was
 * known at that moment — frequently just a name. Without this, a name typed in a
 * hurry would be permanent and a currency skipped at creation could never be
 * chosen.
 *
 * `tripId` is absent deliberately: moving a city between trips would strand
 * every marker filed under it on the wrong side of the boundary all access
 * resolves to.
 */
export const cityPatchSchema = citySchema
  .pick({ name: true, currency: true })
  .partial()

export type CityPatch = z.infer<typeof cityPatchSchema>
