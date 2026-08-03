import { z } from 'zod'

/**
 * One traveller's answer to "do you want to go here?".
 *
 * Recorded per member rather than as a flag on the marker, because a shared map
 * with two owners has no single answer to "is this a favourite?". Keeping the
 * two answers separate is what makes the filter that matters possible: show me
 * the places we *both* want to go.
 *
 * The absence of a record means undecided. That is a different state from
 * `interested: false`, and the difference is useful — undecided is the pile the
 * two of you have not been through together yet.
 */
export const markerInterestSchema = z.object({
  markerId: z.uuid(),
  memberId: z.uuid(),
  interested: z.boolean(),
  updatedAt: z.iso.datetime(),
})

export type MarkerInterest = z.infer<typeof markerInterestSchema>

export const newMarkerInterestSchema = markerInterestSchema.pick({
  markerId: true,
  memberId: true,
  interested: true,
})

export type NewMarkerInterest = z.infer<typeof newMarkerInterestSchema>

/** How a marker stands with one person, including the case of no answer yet. */
export type InterestState = 'interested' | 'not-interested' | 'undecided'

export function interestStateOf(
  record: Pick<MarkerInterest, 'interested'> | null | undefined,
): InterestState {
  if (!record) return 'undecided'
  return record.interested ? 'interested' : 'not-interested'
}
