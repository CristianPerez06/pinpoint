import {
  newTripSchema,
  type Trip,
  type TripPatch,
  tripPatchSchema,
} from '@pinpoint/core'
import type { Database, PinpointClient } from '@pinpoint/supabase'

import {
  failed,
  readyOrEmpty,
  type SettledQueryState,
} from './query-state'
import { validate } from './validate'
import { rejected, type WriteOutcome, wrote } from './write-outcome'

const TRIP_COLUMNS = 'id, name, archived, starts_on, ends_on, created_at'

type TripUpdate = Database['public']['Tables']['trips']['Update']

interface TripRow {
  id: string
  name: string
  archived: boolean
  starts_on: string | null
  ends_on: string | null
  created_at: string
}

function toTrip(row: TripRow): Trip {
  return {
    id: row.id,
    name: row.name,
    archived: row.archived,
    startsOn: row.starts_on,
    endsOn: row.ends_on,
    createdAt: row.created_at,
  }
}

/**
 * A validated patch as the columns it writes.
 *
 * Every trip column until now was one word, so a camel-cased patch happened to
 * be spelled the same as the row and could be handed to `.update()` untouched.
 * `startsOn` is the first that is not, and a key the table has no column for is
 * not a loud failure — it is the kind of thing that returns an error naming a
 * column nobody wrote. Stated field by field so the two spellings meet in one
 * place.
 *
 * A field absent from the patch stays absent here: a rename must not carry an
 * implicit `starts_on: null` that clears dates nobody asked to clear.
 */
function toTripColumns(patch: TripPatch): TripUpdate {
  const columns: TripUpdate = {}
  if ('name' in patch) columns.name = patch.name
  if ('archived' in patch) columns.archived = patch.archived
  if ('startsOn' in patch) columns.starts_on = patch.startsOn
  if ('endsOn' in patch) columns.ends_on = patch.endsOn
  return columns
}

export const TRIPS_FAILED_MESSAGE = 'Could not load your trips.'

/**
 * The trips this account is on, oldest first.
 *
 * There is no `.eq()` on the reader's id and no filtering of the result by
 * membership. The query asks for every trip and the database returns the ones
 * this account is a member of; if that were wrong, a filter here would hide it
 * rather than fix it.
 *
 * Archived trips are excluded unless asked for, and the default is that way
 * round on purpose: a caller who forgets shows the list somebody expects. The
 * filter is a real `.eq()` rather than a `.filter()` on the result, so an
 * archived trip is never carried across the wire to be dropped afterwards.
 *
 * Asking for them is `{ includeArchived: true }` — one flag rather than a second
 * function, because the two differ by a predicate and nothing else, and two
 * functions would be two places to keep the column list and the ordering in
 * step.
 *
 * An account with no membership gets `empty`, which is what someone who signed
 * up before being invited should see — not an error. So does an account whose
 * every trip is archived, and that is the same statement: there is nothing to
 * show you here, rather than something went wrong.
 */
export async function fetchTrips(
  client: PinpointClient,
  { includeArchived = false }: { includeArchived?: boolean } = {},
): Promise<SettledQueryState<readonly Trip[]>> {
  const base = client.from('trips').select(TRIP_COLUMNS)

  const { data, error } = await (includeArchived ? base : base.eq('archived', false))
    .order('created_at', { ascending: true })
    // Deterministic tiebreak, for the same reason as markers — and it matters
    // more here, because the first row of this list is the trip the map draws.
    .order('id', { ascending: true })

  if (error || !data) return failed(TRIPS_FAILED_MESSAGE)

  return readyOrEmpty(data.map(toTrip))
}

export const TRIP_CREATE_FAILED_MESSAGE = 'Could not create that trip.'
export const TRIP_SAVE_FAILED_MESSAGE = 'Could not save that trip.'

/**
 * Make a trip, and become its first member.
 *
 * Through a database function rather than an insert, and that is the whole
 * design rather than a detail. A trip cannot exist without a member — every
 * select policy in the schema resolves to membership, so a memberless trip is
 * unreachable and, with no delete policy, unremovable. Two writes from here
 * could leave exactly that behind if the second failed. `create_trip` writes
 * both rows in one statement block, so there is no such window and `trips` needs
 * no insert policy at all.
 *
 * The creator's email is not a parameter. The function reads it from the
 * verified session, which is what makes creating a trip as somebody else
 * impossible rather than merely unlikely.
 *
 * Returns the stored row, so the trip can be opened immediately without
 * re-reading the list — the same reason `createCity` returns one.
 */
export async function createTrip(
  client: PinpointClient,
  input: unknown,
): Promise<WriteOutcome<Trip>> {
  const validated = validate(newTripSchema, input)
  if (!validated.ok) return validated.outcome

  const { data: tripId, error } = await client.rpc('create_trip', {
    trip_name: validated.data.name,
    member_name: validated.data.displayName,
    // Absent rather than null, which is what the generated signature says the
    // arguments are: `create_trip` declares them `date default null`, so an
    // omitted argument and an explicit null reach the column as the same value.
    // Sending `undefined` is what makes the two agree.
    trip_starts_on: validated.data.startsOn ?? undefined,
    trip_ends_on: validated.data.endsOn ?? undefined,
  })

  // Null rather than an error is what the function returns when there is no
  // session, so it has to be treated as a refusal rather than as success.
  if (error || !tripId) return rejected(TRIP_CREATE_FAILED_MESSAGE)

  // Read back rather than assembled here. The row carries `created_at` and
  // `archived` from the database, and constructing them locally would be
  // inventing values that only look right.
  const { data, error: readError } = await client
    .from('trips')
    .select(TRIP_COLUMNS)
    .eq('id', tripId)
    .single()

  if (readError || !data) return rejected(TRIP_CREATE_FAILED_MESSAGE)

  return wrote(toTrip(data))
}

/**
 * Rename a trip.
 *
 * Permitted by `trips_update_member`, which has existed since the initial schema
 * and until now had no caller — a policy written for a capability that was not
 * built for another five changes.
 *
 * A partial patch, like a city's: a field left out is left alone. `archived` is
 * among them now, so archiving and restoring are this function with a flag
 * rather than writes of their own — they change one column on one row and
 * differ from a rename in nothing but which column.
 *
 * The same policy covers all of it. `trips_update_member` permits a member to
 * update the trip; row-level security in Postgres is per row, not per column,
 * so widening what the schema accepts widened nothing in the database. That is
 * worth knowing rather than assuming, and the probe in this change's tasks is
 * what turned it from an assumption into an observation.
 */
export async function updateTrip(
  client: PinpointClient,
  tripId: string,
  patch: unknown,
): Promise<WriteOutcome<Trip>> {
  const validated = validate(tripPatchSchema, patch)
  if (!validated.ok) return validated.outcome

  const { data, error } = await client
    .from('trips')
    .update(toTripColumns(validated.data))
    .eq('id', tripId)
    .select(TRIP_COLUMNS)
    .single()

  if (error || !data) return rejected(TRIP_SAVE_FAILED_MESSAGE)

  return wrote(toTrip(data))
}
