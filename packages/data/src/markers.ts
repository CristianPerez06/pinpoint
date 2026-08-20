import {
  type Marker,
  type MarkerPatch,
  markerPatchSchema,
  type NewMarker,
  newMarkerSchema,
} from '@pinpoint/core'
import type { Database, PinpointClient } from '@pinpoint/supabase'

import {
  failed,
  readyOrEmpty,
  type SettledQueryState,
} from './query-state'
import { validate } from './validate'
import { conflicted, rejected, type WriteOutcome, wrote } from './write-outcome'

/**
 * Reading a trip's markers.
 *
 * The client arrives already constructed. Web builds a cookie-backed one on the
 * server, native builds a keychain-backed one — neither belongs in a shared
 * package, and taking the client as an argument is what lets this one function
 * serve both. Same shape as `@pinpoint/auth`.
 */

/** Columns, named once. The map needs all of them; a `select('*')` would also work and would stop saying so. */
const MARKER_COLUMNS =
  'id, trip_id, city_id, name, note, lng, lat, type, link, price, visited, created_at, updated_at'

interface MarkerRow {
  id: string
  trip_id: string
  city_id: string | null
  name: string
  note: string | null
  lng: number
  lat: number
  type: string
  link: string | null
  price: number | null
  visited: boolean
  created_at: string
  updated_at: string
}

/**
 * Rows are not validated against `markerSchema` on the way in, and that is
 * deliberate. `type` is unconstrained text in the database, so a value written
 * by a newer version of the app would fail validation here and take the whole
 * trip's markers down with it. Reads resolve an unknown type to the fallback
 * and render; only writes reject.
 */
