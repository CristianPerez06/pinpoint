import {
  type City,
  type CityPatch,
  cityPatchSchema,
  type NewCity,
  newCitySchema,
} from '@pinpoint/core'
import type { Database, PinpointClient } from '@pinpoint/supabase'

import { failed, readyOrEmpty, type SettledQueryState } from './query-state'
import { validate } from './validate'
import { rejected, type WriteOutcome, wrote } from './write-outcome'

/**
 * Reading and writing the groups a trip's places are filed under.
 *
 * A city here is a name somebody chose for a cluster of places, not a
 * geographical fact. Nothing resolves the name to a position: the markers filed
 * under it already say where the group is, which is also what the place search
 * biases toward.
 */

const CITY_COLUMNS = 'id, trip_id, name, currency, created_at'

interface CityRow {
  id: string
  trip_id: string
  name: string
  currency: string | null
  created_at: string
}

function toCity(row: CityRow): City {
  return {
    id: row.id,
    tripId: row.trip_id,
    name: row.name,
    currency: row.currency,
    createdAt: row.created_at,
  }
}

export const CITIES_FAILED_MESSAGE = 'Could not load this trip’s cities.'
export const CITY_SAVE_FAILED_MESSAGE = 'Could not save this city.'
export const CITY_DELETE_FAILED_MESSAGE = 'Could not remove this city.'

/**
 * Every city on one trip, oldest first.
 *
 * Ordered the same way markers are, and tie-broken on `id` for the same reason:
 * rows written in one statement share a timestamp to the microsecond, and
 * without the tiebreak the order is left to the planner — which would let two
 * platforms disagree about which city a list opens on.
 */
export async function fetchTripCities(
  client: PinpointClient,
  tripId: string,
): Promise<SettledQueryState<readonly City[]>> {
  const { data, error } = await client
    .from('cities')
    .select(CITY_COLUMNS)
    .eq('trip_id', tripId)
    .order('created_at', { ascending: true })
    .order('id', { ascending: true })

  if (error || !data) return failed(CITIES_FAILED_MESSAGE)

  return readyOrEmpty(data.map(toCity))
}

type CityInsert = Database['public']['Tables']['cities']['Insert']
type CityUpdate = Database['public']['Tables']['cities']['Update']

function toInsertRow(input: NewCity): CityInsert {
  return {
    trip_id: input.tripId,
    name: input.name,
    currency: input.currency,
  }
}

/**
 * Only what the patch mentions. `undefined` leaves a field alone; `null` clears
 * it, which is how a currency set by mistake is removed rather than replaced.
 */
function toUpdateRow(patch: CityPatch): CityUpdate {
  const row: CityUpdate = {}
  if (patch.name !== undefined) row.name = patch.name
  if (patch.currency !== undefined) row.currency = patch.currency
  return row
}

/**
 * Create a city on a trip.
 *
 * Usually called from inside the form that is saving a place, which is why it
 * returns the stored row: the city has to be selectable and selected for the
 * place being added, immediately, without the form re-reading anything or the
 * person losing what they had typed.
 */
export async function createCity(
  client: PinpointClient,
  input: unknown,
): Promise<WriteOutcome<City>> {
  const validated = validate(newCitySchema, input)
  if (!validated.ok) return validated.outcome

  const { data, error } = await client
    .from('cities')
    .insert(toInsertRow(validated.data))
    .select(CITY_COLUMNS)
    .single()

  if (error || !data) return rejected(CITY_SAVE_FAILED_MESSAGE)

  return wrote(toCity(data))
}

/**
 * Rename a city, or set the currency its prices are read in.
 *
 * Both matter because a city is created mid-flow with whatever was known at the
 * time — frequently just a name. Without this a name typed in a hurry would be
 * permanent, and a currency skipped at creation could never be chosen at all.
 *
 * Changing the currency changes how amounts are read and never the amounts. They
 * were transcribed from a menu or a ticket; converting them would invent
 * precision and go stale the day it was written.
 */
export async function updateCity(
  client: PinpointClient,
  cityId: string,
  patch: unknown,
): Promise<WriteOutcome<City>> {
  const validated = validate(cityPatchSchema, patch)
  if (!validated.ok) return validated.outcome

  const { data, error } = await client
    .from('cities')
    .update(toUpdateRow(validated.data))
    .eq('id', cityId)
    .select(CITY_COLUMNS)
    .single()

  if (error || !data) return rejected(CITY_SAVE_FAILED_MESSAGE)

  return wrote(toCity(data))
}

/**
 * Remove a city. Its markers survive.
 *
 * The database unassigns them rather than deleting them — a composite foreign
 * key that nulls `city_id` alone, specifically so that removing a grouping never
 * removes the things grouped. Callers should still say how many markers this
 * will affect before asking somebody to confirm, because the consequence lands
 * on rows they are not looking at.
 */
export async function deleteCity(
  client: PinpointClient,
  cityId: string,
): Promise<WriteOutcome<string>> {
  const { error } = await client.from('cities').delete().eq('id', cityId)

  if (error) return rejected(CITY_DELETE_FAILED_MESSAGE)

  return wrote(cityId)
}
