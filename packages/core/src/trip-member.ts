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
  /*
   * The message has to read in two places. `newTripSchema` borrows this field
   * for what the *creator* calls themselves on the trip they are making, and
   * the people sheet uses it for what somebody *else* will be called — so it
   * says neither "your name" nor "their name".
   */
  displayName: z
    .string()
    .min(1, 'Enter the name to show on this trip.')
    .max(60, 'A name can be 60 characters at most.'),
  // Word for word what the sign-in screen says for the same mistake. One error
  // with two answers is how a product starts sounding like several; the test in
  // `refusal-messages.test.ts` fails if these two drift apart.
  email: z.email('Enter a valid email address.'),
  userId: z.uuid().nullable(),
  createdAt: z.iso.datetime(),
})

export type TripMember = z.infer<typeof tripMemberSchema>

/**
 * The fields of an invitation the surface already knows — the trip being
 * invited to. The name and the address are both typed.
 *
 * Stated as the exclusions for the reason `MARKER_SURFACE_FIELDS` gives.
 */
export const TRIP_MEMBER_SURFACE_FIELDS = ['tripId'] as const

export const newTripMemberSchema = tripMemberSchema.pick({
  tripId: true,
  displayName: true,
  email: true,
})

export type NewTripMember = z.infer<typeof newTripMemberSchema>
