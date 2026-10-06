import type { DayOrder, IsoDay } from '@pinpoint/core'
import type { PinpointClient } from '@pinpoint/supabase'
import { message } from '@pinpoint/wording'

import { failed, readyOrEmpty, type SettledQueryState } from './query-state'
import { rejected, type WriteOutcome, wrote } from './write-outcome'

/**
 * Reading and saving the order a trip's days have been put in.
 *
 * One row per day, holding the day's place ids in order. The database keeps
 * each list complete as places gain and lose days (`markers_keep_day_orders`),
 * and `@pinpoint/core` reads it tolerantly, so a list that disagrees with the
 * places still draws a day — see `groupMarkersByDay`.
 */

const DAY_ORDER_COLUMNS = 'day, marker_ids'

interface DayOrderRow {
  day: string
  marker_ids: string[]
}

function toDayOrder(row: DayOrderRow): DayOrder {
  return { day: row.day, markerIds: row.marker_ids }
}

/**
 * Every day order of one trip.
 *
 * A failed read is reported like any other list's. A screen that cannot read
 * the orders still has the places, and lists each day by name until it can.
 */
export async function fetchTripDayOrders(
  client: PinpointClient,
  tripId: string,
): Promise<SettledQueryState<readonly DayOrder[]>> {
  const { data, error } = await client
    .from('day_orders')
    .select(DAY_ORDER_COLUMNS)
    .eq('trip_id', tripId)
    .order('day', { ascending: true })

  if (error || !data) return failed(message('place.loadFailed'))

  return readyOrEmpty(data.map(toDayOrder))
}

/**
 * Save one day's order, whole.
 *
 * One upsert of one row — the calendar calls this a second after the last
 * change, with the day as it is shown. No stale-read check: two people
 * reordering the same day at once is rare, the later save is the order the day
 * holds, and a place somebody else added meanwhile is not lost, because the
 * database appended it and reading puts what the list omits last.
 */
export async function saveDayOrder(
  client: PinpointClient,
  tripId: string,
  day: IsoDay,
  markerIds: readonly string[],
): Promise<WriteOutcome<DayOrder>> {
  const { data, error } = await client
    .from('day_orders')
    .upsert({ trip_id: tripId, day, marker_ids: [...markerIds] })
    .select(DAY_ORDER_COLUMNS)
    .single()

  if (error || !data) return rejected(message('calendar.orderNotSaved'))

  return wrote(toDayOrder(data))
}
