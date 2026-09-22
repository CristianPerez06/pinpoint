import { dayToPrepareWith } from '@pinpoint/core'
import {
  fetchTripCities,
  fetchTripInterest,
  fetchTripMarkers,
  fetchTripMembers,
  fetchTrips,
  ownMemberOf,
} from '@pinpoint/data'
import { message } from '@pinpoint/wording'
import { Suspense } from 'react'

import { CalendarScreen } from '@/app/_components/calendar-screen'
import { FailedState } from '@/app/_components/states'
import { TripCalendar } from '@/app/_components/trip-calendar'
import { requireUserId } from '@/lib/auth/guards'
import { createClient } from '@/lib/supabase/server'

import styles from '../page.module.css'

/**
 * The trip, arranged by day.
 *
 * A route rather than a panel over the map: it is a different way of looking at
 * the same trip, not something laid on top of one. That makes it the first
 * screen anybody *returns* from, which is why the trip and the city both travel
 * in the address — the way back reverses the step that left rather than
 * navigating to the workspace's own path, which would drop the city and land
 * somebody in one they were not working in, with nothing on screen saying so.
 *
 * The reads are the workspace's, unchanged, and deliberately unfiltered. What a
 * filter narrows is a property of the workspace; a calendar that inherited one
 * would show a day as emptier than it is.
 *
 * The whole list of trips goes down as well, because this screen wears the
 * product's header and the trip's name in it is the switcher. Choosing another
 * trip shows that trip's calendar rather than returning to the map, and one
 * read here is what makes that possible without a second one on the client.
 */
export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const userId = await requireUserId()

  const supabase = await createClient()
  const params = await searchParams
  const requestedTripId = params.trip
  const requestedCityId = typeof params.city === 'string' ? params.city : null

  const trips = await fetchTrips(supabase)

  if (trips.status === 'failed') {
    return (
      <Shell>
        <FailedState message={trips.reason} />
      </Shell>
    )
  }

  /*
   * No trip is not an error page. Somebody who followed a stale link, or who
   * has since been taken off the trip it named, is sent to the map — which is
   * the screen that knows how to explain having no trips.
   */
  if (trips.status === 'empty') {
    return (
      <Shell>
        <FailedState message={message('calendar.noTrip')} />
      </Shell>
    )
  }

  const trip =
    trips.data.find((each) => each.id === requestedTripId) ?? trips.data[0]!

  const [markers, cities, interest, members] = await Promise.all([
    fetchTripMarkers(supabase, trip.id),
    fetchTripCities(supabase, trip.id),
    fetchTripInterest(supabase, trip.id),
    fetchTripMembers(supabase, trip.id),
  ])

  const memberList = members.status === 'ready' ? members.data : []

  // The way back, carrying what has to survive the round trip.
  const back = new URLSearchParams({ trip: trip.id })
  if (requestedCityId) back.set('city', requestedCityId)

  /*
   * The day to draw, or null where this machine cannot honestly answer.
   *
   * It used to be worked out inside the screen's own state initialiser, which
   * runs here *and* again in the browser. For a trip carrying no dates the rule
   * falls through to today — this machine's today on one side and the reader's
   * on the other, which differ for several hours of every day for anybody away
   * from where this runs. React found the day headings and both arrow labels
   * disagreeing, threw the whole calendar away and rebuilt it, and the reader
   * saw yesterday's date until it did.
   *
   * Deciding it once here removes the disagreement, but it cannot conjure the
   * answer: where the rule lands on "today", only the reader knows which day
   * that is. So `dayToPrepareWith` returns null in exactly those cases and the
   * screen waits for its day rather than being drawn with a guess — a guess
   * being a real date, correctly drawn, with nothing on screen inviting anybody
   * to doubt it.
   *
   * A day named in the address is nobody's guess, so it is taken as given.
   */
  const initialDay =
    typeof params.day === 'string' ? params.day : dayToPrepareWith(trip)

  return (
    /*
      The same waiting screen as `loading.tsx`. This boundary is here because
      the calendar reads the address on the client; whichever of the two is
      shown, it is the calendar with nothing read yet, never a second screen.
    */
    <Suspense fallback={<CalendarScreen live={null} />}>
      <TripCalendar
        key={trip.id}
        // A token for this render, for the reason the map's page gives.
        readId={crypto.randomUUID()}
        trip={trip}
        initialDay={initialDay}
        trips={trips.data}
        initialMarkers={markers.status === 'ready' ? markers.data : []}
        initialCities={cities.status === 'ready' ? cities.data : []}
        members={memberList}
        initialInterest={interest.status === 'ready' ? interest.data : []}
        ownMemberId={ownMemberOf(memberList, userId)?.id ?? null}
        workspaceHref={`/?${back.toString()}`}
      />
    </Suspense>
  )
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className={styles.shell}>
      <div className={styles.centred}>{children}</div>
    </main>
  )
}
