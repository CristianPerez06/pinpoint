import type { CalendarView, IsoDay } from '@pinpoint/core'

/**
 * The calendar asking the map to show one place, and where to come back to.
 *
 * The map is not a screen the calendar opens: it is the screen underneath,
 * still mounted, that the calendar was pushed over. Going back to it with
 * route parameters is not reliable — `dismissTo` with different parameters can
 * miss the map already there and replace the calendar with a second one, which
 * mounts a second native map for a glance. So the calendar leaves this note and
 * goes back, and the map takes it.
 *
 * The day and the view travel because the calendar is gone once popped and
 * cannot remember them itself. The trip travels so that a note can never open a
 * place on a map showing a different trip.
 */
export type PlaceRequest = {
  tripId: string
  markerId: string
  day: IsoDay
  view: CalendarView
}

let pending: PlaceRequest | null = null
const listeners = new Set<() => void>()

/** Leave a request for the map. The map is told at once, since it is mounted. */
export function askMapToShow(request: PlaceRequest): void {
  pending = request
  for (const listener of listeners) listener()
}

/** Take the request, if there is one. Taken once: the note is spent on reading. */
export function takePlaceRequest(): PlaceRequest | null {
  const request = pending
  pending = null
  return request
}

/** Be told when a request is left. Returns the way to stop being told. */
export function onPlaceRequest(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
