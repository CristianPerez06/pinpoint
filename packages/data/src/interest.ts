import {
  type MarkerInterest,
  newMarkerInterestSchema,
  type TripMember,
} from '@pinpoint/core'
import type { PinpointClient } from '@pinpoint/supabase'

import { failed, readyOrEmpty, type SettledQueryState } from './query-state'
import { validate } from './validate'
import { rejected, type WriteOutcome, wrote } from './write-outcome'

/**
 * Reading and writing who wants to go where.
 *
 * The same shape as the marker and city readers: the client arrives already
 * constructed, reads return a settled state rather than throwing, and nothing
 * here checks membership. Row-level security decides what comes back and what is
 * accepted; re-deciding it here would hide a broken policy instead of exposing
 * one.
 */

const INTEREST_COLUMNS = 'marker_id, member_id, interested, updated_at'

interface InterestRow {
  marker_id: string
  member_id: string
  interested: boolean
  updated_at: string
}

function toInterest(row: InterestRow): MarkerInterest {
  return {
    markerId: row.marker_id,
    memberId: row.member_id,
    interested: row.interested,
    updatedAt: row.updated_at,
  }
}

export const INTEREST_FAILED_MESSAGE = 'Could not load who wants to go where.'
export const INTEREST_SAVE_FAILED_MESSAGE = 'Could not save that.'
export const MEMBERS_FAILED_MESSAGE = 'Could not load the people on this trip.'
export const VISITED_FAILED_MESSAGE = 'Could not change whether this place is visited.'

/**
 * Every interest record on one trip.
 *
 * `marker_interest` carries no trip of its own — it hangs off a marker — so the
 * trip is reached through the marker with an inner join. Selecting the join
 * column and filtering on it is what keeps this one round trip rather than
 * fetching the trip's markers first and asking for their records by id.
 */
export async function fetchTripInterest(
  client: PinpointClient,
  tripId: string,
): Promise<SettledQueryState<readonly MarkerInterest[]>> {
  const { data, error } = await client
    .from('marker_interest')
    .select(`${INTEREST_COLUMNS}, markers!inner(trip_id)`)
    .eq('markers.trip_id', tripId)

  if (error || !data) return failed(INTEREST_FAILED_MESSAGE)

  return readyOrEmpty(data.map(toInterest))
}

/**
 * The people on a trip.
 *
 * Needed for two things the filter cannot do without: knowing how many members
 * there are, because "everyone wants to go" is meaningless otherwise, and naming
 * them, because the whole point of per-member interest is answering *who*.
 */
export async function fetchTripMembers(
  client: PinpointClient,
  tripId: string,
): Promise<SettledQueryState<readonly TripMember[]>> {
  const { data, error } = await client
    .from('trip_members')
    .select('id, trip_id, display_name, email, user_id, created_at')
    .eq('trip_id', tripId)
    .order('created_at', { ascending: true })
    .order('id', { ascending: true })

  if (error || !data) return failed(MEMBERS_FAILED_MESSAGE)

  return readyOrEmpty(
    data.map((row) => ({
      id: row.id,
      tripId: row.trip_id,
      displayName: row.display_name,
      email: row.email,
      userId: row.user_id,
      createdAt: row.created_at,
    })),
  )
}

/**
 * Which member the reader is on this trip, or null.
 *
 * Null is an ordinary answer rather than an error: a member exists before the
 * account does, so somebody can be looking at a trip through an account that no
 * member row points at yet. They can read; they have nothing to attribute a
 * write to, and the interface should offer them no way to try.
 *
 * Takes the members already in hand rather than querying again — the caller
 * needs them anyway, and the user id comes from the guard that has already run.
 */
export function ownMemberOf(
  members: readonly TripMember[],
  userId: string,
): TripMember | null {
  return members.find((member) => member.userId === userId) ?? null
}

/**
 * Record that one member does or does not want to go somewhere.
 *
 * An upsert, because answering twice is the ordinary case — somebody changes
 * their mind — and the primary key already says one answer per member per
 * marker.
 *
 * Nothing here checks that the member being written is the writer's own. The
 * policy does, and a check here would state the rule a second time in a place
 * that cannot enforce it.
 */
export async function recordInterest(
  client: PinpointClient,
  input: unknown,
): Promise<WriteOutcome<MarkerInterest>> {
  const validated = validate(newMarkerInterestSchema, input)
  if (!validated.ok) return validated.outcome

  const { markerId, memberId, interested } = validated.data

  const { data, error } = await client
    .from('marker_interest')
    .upsert(
      { marker_id: markerId, member_id: memberId, interested },
      { onConflict: 'marker_id,member_id' },
    )
    .select(INTEREST_COLUMNS)
    .single()

  if (error || !data) return rejected(INTEREST_SAVE_FAILED_MESSAGE)

  return wrote(toInterest(data))
}

/**
 * Take back an answer, returning the member to undecided.
 *
 * Deletes rather than writing a third value. The model defines the absence of a
 * record as undecided, so storing "undecided" would give one state two
 * representations, and some code would eventually check the wrong one.
 */
export async function withdrawInterest(
  client: PinpointClient,
  markerId: string,
  memberId: string,
): Promise<WriteOutcome<{ markerId: string; memberId: string }>> {
  const { error } = await client
    .from('marker_interest')
    .delete()
    .eq('marker_id', markerId)
    .eq('member_id', memberId)

  if (error) return rejected(INTEREST_SAVE_FAILED_MESSAGE)

  return wrote({ markerId, memberId })
}

/**
 * Mark a place visited, or not, for the whole trip.
 *
 * No author is recorded, because the model says visiting is shared: travelling
 * companions go to a place together, and "who marked it" is a question nobody on
 * the trip needs answered.
 *
 * This writes `markers.visited` rather than going through `updateMarker`, so
 * that marking a place visited cannot be mistaken for editing it — the marker
 * patch is the capture capability's, and visited belongs to this one.
 */
export async function setMarkerVisited(
  client: PinpointClient,
  markerId: string,
  visited: boolean,
): Promise<WriteOutcome<{ markerId: string; visited: boolean }>> {
  const { error } = await client
    .from('markers')
    .update({ visited })
    .eq('id', markerId)

  if (error) return rejected(VISITED_FAILED_MESSAGE)

  return wrote({ markerId, visited })
}
