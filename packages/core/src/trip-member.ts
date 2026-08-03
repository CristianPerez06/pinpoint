import { z } from 'zod'

/**
 * A person on a trip.
 *
 * A member is not a user. A user is an authenticated account; a member is
 * somebody travelling with you, who may not have signed up yet. `userId` is
 * therefore nullable, and everything attributed to a person — interest in a
 * marker, most importantly — references the member rather than the account.
 *
 * That indirection is what lets an account arrive later without rewriting a
 * single attributed row: one column is filled in and nothing else moves.
 *
 * `email` is the claim key. After sign-up the database links the new account to
 * the member row seeded for that address.
 */
export const tripMemberSchema = z.object({
  id: z.uuid(),
  tripId: z.uuid(),
  displayName: z.string().min(1).max(60),
  email: z.email(),
  userId: z.uuid().nullable(),
  createdAt: z.iso.datetime(),
})

export type TripMember = z.infer<typeof tripMemberSchema>

export const newTripMemberSchema = tripMemberSchema.pick({
  tripId: true,
  displayName: true,
  email: true,
})

export type NewTripMember = z.infer<typeof newTripMemberSchema>
