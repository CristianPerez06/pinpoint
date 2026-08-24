import { fetchTrips } from '@pinpoint/data'
import { Redirect } from 'expo-router'
import { useState } from 'react'

import { FailedState, LoadingState } from '@/components/states'
import { TripSetup } from '@/components/trip-setup'
import { TripWorkspace } from '@/components/trip-workspace'
import { useSession } from '@/lib/session'
import { supabase } from '@/lib/supabase'
import { useQuery } from '@/lib/use-query'

/**
 * The signed-in route: which trip, and whether there is one to show.
 *
 * Everything about the trip itself — its markers, who wants to go where, the
 * filter, the header those live in — belongs to `TripWorkspace`. This file
 * establishes only the two things a route decides: that somebody is signed in,
 * and which trip they are looking at.
 *
 * Which trip is held for the session and starts at the first. It is deliberately
 * not persisted: there is nowhere to put it. `expo-secure-store` holds the
 * session token and a trip id is not a secret, and adding a preference store for
 * this alone would be the second thing to want one — the capture form's
 * last-used city was the first. Both are recorded as one gap in the roadmap
 * rather than answered twice, badly.
 */
export default function Index() {
  const { session, loading } = useSession()

  /**
   * Bumped when this app changes what is in the trip list — making a trip, and
   * now archiving or restoring one. It was only ever creation until archiving
   * gave the list a way to shrink as well as grow.
   *
   * `useQuery` re-runs when its dependencies change and offers no other way to
   * ask again — deliberately, since every other query in this app is keyed on
   * something that changes when the answer would. This is the one case with
   * nothing to key on, so it gets a counter rather than the hook growing a
   * refetch nothing else would use.
   */
  const [createdCount, setCreatedCount] = useState(0)
  const trips = useQuery(() => fetchTrips(supabase), [session, createdCount])

  /**
   * Which trip is being looked at, or null for "whichever is first".
   *
   * Null rather than seeding from the query, which is the pattern the React
   * linter rejected in the interest change and would reject again: copying a
   * query result into state means a later read can replace a choice somebody
   * just made. Resolving it on every render against what the query returned
   * costs nothing and cannot go stale.
   */
  const [chosenTripId, setChosenTripId] = useState<string | null>(null)

  // Reading the session out of the keychain is asynchronous, so the first frame
  // after launch has no session even when one exists. Redirecting here would
  // bounce a signed-in person to the sign-in screen every time they opened the
  // app.
  if (loading) return <LoadingState what="pinpoint" />
  if (!session) return <Redirect href="/login" />

  if (trips.status === 'loading') return <LoadingState what="your trips" />
  if (trips.status === 'failed') return <FailedState message={trips.message} />

  // No longer a dead end: this is where a first trip is made, and where somebody
  // who expected to be on one is told what to check.
  if (trips.status === 'empty') {
    return (
      <TripSetup
        onCreated={(tripId) => {
          setChosenTripId(tripId)
          setCreatedCount((count) => count + 1)
        }}
      />
    )
  }

  /*
   * Falling back rather than failing. An unrecognised choice covers a trip that
   * was left behind — removed, or belonging to an account that no longer has it
   * — and neither is worth an error screen when there is a trip to show.
   */
  const trip =
    trips.data.find((each) => each.id === chosenTripId) ?? trips.data[0]!

  return (
    <TripWorkspace
      /*
        Keyed by the trip, so changing trips remounts rather than re-renders.

        The workspace holds a filter, a set of local write overrides and an open
        marker sheet, none of which mean anything on a different trip. A filter
        in particular names member ids that do not exist in the new one, so it
        would match nothing for a reason nobody could see. Remounting clears all
        of it at once, which is what the specification asks for.
      */
      key={trip.id}
      trip={trip}
      trips={trips.data}
      onSelectTrip={setChosenTripId}
      onCreated={(tripId) => {
        setChosenTripId(tripId)
        setCreatedCount((count) => count + 1)
      }}
      // Re-read without choosing. Archiving the trip being viewed leaves
      // `chosenTripId` pointing at something no longer in the list, and the
      // resolver above already falls through for exactly that case.
      onTripsChanged={() => setCreatedCount((count) => count + 1)}
      userId={session.user.id}
    />
  )
}
