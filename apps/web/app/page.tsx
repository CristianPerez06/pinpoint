import { fetchTripMarkers, fetchTrips } from '@pinpoint/data'
import { COLOUR, SPACE } from '@pinpoint/tokens'

import { signOutAction } from '@/app/_actions/auth'
import { EmptyState, FailedState } from '@/app/_components/states'
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

  if (markers.status === 'failed') {
    // Explicitly not the empty state below. An empty map that says "no places
    // yet" when the request failed is a lie a person cannot see through.
    return (
      <Shell title={trip.name}>
        <FailedState message={markers.message} />
      </Shell>
    )
  }

  return (
    <Shell title={trip.name}>
      {markers.status === 'empty' ? (
        // The map still renders — at its default position, with no error —
        // because a trip with nothing on it is a valid trip, not a failure.
        <>
          <TripMap markers={[]} />
          <div
            style={{
              position: 'absolute',
              top: SPACE.md,
              left: '50%',
              transform: 'translateX(-50%)',
              backgroundColor: COLOUR.surface,
              border: `1px solid ${COLOUR.border}`,
              borderRadius: 8,
              padding: `${SPACE.sm}px ${SPACE.md}px`,
              color: COLOUR.textMuted,
              zIndex: 2,
            }}
          >
            No places saved on this trip yet.
          </div>
        </>
      ) : (
        <TripMap markers={markers.data} />
      )}
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
