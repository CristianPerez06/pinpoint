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
   * The trips this account is on.
   *
   * Keyed on the session and nothing else. It used to carry a counter bumped by
   * anything that changed the list, because `useQuery` re-ran only when its
   * dependencies changed and offered no other way to ask — a workaround for a
   * missing function rather than a dependency. The function exists now, so
   * everything that changes the list asks for it directly.
   */
  const trips = useQuery(() => fetchTrips(supabase), [session])

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

  if (trips.state.status === 'loading') return <LoadingState what="your trips" />
  if (trips.state.status === 'failed') {
    return <FailedState message={trips.state.message} />
  }

  // No longer a dead end: this is where a first trip is made, and where somebody
  // who expected to be on one is told what to check.
  if (trips.state.status === 'empty') {
    return (
      <TripSetup
        onCreated={(tripId) => {
          setChosenTripId(tripId)
          void trips.refetch({ force: true })
        }}
      />
    )
  }

  /*
   * Falling back rather than failing. An unrecognised choice covers a trip that
   * was left behind — removed, or belonging to an account that no longer has it
   * — and neither is worth an error screen when there is a trip to show.
   */
  const trip = trips.rows.find((each) => each.id === chosenTripId) ?? trips.rows[0]!

  return (
    <TripWorkspace
      /*
        Keyed by the trip, so changing trips remounts rather than re-renders.

        The workspace holds a filter and an open marker sheet, neither of which
        means anything on a different trip. A filter in particular names member
        ids that do not exist in the new one, so it would match nothing for a
        reason nobody could see. Remounting clears all of it at once, which is
        what the specification asks for.
      */
      key={trip.id}
      trip={trip}
      trips={trips}
      onSelectTrip={setChosenTripId}
      onCreated={(tripId) => {
        setChosenTripId(tripId)
        void trips.refetch({ force: true })
      }}
      userId={session.user.id}
    />
  )
}
