import type { Trip } from '@pinpoint/core'
import type { PinpointClient } from '@pinpoint/supabase'

import {
  failed,
  readyOrEmpty,
  type SettledQueryState,
} from './query-state'

const TRIP_COLUMNS = 'id, name, archived, created_at'

interface TripRow {
  id: string
  name: string
  archived: boolean
  created_at: string
}

function toTrip(row: TripRow): Trip {
  return {
    id: row.id,
    name: row.name,
    archived: row.archived,
    createdAt: row.created_at,
  }
}

export const TRIPS_FAILED_MESSAGE = 'Could not load your trips.'

/**
 * The trips this account is on, oldest first.
 *
 * There is no `.eq()` on the reader's id and no filtering of the result. The
 * query asks for every trip and the database returns the ones this account is a
 * member of; if that were wrong, a filter here would hide it rather than fix
 * it.
 *
 * An account with no membership gets `empty`, which is what someone who signed
 * up before being invited should see — not an error.
 */
export async function fetchTrips(
  client: PinpointClient,
): Promise<SettledQueryState<readonly Trip[]>> {
  const { data, error } = await client
    .from('trips')
    .select(TRIP_COLUMNS)
    .order('created_at', { ascending: true })

  if (error || !data) return failed(TRIPS_FAILED_MESSAGE)

  return readyOrEmpty(data.map(toTrip))
}