function toMarker(row: MarkerRow): Marker {
  return {
    id: row.id,
    tripId: row.trip_id,
    cityId: row.city_id,
    name: row.name,
    note: row.note,
    lng: row.lng,
    lat: row.lat,
    type: row.type,
    link: row.link,
    price: row.price,
    visited: row.visited,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export const MARKERS_FAILED_MESSAGE = 'Could not load the places on this trip.'

/**
 * Every marker of one trip, oldest first.
 *
 * Note what is absent: no check that the reader is on this trip. Row-level
 * security does that, and a filter here would hide a broken policy rather than
 * fix one. Passing a trip id the reader is not a member of returns nothing,
 * which is the correct answer and not an error.
 *
 * Returns rather than throws. A failed read is an ordinary thing for a screen
 * to render, and modelling it as a throw pushes every caller into a try/catch
 * that has to re-derive what it caught.
 */
export async function fetchTripMarkers(
  client: PinpointClient,
  tripId: string,
): Promise<SettledQueryState<readonly Marker[]>> {
  const { data, error } = await client
    .from('markers')
    .select(MARKER_COLUMNS)
    .eq('trip_id', tripId)
    .order('created_at', { ascending: true })
    // `id` breaks ties, and the ties are not hypothetical: a bulk import — or
    // the seed — writes every row in one statement, so they share a timestamp
    // to the microsecond and `created_at` alone leaves the order to the
    // planner. Two platforms would then disagree about which of several
    // markers at one point gets drawn, which the specification requires them
    // to agree on.
    .order('id', { ascending: true })

  // The database error text is not shown to anyone: it is written for whoever
  // is reading logs, not for whoever is looking at a map that will not load.
  if (error) return failed(MARKERS_FAILED_MESSAGE)
  if (!data) return failed(MARKERS_FAILED_MESSAGE)

  return readyOrEmpty(data.map(toMarker))
}

export const MARKER_SAVE_FAILED_MESSAGE = 'Could not save this place.'
export const MARKER_DELETE_FAILED_MESSAGE = 'Could not remove this place.'

type MarkerInsert = Database['public']['Tables']['markers']['Insert']
type MarkerUpdate = Database['public']['Tables']['markers']['Update']

/**
 * The database's column names for what a client supplies.
 *
 * Written out rather than derived from the key names, because this is the one
 * place the camelCase of the domain meets the snake_case of the schema, and a
 * clever transform would turn a typo into a silently dropped field. Typed
 * against the generated row types so that a column renamed in a migration fails
 * the build here rather than at runtime.
 */
function toInsertRow(input: NewMarker): MarkerInsert {
  return {
    trip_id: input.tripId,
    city_id: input.cityId,
    name: input.name,
    note: input.note,
    lng: input.lng,
    lat: input.lat,
    type: input.type,
    link: input.link,
    price: input.price,
  }
}

/**
 * Only what the patch actually mentions.
 *
 * `undefined` means "leave alone" and `null` means "clear", and the difference
 * is the whole reason this is built key by key rather than spread: spreading
 * would send every absent field as null and quietly wipe the note off a marker
 * whose name was being corrected.
 */
function toUpdateRow(patch: MarkerPatch): MarkerUpdate {
  const row: MarkerUpdate = {}
  if (patch.cityId !== undefined) row.city_id = patch.cityId
  if (patch.name !== undefined) row.name = patch.name
  if (patch.note !== undefined) row.note = patch.note
  if (patch.lng !== undefined) row.lng = patch.lng
  if (patch.lat !== undefined) row.lat = patch.lat
  if (patch.type !== undefined) row.type = patch.type
  if (patch.link !== undefined) row.link = patch.link
  if (patch.price !== undefined) row.price = patch.price
  return row
}

/**
 * Save a new place on a trip.
 *
 * Validates first, and returns before touching the network when the input is
 * wrong — a form with a blank name should be told so immediately, not after a
 * round trip that was always going to be refused.
 *
 * Note the absence of any membership check. Row-level security decides whether
 * this account may write to this trip, and a check here would duplicate that
 * rule in a place that cannot enforce it. A write to a trip the account is not
 * on is refused by the database and arrives here as a rejection.
 *
 * Returns the stored row, so the map can draw the new marker from what came back
 * rather than re-reading every marker on the trip to find the one just added.
 */
export async function createMarker(
  client: PinpointClient,
  input: unknown,
): Promise<WriteOutcome<Marker>> {
  const validated = validate(newMarkerSchema, input)
  if (!validated.ok) return validated.outcome

  const { data, error } = await client
    .from('markers')
    .insert(toInsertRow(validated.data))
    .select(MARKER_COLUMNS)
    .single()

  if (error || !data) return rejected(MARKER_SAVE_FAILED_MESSAGE)

  return wrote(toMarker(data))
}

export const MARKER_CONFLICT_MESSAGE =
  'Somebody else changed this place while you were editing it. Nothing you typed has been lost — open it again to see their version.'

/**
 * Change a place that already exists.
 *
 * A partial patch: a field left out is left alone, which is different from a
 * field set to null. Sending only what changed is what keeps two people editing
 * *different* fields of the same marker from overwriting each other by accident.
 *
 * `expectedUpdatedAt` is what stops them overwriting each other when they edit
 * the same one. The caller states the version its edit was based on, and it goes
 * into the statement as a filter rather than as a check beforehand — Postgres
 * matches and writes atomically, so there is no window between deciding the row
 * is unchanged and changing it. Reading first and comparing in application code
 * would leave exactly that window, and it is the window the whole guarantee is
 * about.
 */
export async function updateMarker(
  client: PinpointClient,
  markerId: string,
  patch: unknown,
  expectedUpdatedAt: string,
): Promise<WriteOutcome<Marker>> {
  const validated = validate(markerPatchSchema, patch)
  if (!validated.ok) return validated.outcome

  const { data, error } = await client
    .from('markers')
    .update(toUpdateRow(validated.data))
    .eq('id', markerId)
    .eq('updated_at', expectedUpdatedAt)
    .select(MARKER_COLUMNS)
    .single()

  if (data) return wrote(toMarker(data))

  /*
   * Nothing matched — which is two different situations wearing the same error.
   * The row moved on since it was read, or it is not there at all because
   * somebody removed it. Telling a person "somebody else changed this place"
   * about a place that no longer exists would send them looking for a version
   * that cannot be found.
   *
   * So it is asked. One extra read on a path that has already failed, in
   * exchange for never reporting the wrong reason.
   */
  if (error) {
    const { data: current } = await client
      .from('markers')
      .select('updated_at')
      .eq('id', markerId)
      .maybeSingle()

    if (current) return conflicted(MARKER_CONFLICT_MESSAGE)
  }

  return rejected(MARKER_SAVE_FAILED_MESSAGE)
}

/**
 * Remove a place, permanently.
 *
 * Returns the id so a caller holding a list can drop the right row without
 * having to remember which one it asked about.
 *
 * There is no soft delete and no undo. Adding either would mean every read
 * learning to filter, and a wishlist is not a document — removing something
 * somebody decided against is the ordinary case, not an accident to guard.
 */
export async function deleteMarker(
  client: PinpointClient,
  markerId: string,
): Promise<WriteOutcome<string>> {
  const { error } = await client.from('markers').delete().eq('id', markerId)

  if (error) return rejected(MARKER_DELETE_FAILED_MESSAGE)

  return wrote(markerId)
}
