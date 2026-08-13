import { fetchTripCities, fetchTripMarkers, fetchTrips } from '@pinpoint/data'
import { Suspense } from 'react'

import { signOutAction } from '@/app/_actions/auth'
import {
  EmptyState,
  FailedState,
  LoadingState,
} from '@/app/_components/states'
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
 * "The current trip" is the first one, because there is one. Choosing between
 * trips is a later change, and building a chooser for a list of length one
 * would be building the wrong thing early.
 *
 * Everything is read on the server and handed down once. From that point the
 * workspace owns it, because a place saved from the browser has to appear
 * without re-reading the trip to find the one row that changed.
 */
export default async function Home() {
  await requireUserId()

  const supabase = await createClient()
  const trips = await fetchTrips(supabase)

  if (trips.status === 'failed') {
    return (
      <Shell>
        <Centred>
          <FailedState message={trips.message} />
        </Centred>
      </Shell>
    )
  }

  if (trips.status === 'empty') {
    return (
      <Shell>
        <Centred>
          <EmptyState>You are not on any trips yet.</EmptyState>
        </Centred>
      </Shell>
    )
  }

  const trip = trips.data[0]!

  // Independent reads, so they wait on each other only for as long as the slower
  // one takes.
  const [markers, cities] = await Promise.all([
    fetchTripMarkers(supabase, trip.id),
    fetchTripCities(supabase, trip.id),
  ])

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
  return (
    <Shell title={trip.name}>
      <Suspense fallback={<Centred><LoadingState /></Centred>}>
        <TripWorkspace
          trip={trip}
          initialMarkers={markers.status === 'ready' ? markers.data : []}
          initialCities={cities.status === 'ready' ? cities.data : []}
          notice={
            markers.status === 'empty'
              ? { tone: 'muted', text: 'No places saved on this trip yet.' }
              : markers.status === 'failed'
                ? { tone: 'danger', text: markers.message }
                : null
          }
        />
      </Suspense>
    </Shell>
  )
}

/** The frame around whatever state the page is in. Web's own idiom, shared values. */
function Shell({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <main className={styles.shell}>
      <header className={styles.header}>
        <span className={styles.wordmark}>
          <span className={styles.dot} aria-hidden />
          pinpoint
        </span>
        {title ? <span className={styles.trip}>{title}</span> : null}
        <form action={signOutAction} className={styles.signOutForm}>
          <button type="submit" className={styles.signOut}>
            Sign out
          </button>
        </form>
      </header>

      {children}
    </main>
  )
}

/** Positioned, so anything absolutely placed inside has something to sit in. */
function Centred({ children }: { children: React.ReactNode }) {
  return <div className={styles.centred}>{children}</div>
}
