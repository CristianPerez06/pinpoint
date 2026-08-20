import { signOut } from '@pinpoint/auth'
import type {
  City,
  Marker,
  MarkerFilter,
  MarkerInterest,
  Trip,
  TripMember,
} from '@pinpoint/core'
import { matchesFilter, NO_FILTER } from '@pinpoint/core'
import {
  fetchTripCities,
  fetchTripInterest,
  fetchTripMarkers,
  fetchTripMembers,
  ownMemberOf,
  recordInterest,
  setMarkerVisited,
  withdrawInterest,
} from '@pinpoint/data'
import { RADIUS, SPACE, TYPE } from '@pinpoint/tokens'
import { useMemo, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { FilterSheet, summariseFilter } from '@/components/filter-sheet'
import { MarkersOverlayNote } from '@/components/overlay-note'
import { FailedState, LoadingState } from '@/components/states'
import { TripMap } from '@/components/trip-map'
import { supabase } from '@/lib/supabase'
import { useTheme } from '@/lib/theme'
import { role } from '@/lib/type'
import { useQuery } from '@/lib/use-query'

/**
 * Everything a trip can be doing on a phone, in one place.
 *
 * This is new to the platform rather than ported. Until now the mobile screen
 * held nothing: `useQuery` returned a result and it went straight into the map,
 * which is all a read-only screen needs. Recording interest needs somewhere for
 * an optimistic write to live, and this is it — the same role
 * `trip-workspace.tsx` plays on web, for the same reason.
 *
 * It owns the header as well as the data, which web does not. The header holds
 * the filter control, the filter narrows the trip, and one component owning both
 * is better than two components sharing the state between them. The alternative
 * put trip-scoped state in the route file, which already owns the session and
 * the redirect.
 */

export function TripWorkspace({
  trip,
  userId,
}: {
  trip: Trip
  /**
   * Whose account is reading. Passed in rather than reached for, because the
   * route has already established there is one — a component that could be
   * rendered without a session would have to handle a state that cannot happen.
   */
  userId: string
}) {
  const theme = useTheme()
  // The header is the top of the screen, so it owns the space the system draws
  // into. Without this the wordmark sits under the clock and the Dynamic Island.
  const insets = useSafeAreaInsets()

  const markerQuery = useQuery(() => fetchTripMarkers(supabase, trip.id), [trip.id])
  const cityQuery = useQuery(() => fetchTripCities(supabase, trip.id), [trip.id])
  const interestQuery = useQuery(() => fetchTripInterest(supabase, trip.id), [trip.id])
  const memberQuery = useQuery(() => fetchTripMembers(supabase, trip.id), [trip.id])

  /**
   * What writes have changed — not a copy of what the queries returned.
   *
   * The design for this change said to seed state from the query once and never
   * re-seed, mirroring web. That was the wrong shape and the linter said so:
   * copying a query result into state inside an effect is the pattern React
   * tells you not to write, and it carried the exact hazard it was meant to
   * avoid — a later seed replacing an answer somebody had just recorded.
   *
   * Holding the overrides instead removes the question. There is nothing to
   * re-seed, because the query result is never copied; a refetch is respected
   * for free; and reverting a refused write means dropping the override, which
   * restores what is actually stored rather than a snapshot taken beforehand.
   *
   * Keyed by marker id. `null` in `answers` means withdrawn, which is a value
   * the map has to be able to hold — absence means "no local opinion", and
   * withdrawn is very much a local opinion.
   */
  const [visitedWrites, setVisitedWrites] = useState<ReadonlyMap<string, boolean>>(
    new Map(),
  )
  const [answers, setAnswers] = useState<ReadonlyMap<string, MarkerInterest | null>>(
    new Map(),
  )
  const [filter, setFilter] = useState<MarkerFilter>(NO_FILTER)
  const [filterOpen, setFilterOpen] = useState(false)
  const [problem, setProblem] = useState<string | null>(null)

  const members: readonly TripMember[] =
    memberQuery.status === 'ready' ? memberQuery.data : []
  /**
   * Which member the reader is, or null when their account matches none.
   *
   * Null is ordinary rather than broken: a member exists before the account
   * does. They can read the trip and see everyone's answers; they have nothing
   * to attribute an answer to, so no control is offered.
   */
  const ownMemberId = ownMemberOf(members, userId)?.id ?? null

  const cities: readonly City[] = cityQuery.status === 'ready' ? cityQuery.data : []
  const currencyOf = (marker: Marker) =>
    cities.find((city) => city.id === marker.cityId)?.currency ?? null

  /** The stored markers, with any local visited write laid over them. */
  const held = useMemo(() => {
    const base = markerQuery.status === 'ready' ? markerQuery.data : []
    if (visitedWrites.size === 0) return base
    return base.map((marker) =>
      visitedWrites.has(marker.id)
        ? { ...marker, visited: visitedWrites.get(marker.id)! }
        : marker,
    )
  }, [markerQuery, visitedWrites])

  /** The stored records, with the reader's own local answers laid over them. */
  const interest = useMemo(() => {
    const base = interestQuery.status === 'ready' ? interestQuery.data : []
    if (ownMemberId === null || answers.size === 0) return base

    // Everything except this reader's records for markers they have answered
    // locally — those are replaced below, or dropped when withdrawn.
    const others = base.filter(
      (record) => !(record.memberId === ownMemberId && answers.has(record.markerId)),
    )
    const mine = [...answers.values()].filter(
      (record): record is MarkerInterest => record !== null,
    )
    return [...others, ...mine]
  }, [interestQuery, answers, ownMemberId])

  const interestFor = (marker: Marker) =>
    interest.filter((record) => record.markerId === marker.id)

  /**
   * One narrowed set, from the same predicate the laptop uses, so the two cannot
   * disagree about what this trip contains.
   */
  const visible = useMemo(
    () =>
      held.filter((marker) =>
        matchesFilter(
          marker,
          interest.filter((record) => record.markerId === marker.id),
          filter,
        ),
      ),
    [held, interest, filter],
  )

  const narrowed = visible.length !== held.length

  /**
   * Laying an override on, and taking it off again if the database disagrees.
   *
   * Optimistic, like the laptop: a toggle that waited for a round trip would
   * feel worse than the spreadsheet this replaces, and these are the writes made
   * most often in a row.
   *
   * Dropping the override on failure restores what is stored rather than a copy
   * captured beforehand, so a revert cannot resurrect a stale value.
   */
  function withoutOverride<V>(map: ReadonlyMap<string, V>, markerId: string) {
    const next = new Map(map)
    next.delete(markerId)
    return next
  }

  async function answer(marker: Marker, interested: boolean) {
    if (ownMemberId === null) return

    setAnswers((current) =>
      new Map(current).set(marker.id, {
        markerId: marker.id,
        memberId: ownMemberId,
        interested,
        // Nothing reads this, and stamping it once here beats recomputing it on
        // every render inside the merge above.
        updatedAt: new Date().toISOString(),
      }),
    )

    const outcome = await recordInterest(supabase, {
      markerId: marker.id,
      memberId: ownMemberId,
      interested,
    })
    if (!outcome.ok) {
      setAnswers((current) => withoutOverride(current, marker.id))
      setProblem(outcome.kind === 'rejected' ? outcome.message : 'Could not save that.')
    }
  }

  async function unanswer(marker: Marker) {
    if (ownMemberId === null) return

    // Null rather than absent: absent means "no local opinion", and withdrawing
    // is an opinion that has to survive the merge.
    setAnswers((current) => new Map(current).set(marker.id, null))

    const outcome = await withdrawInterest(supabase, marker.id, ownMemberId)
    if (!outcome.ok) {
      setAnswers((current) => withoutOverride(current, marker.id))
      setProblem(outcome.kind === 'rejected' ? outcome.message : 'Could not save that.')
    }
  }

  async function markVisited(marker: Marker, visited: boolean) {
    setVisitedWrites((current) => new Map(current).set(marker.id, visited))

    const outcome = await setMarkerVisited(supabase, marker.id, visited)
    if (!outcome.ok) {
      setVisitedWrites((current) => withoutOverride(current, marker.id))
      setProblem(
        outcome.kind === 'rejected'
          ? outcome.message
          : 'Could not change whether this place is visited.',
      )
    }
  }

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
        <Text style={[styles.tripName, { color: theme.colour.inkMuted }]}>
          {trip.name}
        </Text>

        <Pressable
          onPress={() => setFilterOpen(true)}
          accessibilityRole="button"
          accessibilityLabel="Filter this trip"
          hitSlop={6}
          style={[
            styles.filter,
            {
              borderColor: narrowed ? theme.colour.accent : theme.colour.lineStrong,
              backgroundColor: narrowed ? theme.colour.accentWash : 'transparent',
              marginLeft: 'auto',
            },
          ]}
        >
          <Text
            style={[
              styles.filterText,
              { color: narrowed ? theme.colour.accentInk : theme.colour.ink },
            ]}
            numberOfLines={1}
          >
            {summariseFilter(filter, members, ownMemberId)}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => void signOut(supabase)}
          accessibilityRole="button"
          hitSlop={8}
        >
          <Text style={[styles.signOutText, { color: theme.colour.inkMuted }]}>
            Sign out
          </Text>
        </Pressable>
      </View>

      {/*
        A narrowed view says it is narrowed, and clears from where it says so.

        This strip exists only while something is hidden, so it costs the map no
        permanent space — and it is the requirement a sheet-based control is most
        likely to miss. The choice itself is invisible once the sheet closes; a
        trip looking emptier than it is with nothing explaining why is the defect
        this prevents.
      */}
      {narrowed ? (
        <View
          style={[
            styles.narrowed,
            { backgroundColor: theme.colour.accentWash, borderColor: theme.colour.line },
          ]}
        >
          <Text style={[styles.narrowedText, { color: theme.colour.accentInk }]}>
            Showing {visible.length} of {held.length}
          </Text>
          <Pressable onPress={() => setFilter(NO_FILTER)} accessibilityRole="button" hitSlop={8}>
            <Text style={[styles.clearText, { color: theme.colour.accentInk }]}>
              Clear
            </Text>
          </Pressable>
        </View>
      ) : null}

      <View style={styles.body}>
        <Body
          loading={markerQuery.status === 'loading'}
          failed={markerQuery.status === 'failed' ? markerQuery.message : null}
          total={held.length}
          visible={visible}
          currencyOf={currencyOf}
          members={members}
          interestFor={interestFor}
          ownMemberId={ownMemberId}
          onRecordInterest={(marker, interested) => void answer(marker, interested)}
          onWithdrawInterest={(marker) => void unanswer(marker)}
          onSetVisited={(marker, visited) => void markVisited(marker, visited)}
          onClearFilter={() => setFilter(NO_FILTER)}
        />

        {/* A refused write, said out loud. Dismissible, because the state it
            described has already been put back. */}
        {problem !== null ? (
          <Pressable onPress={() => setProblem(null)} accessibilityRole="button">
            <MarkersOverlayNote tone="danger">{problem}</MarkersOverlayNote>
          </Pressable>
        ) : null}
      </View>

      <FilterSheet
        open={filterOpen}
        filter={filter}
        onChange={setFilter}
        onClose={() => setFilterOpen(false)}
        members={members}
        ownMemberId={ownMemberId}
      />
    </View>
  )
}

