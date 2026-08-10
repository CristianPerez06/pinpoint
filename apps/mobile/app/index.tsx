import { signOut } from '@pinpoint/auth'
import type { Marker, Trip } from '@pinpoint/core'
import { fetchTripMarkers, fetchTrips, type QueryState } from '@pinpoint/data'
import { COLOUR, SPACE } from '@pinpoint/tokens'
import { Redirect } from 'expo-router'
import { Button, StyleSheet, Text, View } from 'react-native'

import { MarkersOverlayNote } from '@/components/overlay-note'
import { EmptyState, FailedState, LoadingState } from '@/components/states'
import { TripMap } from '@/components/trip-map'
import { useSession } from '@/lib/session'
import { supabase } from '@/lib/supabase'
import { useQuery } from '@/lib/use-query'

/**
 * The signed-in screen: a map of the current trip.
 *
 * The same queries as the web app, against the same policies, through a
 * different bundler and a different renderer. That last part is what this
 * change existed to prove — a package resolving under Next says nothing about
 * Metro, and `maplibre-gl` rendering says nothing about MapLibre Native.
 *
 * "The current trip" is the first one, because there is one. Choosing between
 * trips is a later change.
 */
export default function Index() {
  const { session, loading } = useSession()

  const trips = useQuery(() => fetchTrips(supabase), [session])

  const tripId = trips.status === 'ready' ? trips.data[0]!.id : null
  const markers = useQuery(
    async () => (tripId ? fetchTripMarkers(supabase, tripId) : { status: 'empty' as const }),
    [tripId],
  )

  // Reading the session out of the keychain is asynchronous, so the first frame
  // after launch has no session even when one exists. Redirecting here would
  // bounce a signed-in person to the sign-in screen every time they opened the
  // app.
  if (loading) return <LoadingState what="pinpoint" />
  if (!session) return <Redirect href="/login" />

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.brand}>pinpoint</Text>
        {trips.status === 'ready' ? (
          <Text style={styles.tripName}>{trips.data[0]!.name}</Text>
        ) : null}
        <View style={styles.signOut}>
          <Button title="Sign out" onPress={() => void signOut(supabase)} />
        </View>
      </View>

      <View style={styles.body}>
        <Body trips={trips} markers={markers} />
      </View>
    </View>
  )
}

/**
 * Four states, rendered as four different things.
 *
 * The one worth stating: a failed load is never shown as an empty trip. "You
 * have not saved anything yet" and "this is broken" are different messages, and
 * an empty map cannot tell them apart on its own.
 */
function Body({
  trips,
  markers,
}: {
  trips: QueryState<readonly Trip[]>
  markers: QueryState<readonly Marker[]>
}) {
  if (trips.status === 'loading') return <LoadingState what="your trips" />
  if (trips.status === 'failed') return <FailedState message={trips.message} />
  if (trips.status === 'empty') {
    return <EmptyState>You are not on any trips yet.</EmptyState>
  }

  if (markers.status === 'loading') return <LoadingState />

  // The map renders in all three remaining cases, because in all three the map
  // itself is fine — the tiles arrived and the camera is real. Only the markers
  // differ, so only a note differs. What must never blur is empty against
  // failed, and the note's tone is what carries that.
  return (
    <>
      <TripMap markers={markers.status === 'ready' ? markers.data : []} />

      {markers.status === 'empty' ? (
        <MarkersOverlayNote>No places saved on this trip yet.</MarkersOverlayNote>
      ) : null}

      {markers.status === 'failed' ? (
        <MarkersOverlayNote tone="danger">{markers.message}</MarkersOverlayNote>
      ) : null}
    </>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLOUR.surface },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.sm,
    paddingHorizontal: SPACE.md,
    paddingVertical: SPACE.sm,
    borderBottomWidth: 1,
    borderColor: COLOUR.border,
  },
  brand: { fontSize: 17, fontWeight: '600', color: COLOUR.text },
  tripName: { color: COLOUR.textMuted },
  signOut: { marginLeft: 'auto' },
  body: { flex: 1 },
})
