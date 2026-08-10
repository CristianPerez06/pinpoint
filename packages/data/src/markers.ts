import type { Marker } from '@pinpoint/core'
import type { PinpointClient } from '@pinpoint/supabase'

import {
  failed,
  readyOrEmpty,
  type SettledQueryState,
} from './query-state'

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
  'id, trip_id, city_id, name, note, lng, lat, type, link, price, visited, created_at'

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
  }
}

export const MARKERS_FAILED_MESSAGE = 'Could not load the places on this trip.'

/* ===========================================================================
 * TEMPORARY — verification scaffold for render-trip-map tasks 6.2, 6.3, 6.11.
 *
 * Change the value below, save, and both apps pick it up (web hot-reloads;
 * mobile fast-refreshes). Set it back to `null` when you are done, or run
 *
 *     git checkout packages/data/src/markers.ts
 *
 * DELETE THIS BLOCK BEFORE MERGING. It is deliberately ugly so it cannot be
 * mistaken for something that belongs here.
 *
 *   'empty'   a trip with no markers            -> task 6.2
 *   'single'  a trip with exactly one marker    -> task 6.3
 *   'failed'  the query genuinely fails         -> task 6.11
 *   null      normal
 *
 * Each one goes through the real code path rather than short-circuiting: the
 * empty case queries a trip that exists nowhere, and the failed case asks the
 * database for a column that does not exist, so PostgREST returns a real error
 * and the real `if (error)` branch below runs. An error branch that has only
 * ever been reached by a stub is the one that will be wrong.
 * ======================================================================== */
const FORCE_STATE: 'empty' | 'single' | 'failed' | null = null

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
  // TEMPORARY: see the FORCE_STATE block above. Both lines are inert when it
  // is null, and both disappear with the scaffold.
  const columns =
    FORCE_STATE === 'failed'
      ? ('id, no_such_column' as typeof MARKER_COLUMNS)
      : MARKER_COLUMNS
  const targetTrip =
    FORCE_STATE === 'empty' ? '00000000-0000-4000-8000-000000000000' : tripId

  const query = client
    .from('markers')
    .select(columns)
    .eq('trip_id', targetTrip)
    .order('created_at', { ascending: true })
    // `id` breaks ties, and the ties are not hypothetical: a bulk import — or
    // the seed — writes every row in one statement, so they share a timestamp
    // to the microsecond and `created_at` alone leaves the order to the
    // planner. Two platforms would then disagree about which of several
    // markers at one point gets drawn, which the specification requires them
    // to agree on.
    .order('id', { ascending: true })

  // TEMPORARY: see the FORCE_STATE block above.
  const { data, error } = await (FORCE_STATE === 'single' ? query.limit(1) : query)

  // The database error text is not shown to anyone: it is written for whoever
  // is reading logs, not for whoever is looking at a map that will not load.
  if (error) return failed(MARKERS_FAILED_MESSAGE)
  if (!data) return failed(MARKERS_FAILED_MESSAGE)

  return readyOrEmpty(data.map(toMarker))
}
