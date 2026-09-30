import { fetchTripCities, fetchTripMarkers, fetchTrips, readyOrEmpty } from '@pinpoint/data'
import { Redirect } from 'expo-router'

import { OfflineMapScreen } from '@/components/offline-map-screen'
import { FailedState, LoadingState } from '@/components/states'
import { useSay } from '@/lib/language'
import { useSession } from '@/lib/session'
import { supabase } from '@/lib/supabase'
import { useTripChoice } from '@/lib/trip-choice'
import { useQuery } from '@/lib/use-query'

/**
 * The map around the trip's places, downloaded for use with no signal
 * (`offline-use`).
 *
 * A route like the calendar, reached from the trip sheet, and on the trip the
 * sheet was on: it resolves the trip from the same choice the map and the
 * calendar read. Its lists are read with `keep`, under the same names the map
 * keeps them, so the screen opens with no signal — which is when somebody may
 * want to see what is downloaded, or remove it.
 */
export default function OfflineMapRoute() {
  const { session, loading } = useSession()
  const say = useSay()
  const { chosenTripId } = useTripChoice()

  const trips = useQuery(() => fetchTrips(supabase), [session], {
    keep: session ? 'trips' : null,
  })
  const trip =
    trips.rows.find((each) => each.id === chosenTripId) ?? trips.rows[0] ?? null
  const tripId = trip?.id ?? null

  const markers = useQuery(
    () => (tripId === null ? Promise.resolve(readyOrEmpty([])) : fetchTripMarkers(supabase, tripId)),
    [tripId],
    { keep: tripId === null ? null : `markers-${tripId}` },
  )
  const cities = useQuery(
    () => (tripId === null ? Promise.resolve(readyOrEmpty([])) : fetchTripCities(supabase, tripId)),
    [tripId],
    { keep: tripId === null ? null : `cities-${tripId}` },
  )

  // The same guard every signed-in route carries.
  if (loading) return <LoadingState />
  if (!session) return <Redirect href="/login" />

  if (trips.state.status === 'loading') return <LoadingState />
  if (trips.state.status === 'failed') return <FailedState message={say(trips.state.reason)} />
  if (trip === null) return <Redirect href="/" />
  if (markers.state.status === 'loading') return <LoadingState />
  if (markers.state.status === 'failed') {
    return <FailedState message={say(markers.state.reason)} />
  }

  return <OfflineMapScreen trip={trip} markers={markers.rows} cities={cities.rows} />
}
