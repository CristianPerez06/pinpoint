'use client'

import type { DayOrder, Marker } from '@pinpoint/core'
import { fetchTripDayOrders } from '@pinpoint/data'
import type { PinpointClient } from '@pinpoint/supabase'
import { useEffect, useRef } from 'react'

import { useRows } from '@/lib/use-rows'

/**
 * The order a trip's days have been put in, read like any other list — and
 * read again whenever a place's days change.
 *
 * The database keeps each day's list complete: a place given a day is appended
 * to it, one moved off a day is taken out (`markers_keep_day_orders`). This
 * device only sees that by reading again. Without the re-read a place would
 * still land last — reading puts whatever a list omits at the end — except in
 * the one case that reads wrong: a place leaving a day and coming back to it
 * would reappear at its old position, from the list this device held.
 *
 * Every write that changes a place's days on this application settles before
 * the place's row is replaced, so the change seen here is already stored.
 */
export function useDayOrders(
  initial: readonly DayOrder[],
  supabase: PinpointClient,
  tripId: string,
  markers: readonly Marker[],
) {
  const rows = useRows<DayOrder>(initial)
  const refresh = rows[2]

  const daysOfPlaces = markers
    .map((marker) => `${marker.id}:${marker.plannedOn}:${marker.plannedUntil}`)
    .join('|')
  const seen = useRef(daysOfPlaces)

  useEffect(() => {
    if (seen.current === daysOfPlaces) return
    // From nothing is the trip's places arriving, not a place changing day:
    // the orders are being read alongside them already.
    const arriving = seen.current === ''
    seen.current = daysOfPlaces
    if (arriving) return
    void refresh(() => fetchTripDayOrders(supabase, tripId), { force: true })
  }, [daysOfPlaces, refresh, supabase, tripId])

  return rows
}
