import type { DayOrder, Marker } from '@pinpoint/core'
import { fetchTripDayOrders } from '@pinpoint/data'
import { useEffect, useRef } from 'react'

import { supabase } from '@/lib/supabase'
import { useQuery } from '@/lib/use-query'

/**
 * The order a trip's days have been put in, read and kept like any other list
 * — and read again whenever a place's days change.
 *
 * Kept under `day-orders-<trip id>`, so a trip opened with no signal still shows
 * each day in the order it last had (`offline-use`).
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
export function useDayOrders(tripId: string, markers: readonly Marker[]) {
  const query = useQuery<DayOrder>(() => fetchTripDayOrders(supabase, tripId), [tripId], {
    keep: `day-orders-${tripId}`,
  })
  const { refetch, set } = query

  // A day saved on another screen of this trip — the calendar, pushed over a
  // map that stays mounted underneath and would otherwise go on numbering its
  // pins in the order it read before.
  useEffect(
    () =>
      onDayOrderSaved((savedTrip, saved) => {
        if (savedTrip !== tripId) return
        set((rows) =>
          rows.some((row) => row.day === saved.day)
            ? rows.map((row) => (row.day === saved.day ? saved : row))
            : [...rows, saved],
        )
      }),
    [tripId, set],
  )

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
    void refetch({ force: true })
  }, [daysOfPlaces, refetch])

  return query
}

type SavedListener = (tripId: string, saved: DayOrder) => void
const savedListeners = new Set<SavedListener>()

/**
 * Tell every screen holding this trip's day orders that one has been saved.
 *
 * The phone's screens stack rather than replace each other, so the map is
 * still mounted while the calendar is used, holding its own copy of the
 * orders. This is how it hears about the calendar's saves without reading the
 * whole list again.
 */
export function dayOrderSaved(tripId: string, saved: DayOrder): void {
  for (const listener of savedListeners) listener(tripId, saved)
}

function onDayOrderSaved(listener: SavedListener): () => void {
  savedListeners.add(listener)
  return () => {
    savedListeners.delete(listener)
  }
}
