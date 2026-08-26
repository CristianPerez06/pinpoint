import {
  fetchTripCities,
  fetchTripInterest,
  fetchTripMarkers,
  fetchTripMembers,
  fetchTrips,
  ownMemberOf,
} from '@pinpoint/data'
import { Suspense } from 'react'

import { FailedState, LoadingState } from '@/app/_components/states'
import { TripSetup } from '@/app/_components/trip-setup'
import { TripWorkspace } from '@/app/_components/trip-workspace'
import { requireUserId } from '@/lib/auth/guards'
import { createClient } from '@/lib/supabase/server'

import styles from './page.module.css'

/**
 * The signed-in landing page: a map of the current trip, and the places on it.
 *
 * The guard runs before anything is fetched, so no map data is queried,
 * rendered, or sent to a client without a session.
 *
 * Note what is absent from the queries. There is no `.eq(...)` on the reader's
 * id and no filtering of any result — the database returns the trips this
 * account is a member of, and the markers and cities of a trip it may see. If
 * that were wrong, a filter here would hide it rather than fix it.
 *
 * Which trip is being looked at comes from the URL, beside the selected city, so
 * it survives a reload and can be linked. An absent or unrecognised `trip`
 * parameter falls back to the first — unrecognised covers both a stale link and
 * a trip this account is no longer on, and neither should be an error page.
 *
 * There is no membership check on the fallback. The list came from the database
 * having already applied it, so a trip that is in `trips.data` is one this
 * account may see, by construction rather than by a second opinion.
 *
 * Everything is read on the server and handed down once. From that point the
 * workspace owns it, because a place saved from the browser has to appear
 * without re-reading the trip to find the one row that changed.
 */
export default async function Home({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const userId = await requireUserId()

  const supabase = await createClient()
  const trips = await fetchTrips(supabase)
  const requestedTripId = (await searchParams).trip

  if (trips.status === 'failed') {
    return (
      <Shell>
        <Centred>
          <FailedState message={trips.message} />
        </Centred>
      </Shell>
    )
  }

  // No longer a dead end: this is where a first trip is made, and where
  // somebody who expected to be on one is told what to check.
  if (trips.status === 'empty') {
    return (
      <Shell>
        <Centred>
          <TripSetup />
        </Centred>
      </Shell>
    )
  }

  const trip =
    trips.data.find((each) => each.id === requestedTripId) ?? trips.data[0]!

  // Independent reads, so they wait on each other only for as long as the slower
  // one takes.
  const [markers, cities, interest, members] = await Promise.all([
    fetchTripMarkers(supabase, trip.id),
    fetchTripCities(supabase, trip.id),
    fetchTripInterest(supabase, trip.id),
    fetchTripMembers(supabase, trip.id),
  ])

  /**
   * Interest and members that failed to load are treated as absent rather than
   * fatal. The map is the point of this screen and it is fine without them: a
   * marker whose interest did not arrive reads as undecided, which is what it
   * would read as if nobody had answered — and the alternative, refusing to draw
   * the trip because a secondary read failed, trades a whole screen for a
   * detail.
   */
  const memberList = members.status === 'ready' ? members.data : []
  const interestRecords = interest.status === 'ready' ? interest.data : []

  /**
   * The map renders whatever the markers did, because in all three cases the map
   * itself is fine — the tiles arrived and the camera is real. Only the markers
   * differ, so only a note differs.
   *
   * What must never blur is empty against failed. "You have not saved anything
   * yet" and "this is broken" are different facts, and an empty map cannot tell
   * them apart on its own. The note carries that distinction, in a colour a
   * person reads before the words.
   */
  /*
    Not wrapped in `Shell`, and that is the point rather than an omission.

    The workspace owns the full-height column now, because it renders the bar —
    and the bar is a `<header>`, which exposes a `banner` landmark only when it
    is *not* inside `<main>`. Wrapping this in `Shell` put it there and silently
    cost the page its banner, so the workspace renders `<main>` around the map
    itself and this hands it nothing.
  */
  return (
    <>
      <Suspense fallback={<Shell><Centred><LoadingState /></Centred></Shell>}>
        <TripWorkspace
          /*
            Keyed by the trip, so changing trips remounts rather than re-renders.

            The workspace seeds its client state from these props once, on mount
            — markers, cities, interest, members. Without a key, navigating to
            another trip would hand it new props that no state initialiser ever
            reads again, and it would go on showing the previous trip's places
            under the new trip's name. The filter goes with it, which is what the
            specification asks for: a filter naming the old trip's members
            matches nothing in the new one, for a reason nobody could see.
          */
          key={trip.id}
          trip={trip}
          trips={trips.data}
          initialMarkers={markers.status === 'ready' ? markers.data : []}
          initialCities={cities.status === 'ready' ? cities.data : []}
          members={memberList}
          initialInterest={interestRecords}
          ownMemberId={ownMemberOf(memberList, userId)?.id ?? null}
          notice={
            markers.status === 'empty'
              ? { tone: 'muted', text: 'No places saved on this trip yet.' }
              : markers.status === 'failed'
                ? { tone: 'danger', text: markers.message }
                : null
          }
        />
      </Suspense>
    </>
  )
}

/**
 * The frame around the states that are not the workspace.
 *
 * It carries no chrome. It used to render a header — a wordmark and a bare
 * `Sign out` — while the workspace rendered a toolbar under it, which is two
 * elements doing one job and is why the trip's name ended up in neither of the
 * places it belonged.
 *
 * The workspace does not use this: it renders its own `<header>` and `<main>`,
 * because a `<header>` nested inside `<main>` exposes no `banner` role at all.
 * What is left here is the loading, failed and empty states, which have no
 * chrome and are simply the page.
 */
function Shell({ children }: { children: React.ReactNode }) {
  return <main className={styles.shell}>{children}</main>
}

/** Positioned, so anything absolutely placed inside has something to sit in. */
function Centred({ children }: { children: React.ReactNode }) {
  return <div className={styles.centred}>{children}</div>
}
