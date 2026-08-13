import { signOut } from '@pinpoint/auth'
import type { City, Marker, Trip } from '@pinpoint/core'
import {
  fetchTripCities,
  fetchTripMarkers,
  fetchTrips,
  type QueryState,
} from '@pinpoint/data'
import { SPACE, TYPE } from '@pinpoint/tokens'
import { Redirect } from 'expo-router'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { MarkersOverlayNote } from '@/components/overlay-note'
import { EmptyState, FailedState, LoadingState } from '@/components/states'
import { TripMap } from '@/components/trip-map'
import { useSession } from '@/lib/session'
import { useTheme } from '@/lib/theme'
import { role } from '@/lib/type'
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
  const theme = useTheme()
  // The header is the top of the screen, so it owns the space the system draws
  // into. Without this the wordmark sits under the clock and the Dynamic
  // Island — the status bar is not a margin the layout gets for free.
  const insets = useSafeAreaInsets()

  const trips = useQuery(() => fetchTrips(supabase), [session])

  const tripId = trips.status === 'ready' ? trips.data[0]!.id : null
  const markers = useQuery(
    async () => (tripId ? fetchTripMarkers(supabase, tripId) : { status: 'empty' as const }),
    [tripId],
  )

  // Read only so that a price can be shown in the currency of the city it is
  // filed under. This screen writes nothing — planning happens at a laptop —
  // but a price reading "500" here and "¥500" there would be the same record
  // saying two things.
  const cities = useQuery(
    async () => (tripId ? fetchTripCities(supabase, tripId) : { status: 'empty' as const }),
    [tripId],
  )

  // Reading the session out of the keychain is asynchronous, so the first frame
  // after launch has no session even when one exists. Redirecting here would
  // bounce a signed-in person to the sign-in screen every time they opened the
  // app.
  if (loading) return <LoadingState what="pinpoint" />
  if (!session) return <Redirect href="/login" />

  return (
    <View style={[styles.screen, { backgroundColor: theme.colour.surface }]}>
      <View
        style={[
          styles.header,
          { borderColor: theme.colour.line, paddingTop: HEADER_PAD + insets.top },
        ]}
      >
        {/* The mark is a pin reduced to the point it names, in the one colour
            that is not a marker family. */}
        <View style={[styles.dot, { backgroundColor: theme.colour.accent }]} />
        <Text style={[styles.brand, { color: theme.colour.ink }]}>pinpoint</Text>
        {trips.status === 'ready' ? (
          <Text style={[styles.tripName, { color: theme.colour.inkMuted }]}>
            {trips.data[0]!.name}
          </Text>
        ) : null}
        <Pressable
          style={styles.signOut}
          onPress={() => void signOut(supabase)}
          accessibilityRole="button"
          hitSlop={8}
        >
          <Text style={[styles.signOutText, { color: theme.colour.inkMuted }]}>
            Sign out
          </Text>
        </Pressable>
      </View>

      <View style={styles.body}>
        <Body trips={trips} markers={markers} cities={cities} />
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
  cities,
}: {
  trips: QueryState<readonly Trip[]>
  markers: QueryState<readonly Marker[]>
  cities: QueryState<readonly City[]>
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
  // Cities that did not load leave every price bare rather than guessed. That
  // is the same rule the schema states: a price in the wrong currency is worse
  // than one in none, because it looks correct.
  const loadedCities = cities.status === 'ready' ? cities.data : []
  const currencyOf = (marker: Marker) =>
    loadedCities.find((city) => city.id === marker.cityId)?.currency ?? null

  return (
    <>
      <TripMap
        markers={markers.status === 'ready' ? markers.data : []}
        currencyOf={currencyOf}
      />

      {markers.status === 'empty' ? (
        <MarkersOverlayNote>No places saved on this trip yet.</MarkersOverlayNote>
      ) : null}

      {markers.status === 'failed' ? (
        <MarkersOverlayNote tone="danger">{markers.message}</MarkersOverlayNote>
      ) : null}
    </>
  )
}

/** The header's own breathing room, above and below its content. */
const HEADER_PAD = 11

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.sm,
    paddingHorizontal: SPACE.md,
    // `paddingTop` is applied inline instead, because it has to carry the
    // device's top inset as well as this.
    paddingBottom: HEADER_PAD,
    borderBottomWidth: 1,
  },
  dot: { width: 9, height: 9, borderRadius: 5 },
  brand: { ...role(TYPE.title), fontWeight: '800', letterSpacing: -0.5 },
  tripName: { ...role(TYPE.note) },
  signOut: { marginLeft: 'auto' },
  signOutText: { ...role(TYPE.control) },
  body: { flex: 1 },
})
