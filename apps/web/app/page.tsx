import { fetchTripMarkers, fetchTrips } from '@pinpoint/data'
import { COLOUR, SPACE } from '@pinpoint/tokens'

import { signOutAction } from '@/app/_actions/auth'
import {
  EmptyState,
  FailedState,
  MapOverlayNote,
} from '@/app/_components/states'
import { TripMap } from '@/app/_components/trip-map'
import { requireUserId } from '@/lib/auth/guards'
import { createClient } from '@/lib/supabase/server'

/**
 * The signed-in landing page: a map of the current trip.
 *
 * The guard runs before anything is fetched, so no map data is queried,
 * rendered, or sent to a client without a session.
 *
 * Note what is absent from the queries. There is no `.eq(...)` on the reader's
 * id and no filtering of either result — the database returns the trips this
 * account is a member of, and the markers of a trip it may see. If that were
 * wrong, a filter here would hide it rather than fix it.
 *
 * "The current trip" is the first one, because there is one. Choosing between
 * trips is a later change, and building a chooser for a list of length one
 * would be building the wrong thing early.
 */
export default async function Home() {
  await requireUserId()

  const supabase = await createClient()
  const trips = await fetchTrips(supabase)

  if (trips.status === 'failed') {
    return (
      <Shell>
        <FailedState message={trips.message} />
      </Shell>
    )
  }

  if (trips.status === 'empty') {
    return (
      <Shell>
        <EmptyState>You are not on any trips yet.</EmptyState>
      </Shell>
    )
  }

  const trip = trips.data[0]!
  const markers = await fetchTripMarkers(supabase, trip.id)

  /**
   * The map renders in all three cases, because in all three the map itself is
   * fine — the tiles arrived and the camera is real. Only the markers differ,
   * so only a note differs.
   *
   * What must never blur is empty against failed. "You have not saved anything
   * yet" and "this is broken" are different facts, and an empty map cannot
   * tell them apart on its own. The note carries that distinction, in a colour
   * a person reads before the words.
   */
  return (
    <Shell title={trip.name}>
      <TripMap markers={markers.status === 'ready' ? markers.data : []} />

      {markers.status === 'empty' ? (
        <MapOverlayNote>No places saved on this trip yet.</MapOverlayNote>
      ) : null}

      {markers.status === 'failed' ? (
        <MapOverlayNote tone="danger">{markers.message}</MapOverlayNote>
      ) : null}
    </Shell>
  )
}

/** The frame around whatever state the page is in. Web's own idiom, shared values. */
function Shell({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <main
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100dvh',
        color: COLOUR.text,
      }}
    >
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: SPACE.md,
          padding: `${SPACE.sm}px ${SPACE.md}px`,
          borderBottom: `1px solid ${COLOUR.border}`,
        }}
      >
        <strong>pinpoint</strong>
        {title ? <span style={{ color: COLOUR.textMuted }}>{title}</span> : null}
        <form action={signOutAction} style={{ marginLeft: 'auto' }}>
          <button type="submit">Sign out</button>
        </form>
      </header>

      {/* Positioned, so the map's absolutely-filled canvas has something to
          fill and the details overlay has something to sit inside. */}
      <div style={{ position: 'relative', flex: 1, minHeight: 0 }}>{children}</div>
    </main>
  )
}
