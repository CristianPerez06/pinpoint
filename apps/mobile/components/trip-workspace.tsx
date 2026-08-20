import { signOut } from '@pinpoint/auth'
import type {
  City,
  Marker,
  MarkerFilter,
  MarkerInterest,
  Trip,
  TripMember,
} from '@pinpoint/core'
import { isFiltered, matchesFilter, NO_FILTER } from '@pinpoint/core'
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
import { type ReactNode, useMemo, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { FilterSheet } from '@/components/filter-sheet'
import { MenuSheet } from '@/components/menu-sheet'
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
  const [menuOpen, setMenuOpen] = useState(false)
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

  /**
   * Whether a filter is applied — not whether it happens to be hiding anything.
   *
   * These come apart: tick everybody on a trip where everybody wants everything
   * and the counts match while a filter is very much on. Deriving this from the
   * counts left the control inert, and so left the person with no way out of a
   * state they were in. It mattered less when this only drove a strip reporting
   * "showing N of M", which is genuinely about counts; it is wrong now that the
   * control is what declares the filter.
   */
  const narrowed = isFiltered(filter)

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
        {/*
          What is rare, and one thing that is not a control.

          The wordmark is gone: inside the pinpoint application it says nothing
          the reader does not know, and the dot beside it is already the mark —
          a pin reduced to the point it names, in the one colour that is not a
          marker family. The trip name says which trip, which becomes a real
          question the moment more than one can exist.

          Being out of a thumb's reach up here is correct rather than wasteful.
          Nobody wants Sign out under their thumb; the controls that are touched
          while planning are in the row at the bottom.
        */}
        <View style={[styles.dot, { backgroundColor: theme.colour.accent }]} />
        <Text style={[styles.tripName, { color: theme.colour.ink }]} numberOfLines={1}>
          {trip.name}
        </Text>

        <Pressable
          onPress={() => setMenuOpen(true)}
          accessibilityRole="button"
          accessibilityLabel="Menu"
          hitSlop={8}
          style={{ marginLeft: 'auto' }}
        >
          <Text style={[styles.menuGlyph, { color: theme.colour.ink }]}>☰</Text>
        </Pressable>
      </View>

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
          /*
            Handed to the map rather than rendered beside it, because the bottom
            of the map is already choreographed — the attribution is a licence
            condition with its own offset, and the marker sheet rises from the
            same edge. The map decides where this sits and when it yields; this
            component only decides what is in it.
          */
          bottomRow={
            <View style={styles.bottomRow}>
              <Pressable
                onPress={() => setFilterOpen(true)}
                accessibilityRole="button"
                accessibilityLabel="Filter this trip"
                hitSlop={6}
                style={[
                  styles.pill,
                  {
                    borderColor: narrowed
                      ? theme.colour.accent
                      : theme.colour.lineStrong,
                    backgroundColor: narrowed
                      ? theme.colour.accentWash
                      : theme.colour.surface,
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
                  Filter
                </Text>
              </Pressable>

              {/*
                The declaration, and the way out, in one control — unchanged by
                the move. Permanent, live only while something is hidden, and
                inert through `accessibilityState` rather than `disabled` so a
                screen reader still reaches it and is told which state it is in.
              */}
              <Pressable
                onPress={() => {
                  if (narrowed) setFilter(NO_FILTER)
                }}
                accessibilityRole="button"
                accessibilityLabel="Clear the filter"
                accessibilityState={{ disabled: !narrowed }}
                hitSlop={8}
                style={[
                  styles.pill,
                  {
                    borderColor: narrowed ? theme.colour.accent : 'transparent',
                    backgroundColor: narrowed
                      ? theme.colour.accentWash
                      : theme.colour.surface,
                  },
                ]}
              >
                <Text
                  style={[
                    narrowed ? styles.clearText : styles.clearTextInert,
                    { color: narrowed ? theme.colour.accentInk : theme.colour.inkFaint },
                  ]}
                >
                  Clear
                </Text>
              </Pressable>
            </View>
          }
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

      <MenuSheet
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        onSignOut={() => void signOut(supabase)}
        tripName={trip.name}
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
  bottomRow,
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
  /** Handed on to the map, which owns the bottom edge. */
  bottomRow: ReactNode
}) {
  if (failed !== null && total === 0) return <FailedState message={failed} />
  if (loading) return <LoadingState />

  return (
    <>
      <TripMap
        bottomRow={bottomRow}
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
  // Carries the prominence the wordmark used to, and stays the only element
  // that yields, so a long name truncates instead of pushing the menu off.
  tripName: { ...role(TYPE.title), flexShrink: 1 },
  menuGlyph: { fontSize: 19, lineHeight: 22 },

  /*
   * The row a thumb reaches.
   *
   * Pills rather than a solid bar: a bar is a surface for a text field, and
   * there is no text field until mobile capture brings one. Pills keep the map
   * whole, and are what the header already used, so nothing new is invented for
   * two controls.
   */
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.sm,
    paddingHorizontal: SPACE.md,
  },
  pill: {
    borderWidth: 1,
    borderRadius: RADIUS.pill,
    paddingVertical: 7,
    paddingHorizontal: 13,
    maxWidth: 150,
  },
  filterText: { ...role(TYPE.control) },
  // Two states of one control. They differ by weight and by border as well as
  // by colour, so the declaration survives a greyscale screen and a
  // colour-blind reader — the same reason a visited marker is drawn visited
  // without changing colour.
  clearText: { ...role(TYPE.control), fontWeight: '700' },
  clearTextInert: { ...role(TYPE.control), fontWeight: '400' },
  body: { flex: 1 },
})
