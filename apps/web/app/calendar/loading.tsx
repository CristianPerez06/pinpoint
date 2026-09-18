import { CalendarScreen } from '@/app/_components/calendar-screen'

/**
 * Shown while the calendar's own reads run on the server.
 *
 * Without this file the route fell back to the root `loading.tsx` — the map's
 * header over "Loading your trip" — so opening the calendar showed the map
 * first and then jumped, in one step, to a different screen. This is the
 * calendar itself with nothing read yet: the same component the page renders,
 * given `null`, so the two cannot drift apart and the data arriving replaces
 * bars where they stand.
 */
export default function Loading() {
  return <CalendarScreen live={null} />
}
