import { fetchTrips } from '@pinpoint/data'
import { Redirect, useLocalSearchParams } from 'expo-router'

import { CalendarScreen } from '@/components/calendar-screen'
import { FailedState } from '@/components/states'
import { TripCalendar } from '@/components/trip-calendar'
import { useSay } from '@/lib/language'
import { useSession } from '@/lib/session'
import { supabase } from '@/lib/supabase'
import { useTripChoice } from '@/lib/trip-choice'
import { useQuery } from '@/lib/use-query'

/**
 * The trip, arranged by day.
 *
 * A route rather than a panel over the map, for the reason the laptop's calendar
 * is a route: it is a different way of looking at the same trip rather than
 * something laid on top of one. On this platform that also means the map screen
 * stays mounted underneath — so coming back neither tears down the renderer nor
 * re-frames the camera, and the city and the filter are exactly as they were
 * left. `settings.tsx` established the shape; this is the second screen anybody
 * returns from.
 *
 * This file decides only what a route decides: that somebody is signed in, and
 * which trip they are reading. Everything else is `TripCalendar`. It is the same
 * division `index.tsx` makes, and the two now resolve the trip the same way from
 * the same place — which is what lets somebody switch trips here and find the
 * map on that trip when they go back.
 */
export default function CalendarRoute() {
  const { session, loading } = useSession()
  const say = useSay()
  const { chosenTripId, chooseTrip } = useTripChoice()

  const trips = useQuery(() => fetchTrips(supabase), [session])

  /*
   * Where to open, when the map sends somebody back after showing them a place.
   * Absent on every other arrival, and the calendar opens as it always has.
   */
  const asked = useLocalSearchParams<{ trip?: string; day?: string; view?: string }>()

  /*
    The calendar with nothing read yet, rather than a loading screen.

    While the session is read back and again while the trips are, which are the
    two waits this route has before it knows which trip it is on. It is the same
    component `TripCalendar` draws, given nothing, so what arrives replaces bars
    where they stand instead of arriving as a new screen.
  */
  const waiting = <CalendarScreen live={null} lists={null} />

  // The same guard every signed-in route carries. Reading the session back is
  // asynchronous, so redirecting during that frame would bounce somebody out of
  // a screen they are entitled to.
  if (loading) return waiting
  if (!session) return <Redirect href="/login" />

  if (trips.state.status === 'loading') return waiting
  if (trips.state.status === 'failed') {
    return <FailedState message={say(trips.state.reason)} />
  }

  /*
   * No trips at all, which this screen cannot answer.
   *
   * The map is where a first trip is made and where somebody who expected to be
   * on one is told what to check. A calendar of nothing would be a dead end with
   * nothing on it to explain itself, so this hands back to the screen that knows
   * how — the same answer the laptop's calendar gives by leaving for the map.
   */
  if (trips.state.status === 'empty') return <Redirect href="/" />

  /*
   * Falling back rather than failing, exactly as the map does: an unrecognised
   * choice covers a trip that was left behind, and neither that nor an archive
   * is worth an error screen when there is a trip to show.
   */
  const trip = trips.rows.find((each) => each.id === chosenTripId) ?? trips.rows[0]!

  return (
    <TripCalendar
      /*
        Keyed by the trip, so changing trips remounts rather than re-renders.

        The day being read is state in there, and a day carried from one trip
        into another is a day that means nothing — two trips rarely cover the
        same dates, so it would open on an empty day and read as a trip with
        nothing planned. Remounting is what makes the opening-day rule decide
        again, which is what the specification asks for.
      */
      key={trip.id}
      trip={trip}
      // Only for the trip the request was made on. Changing trip remounts this
      // with the same parameters still in the route, and a day carried into
      // another trip is the failure the key above exists to prevent.
      asked={asked.trip === trip.id ? { day: asked.day, view: asked.view } : null}
      trips={trips}
      onSelectTrip={chooseTrip}
      onCreated={(tripId) => {
        chooseTrip(tripId)
        void trips.refetch({ force: true })
      }}
      userId={session.user.id}
    />
  )
}
