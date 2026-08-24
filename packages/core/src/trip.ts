import { z } from 'zod'

import { tripMemberSchema } from './trip-member'

/**
 * A trip is one shared map. Everyone travelling together works on the same
 * trip; markers belong to it.
 */
export const tripSchema = z.object({
  id: z.uuid(),
  name: z.string().min(1).max(120),
  /** Past trips stay readable but stop cluttering the list. */
  archived: z.boolean(),
  createdAt: z.iso.datetime(),
})

export type Trip = z.infer<typeof tripSchema>

/**
 * Fields a client supplies when creating a trip. The rest is assigned by the
 * server.
 *
 * `displayName` is not a field of a trip — it is what the creator is called on
 * the one they are making. It lives here because the two are inseparable: a trip
 * cannot exist without a member, so the only moment a trip is created is also
 * the only moment its first member is, and asking for both at once is what stops
 * the database inventing a name from an email address.
 *
 * The bound is `trip_members.display_name`'s, restated from the member schema so
 * there is one definition of how long a person's name may be.
 */
export const newTripSchema = tripSchema.pick({ name: true }).extend({
  displayName: tripMemberSchema.shape.displayName,
})

export type NewTrip = z.infer<typeof newTripSchema>

/**
 * What may be changed about a trip after it exists.
 *
 * The name and whether it is archived. `archived` waited here, modelled but not
 * writable, from the initial schema until there was somewhere to set it from —
 * which is the change that added the trips sheet.
 *
 * Archiving is the answer to "delete a trip", and it is the only answer: no
 * table in this schema has a delete policy. A trip is the container every other
 * record belongs to, so removing one would destroy an unbounded amount of other
 * people's work, including the work of members who did not ask for it.
 *
 * Which is also why setting it back is an ordinary patch rather than a
 * privileged one. An archive nobody can undo recreates precisely what the
 * initial schema went out of its way to prevent — a trip that exists, that no
 * select path reaches, and that no policy can remove — arrived at deliberately
 * instead of by accident.
 */
export const tripPatchSchema = tripSchema
  .pick({ name: true, archived: true })
  .partial()

export type TripPatch = z.infer<typeof tripPatchSchema>
