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
  /**
   * Roughly when the trip is. Both are optional and independent of each other:
   * a trip whose departure is booked and whose return is not is an ordinary
   * thing to hold, and most trips are created before either is known.
   *
   * `z.iso.date()`, not `datetime()`, and the distinction is load-bearing. A
   * timestamp is an instant, and an instant is a different calendar day
   * depending on where it is read — so a day chosen at home would come back as
   * the day before once somebody is standing in Kyōto. `createdAt` below is
   * correctly an instant, because it records a moment something happened.
   * These record days somebody picked.
   *
   * They constrain nothing. Nothing here or downstream may read them as a
   * boundary on what dates a marker may carry.
   */
  startsOn: z.iso.date().nullable(),
  endsOn: z.iso.date().nullable(),
  createdAt: z.iso.datetime(),
})

export type Trip = z.infer<typeof tripSchema>

/**
 * An end date may not fall before the start date.
 *
 * Applied to the two schemas that validate *input* and deliberately not to
 * `tripSchema` itself, for two reasons. The first is the read/write asymmetry
 * this repository already keeps on purpose: a read resolves what it is given
 * and carries on, because a row is a fact and refusing to render it helps
 * nobody. The second is mechanical — zod 4 refuses `.pick()` on an object
 * carrying refinements, and both schemas below are built by picking from it.
 *
 * Only fires when both dates are present. A patch setting one of them alone
 * cannot be judged here, because the other is in the database rather than in
 * the request; the check constraint on `trips` is what covers that case, and
 * it is the one that holds for every writer rather than only for this one.
 */
function endsOnOrAfterStart(value: {
  startsOn?: string | null
  endsOn?: string | null
}): boolean {
  if (value.startsOn == null || value.endsOn == null) return true
  return value.endsOn >= value.startsOn
}

const DATES_ORDERED = {
  message: 'The end date cannot be before the start date.',
  path: ['endsOn'],
}

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
export const newTripSchema = tripSchema
  .pick({ name: true })
  .extend({
    displayName: tripMemberSchema.shape.displayName,
    /*
     * Defaulted rather than merely nullable, which is the one place this
     * departs from how `newMarkerSchema` treats an optional field.
     *
     * A place is saved from a form that has a control for every field, so it
     * always has something to send and `null` is what it sends. A trip is
     * created from a form with two dates a person is invited to skip, and
     * "skipped" reaching here as an absent key is the ordinary case rather
     * than a caller being sloppy. Requiring an explicit null would make every
     * existing caller state twice that it has no dates.
     */
    startsOn: tripSchema.shape.startsOn.default(null),
    endsOn: tripSchema.shape.endsOn.default(null),
  })
  .refine(endsOnOrAfterStart, DATES_ORDERED)

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
  .pick({ name: true, archived: true, startsOn: true, endsOn: true })
  .partial()
  .refine(endsOnOrAfterStart, DATES_ORDERED)

export type TripPatch = z.infer<typeof tripPatchSchema>