/**
 * The states a trip's markers can be in, now four rather than three.
 *
 * "Nothing matches this filter" is the new one, and it is kept distinct from
 * "this trip has nothing on it" for the reason the specification gives: the two
 * render identically as an empty map, and the difference is not one a person can
 * recover on their own.
 */
function Body({
  loading,
  failed,
  total,
  visible,
  currencyOf,
  members,
  interestFor,
  ownMemberId,
  onRecordInterest,
  onWithdrawInterest,
  onSetVisited,
  onClearFilter,
}: {
  loading: boolean
  failed: string | null
  total: number
  visible: readonly Marker[]
  currencyOf: (marker: Marker) => string | null
  members: readonly TripMember[]
  interestFor: (marker: Marker) => readonly MarkerInterest[]
  ownMemberId: string | null
  onRecordInterest: (marker: Marker, interested: boolean) => void
  onWithdrawInterest: (marker: Marker) => void
  onSetVisited: (marker: Marker, visited: boolean) => void
  onClearFilter: () => void
}) {
  if (failed !== null && total === 0) return <FailedState message={failed} />
  if (loading) return <LoadingState />

  return (
    <>
      <TripMap
        markers={visible}
        currencyOf={currencyOf}
        members={members}
        interestFor={interestFor}
        ownMemberId={ownMemberId}
        onRecordInterest={onRecordInterest}
        onWithdrawInterest={onWithdrawInterest}
        onSetVisited={onSetVisited}
      />

      {total === 0 ? (
        <MarkersOverlayNote>No places saved on this trip yet.</MarkersOverlayNote>
      ) : null}

      {total > 0 && visible.length === 0 ? (
        <Pressable onPress={onClearFilter} accessibilityRole="button">
          <MarkersOverlayNote>
            No places match this filter. The trip still has {total}
            {total === 1 ? ' place' : ' places'} — tap to clear.
          </MarkersOverlayNote>
        </Pressable>
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
  tripName: { ...role(TYPE.note), flexShrink: 1 },
  filter: {
    borderWidth: 1,
    borderRadius: RADIUS.pill,
    paddingVertical: 5,
    paddingHorizontal: 11,
    maxWidth: 150,
  },
  filterText: { ...role(TYPE.control) },
  signOutText: { ...role(TYPE.control) },
  narrowed: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACE.md,
    paddingVertical: 7,
    borderBottomWidth: 1,
  },
  narrowedText: { ...role(TYPE.note), fontWeight: '600' },
  clearText: { ...role(TYPE.control), fontWeight: '700' },
  body: { flex: 1 },
})
