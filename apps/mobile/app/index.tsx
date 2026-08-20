import { fetchTrips } from '@pinpoint/data'
import { Redirect } from 'expo-router'

import { EmptyState, FailedState, LoadingState } from '@/components/states'
import { TripWorkspace } from '@/components/trip-workspace'
import { useSession } from '@/lib/session'
import { supabase } from '@/lib/supabase'
import { useQuery } from '@/lib/use-query'

/**
 * The signed-in route: which trip, and whether there is anyone to show it to.
 *
 * Everything about the trip itself — its markers, who wants to go where, the
 * filter, the header those live in — belongs to `TripWorkspace`. This file
 * establishes only the two things a route decides: that somebody is signed in,
 * and which trip they are looking at.
 *
 * "The current trip" is the first one, because there is one. Choosing between
 * trips is a later change.
 */
export default function Index() {
  const { session, loading } = useSession()

  const trips = useQuery(() => fetchTrips(supabase), [session])

  // Reading the session out of the keychain is asynchronous, so the first frame
  // after launch has no session even when one exists. Redirecting here would
  // bounce a signed-in person to the sign-in screen every time they opened the
  // app.
  if (loading) return <LoadingState what="pinpoint" />
  if (!session) return <Redirect href="/login" />

  if (trips.status === 'loading') return <LoadingState what="your trips" />
  if (trips.status === 'failed') return <FailedState message={trips.message} />
  if (trips.status === 'empty') {
    return <EmptyState>You are not on any trips yet.</EmptyState>
  }

  return <TripWorkspace trip={trips.data[0]!} userId={session.user.id} />
}
