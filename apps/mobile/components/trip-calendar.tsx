import { signOut } from '@pinpoint/auth'
import {
  type CalendarView,
  calendarViewShown,
  dayShown,
  type FieldErrors,
  groupMarkersByDay,
  groupUndatedByCity,
  type IsoDay,
  type Marker,
  type MarkerFormValues,
  type MarkerInterest,
  markersOnDay,
  type Trip,
} from '@pinpoint/core'
import {
  deleteMarker,
  fetchTripCities,
  fetchTripInterest,
  fetchTripMarkers,
  fetchTripMembers,
  ownMemberOf,
  recordInterest,
  setMarkerVisited,
  updateMarker,
  withdrawInterest,
} from '@pinpoint/data'
import { groupCoincident } from '@pinpoint/map'
import { useRouter } from 'expo-router'
import { useMemo, useState } from 'react'

import { CalendarScreen } from '@/components/calendar-screen'
import { MarkerDetails, type Selection } from '@/components/marker-details'
import { MarkerFormSheet } from '@/components/marker-form'
import { MenuSheet } from '@/components/menu-sheet'
import { PeopleSheet } from '@/components/people-sheet'
import { TripSheet } from '@/components/trip-sheet'
import { askMapToShow } from '@/lib/calendar-detour'
import { supabase } from '@/lib/supabase'
import { useActiveAgain } from '@/lib/use-active-again'
import { type Query, useQuery } from '@/lib/use-query'
import { useTripActions } from '@/lib/use-trip-actions'

/**
 * A trip's places, arranged by the day they are planned for.
 *
 * THE NARROW SHAPE, WHICH IS THE ONLY SHAPE HERE
 *
 * The laptop draws three days side by side where there is room and one where
 * there is not. A phone is never the wide shape, so this is the narrow one:
 * one day at a time, and the places waiting for a day in a view of their own
 * beside it — switched between by the tabs under the header, with the controls
 * for stepping pinned between those and the part that scrolls.
 *
 * **It applies no filter.** The map's filter is a property of the map, and a
 * calendar that inherited it would present a day as emptier than it is and count
 * the waiting pile short — with the control that would have explained the
 * absence left behind on another screen. Somebody would believe they had
 * finished arranging a trip they had not. Nothing here even reads the filter:
 * this screen fetches the trip's markers itself.
 *
 * WHAT SCROLLING MEANS HERE
 *
 * Only "show me the rest of this day". The day changes from the band's controls
 * and from nothing else, which is why the band is outside the scrolling view
 * rather than the first thing in it — a day can hold more places than fit, and
 * reaching the last of them must not step off the day to do it.
 *
 * Every day in this file is a `YYYY-MM-DD` string. Nothing here builds a `Date`
 * from one: `@pinpoint/core` owns that, because `new Date('2026-04-03')` parses
 * as UTC midnight and reads as the previous day across most of the western
 * hemisphere.
 */

export function TripCalendar({
  trip,
  trips,
  onSelectTrip,
  onCreated,
  userId,
  asked,
}: {
  trip: Trip
  /** Every trip this account is on, so one can be chosen from here. */
  trips: Query<Trip>
  onSelectTrip: (tripId: string) => void
  onCreated: (tripId: string) => void
  userId: string
  /**
   * The day and view to open on, when coming back from looking at a place on
   * the map. Null on every other arrival.
   */
  asked: { day?: string; view?: string } | null
}) {
  const router = useRouter()

  /*
   * The four lists this screen shows, beside the trips it was handed.
   *
   * Read here rather than carried from the map, because this screen can be
   * reached, left and come back to — and because `data-freshness` says every
   * list a person can see is re-read when the application returns. The cities
   * are among them although this screen cannot make one: it *shows* them, in the
   * edit form's chooser, and a city renamed on the map would otherwise stay stale
   * here.
   */
  const markerQuery = useQuery(() => fetchTripMarkers(supabase, trip.id), [trip.id])
  const cityQuery = useQuery(() => fetchTripCities(supabase, trip.id), [trip.id])
  const interestQuery = useQuery(() => fetchTripInterest(supabase, trip.id), [trip.id])
  const memberQuery = useQuery(() => fetchTripMembers(supabase, trip.id), [trip.id])

  const markers = markerQuery.rows
  const cities = cityQuery.rows
  const interest = interestQuery.rows
  const members = memberQuery.rows

  const [problem, setProblem] = useState<string | null>(null)
  const [tripsOpen, setTripsOpen] = useState(false)
  const [peopleOpen, setPeopleOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [openMarkerId, setOpenMarkerId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [conflict, setConflict] = useState<string | null>(null)
  const [removingId, setRemovingId] = useState<string | null>(null)

  /**
   * The day being read.
   *
   * Seeded from the rule that decides which day a trip opens on — today while
   * the trip is happening, its start date otherwise, today for the many trips
   * carrying no dates. It is state rather than anything held elsewhere because
   * stepping through a fortnight must not re-read the trip: every day of it is
   * already here, grouped.
   *
   * Arriving at another trip re-seeds it by remounting, which the route does.
   * Coming back from the map is the one arrival that asks for a day.
   */
  const [day, setDay] = useState<IsoDay>(() => dayShown(asked?.day, trip))

  /**
   * Which view the screen is showing, remembered here only so that looking at
   * a place on the map can say where to come back to. The screen owns it; this
   * is told when it changes.
   */
  const [view, setView] = useState<CalendarView>(() => calendarViewShown(asked?.view))

  const tripActions = useTripActions({
    trip,
    trips,
    members: memberQuery,
    report: setProblem,
  })

  /** Every list this screen shows, read again. */
  function rereadEverything(options?: { force?: boolean }) {
    return Promise.all([
      trips.refetch(options),
      markerQuery.refetch(options),
      cityQuery.refetch(options),
      interestQuery.refetch(options),
      memberQuery.refetch(options),
    ])
  }

  /*
   * Coming back to the application is how somebody learns that the person they
   * are planning with changed something. `useQuery` holds the floor that stops
   * this costing a round of reads for a notification pull.
   */
  useActiveAgain(() => void rereadEverything())

  /**
   * Opening a sheet is somebody saying "show me this", which is the return
   * trigger at the scale of one list — the same treatment the map gives it.
   */
  function showSheet(
    open: (value: boolean) => void,
    value: boolean,
    reread?: () => Promise<unknown>,
  ) {
    setProblem(null)
    open(value)
    if (value && reread) void reread()
  }

  const grouped = useMemo(() => groupMarkersByDay(markers), [markers])
  const onThisDay = markersOnDay(grouped, day)
  const waiting = useMemo(
    () => groupUndatedByCity(grouped.undated, cities),
    [grouped, cities],
  )

  const ownMemberId = ownMemberOf(members, userId)?.id ?? null

  const openMarker = markers.find((each) => each.id === openMarkerId) ?? null
  const editing = markers.find((each) => each.id === editingId) ?? null

  function interestFor(marker: Marker): readonly MarkerInterest[] {
    return interest.filter((record) => record.markerId === marker.id)
  }

  /**
   * One place as the group shape the details sheet speaks.
   *
   * Nothing on this screen groups by position — it is a list of names, not a map
   * — so a group of one is always what this is, and the chooser the sheet can
   * show never appears.
   */
  const selection = useMemo<Selection | null>(() => {
    if (!openMarker) return null
    const group = groupCoincident([openMarker])[0]
    return group ? { group, index: 0, hidden: false } : null
  }, [openMarker])

  async function save(values: MarkerFormValues) {
    if (!editing) return
    setFieldErrors({})
    setProblem(null)
    setConflict(null)

    const outcome = await updateMarker(
      supabase,
      editing.id,
      values,
      // The version this edit was based on, captured when the form opened.
      // Re-reading it here would make the check pass by construction.
      editing.updatedAt,
    )

    if (!outcome.ok) {
      // Everything entered survives a refusal, whichever kind it was.
      if (outcome.kind === 'invalid-input') setFieldErrors(outcome.fieldErrors)
      else if (outcome.kind === 'conflict') setConflict(outcome.message)
      else setProblem(outcome.message)
      return
    }

    const saved = outcome.data
    markerQuery.set((rows) => rows.map((each) => (each.id === saved.id ? saved : each)))
    setEditingId(null)

    /*
     * The day being read does not move.
     *
     * Saving returns to the details card, and the card states the new day — the
     * save is already confirmed, in front of them. Following the place to its new
     * day as well would cost the thing they were doing: working through the
     * waiting pile is a queue, and the queue is reachable from every day. A place
     * moved off the day being read simply leaves it, which is the whole answer.
     */
  }

  async function remove(marker: Marker) {
    setProblem(null)
    // Which marker, not whether something is happening: the sheet can only ever
    // be made to say this about the place it is about.
    setRemovingId(marker.id)

    const outcome = await deleteMarker(supabase, marker.id)
    setRemovingId(null)
    if (!outcome.ok) {
      setProblem(
        outcome.kind === 'rejected' ? outcome.message : 'Could not remove that place.',
      )
      return
    }
    markerQuery.set((rows) => rows.filter((each) => each.id !== marker.id))
    setEditingId(null)
    setOpenMarkerId(null)
  }

  async function markVisited(marker: Marker, visited: boolean) {
    setProblem(null)

    const previous = markers
    markerQuery.set((rows) =>
      rows.map((each) => (each.id === marker.id ? { ...each, visited } : each)),
    )

    const outcome = await setMarkerVisited(supabase, marker.id, visited)
    if (!outcome.ok) {
      markerQuery.set(() => previous)
      setProblem(
        outcome.kind === 'rejected'
          ? outcome.message
          : 'Could not change whether this place is visited.',
      )
    }
  }

  async function answer(marker: Marker, interested: boolean) {
    if (ownMemberId === null) return
    setProblem(null)

    const previous = interest
    interestQuery.set((records) => [
      ...records.filter(
        (record) =>
          !(record.markerId === marker.id && record.memberId === ownMemberId),
      ),
      {
        markerId: marker.id,
        memberId: ownMemberId,
        interested,
        updatedAt: new Date().toISOString(),
      },
    ])

    const outcome = await recordInterest(supabase, {
      markerId: marker.id,
      memberId: ownMemberId,
      interested,
    })
    if (!outcome.ok) {
      interestQuery.set(() => previous)
      setProblem(outcome.kind === 'rejected' ? outcome.message : 'Could not save that.')
    }
  }

  async function unanswer(marker: Marker) {
    if (ownMemberId === null) return
    setProblem(null)

    const previous = interest
    interestQuery.set((records) =>
      records.filter(
        (record) =>
          !(record.markerId === marker.id && record.memberId === ownMemberId),
      ),
    )

    const outcome = await withdrawInterest(supabase, marker.id, ownMemberId)
    if (!outcome.ok) {
      interestQuery.set(() => previous)
      setProblem(outcome.kind === 'rejected' ? outcome.message : 'Could not save that.')
    }
  }

  /**
   * Looking at a place on the map, as a detour rather than a departure.
   *
   * The map is underneath, so this leaves it a note and goes back to it. The
   * day and the view go in the note because this screen is gone once popped;
   * the map hands them back when its way back to the calendar is used.
   */
  function viewOnMap(marker: Marker) {
    askMapToShow({ tripId: trip.id, markerId: marker.id, day, view })
    backToTheMap()
  }

  /** The way back, used by the control in the header and by archiving a trip. */
  function backToTheMap() {
    /*
     * `back()` when there is something to go back to, and the map otherwise.
     *
     * Going back rather than navigating to `/` is what restores the map as it
     * was left — the same city, the same filter, the same camera — because the
     * screen is still mounted underneath rather than being built again. The
     * fallback covers somebody who arrived here by a deep link and has no
     * history; a control that does nothing when pressed is worse than one that
     * goes somewhere sensible. Which trip it lands on is not in question either
     * way: that is held above both screens.
     */
    if (router.canGoBack()) router.back()
    else router.replace('/')
  }

  return (
    <CalendarScreen
      live={{
        tripName: trip.name,
        onOpenTrips: () => showSheet(setTripsOpen, true, trips.refetch),
        onOpenMenu: () => setMenuOpen(true),
        onBack: backToTheMap,
        day,
        onGoToDay: setDay,
        problem,
        onDismissProblem: () => setProblem(null),
      }}
      initialView={view}
      onViewChange={setView}
      /*
        Drawn rows until the places and the cities have both been read once —
        the cities too, because the places waiting are grouped under them.
        Before this, the rows were the empty list a query holds while loading,
        and every day said "Nothing planned" until its places arrived.

        A re-read never brings the rows back: `useQuery` keeps what it holds on
        screen while it reads again, so its status is only ever `loading` before
        the first answer.
      */
      lists={
        markerQuery.state.status === 'loading' || cityQuery.state.status === 'loading'
          ? null
          : {
              onThisDay,
              waiting,
              waitingCount: grouped.undated.length,
              onOpen: (marker) => setOpenMarkerId(marker.id),
            }
      }
    >
      {/*
        The place, in the same sheet the map opens, with the same actions.

        `marker-details` is rendered rather than reimplemented, so what a place
        shows here cannot drift from what it shows there — which is the whole of
        the requirement that this screen is not a lesser account of a place.
      */}
      {editing === null && selection ? (
        <MarkerDetails
          selection={selection}
          members={members}
          interestFor={interestFor}
          // Resolved here, where the cities are, rather than handing the sheet
          // the whole trip's — the same narrowness `interestFor` keeps.
          cityNameOf={(marker) =>
            cities.find((city) => city.id === marker.cityId)?.name ?? null
          }
          ownMemberId={ownMemberId}
          onRecordInterest={(marker, interested) => void answer(marker, interested)}
          onWithdrawInterest={(marker) => void unanswer(marker)}
          onSetVisited={(marker, visited) => void markVisited(marker, visited)}
          // One place at a time here: nothing on this screen groups by position,
          // so there is never a chooser to go back to.
          onChoose={() => {}}
          onBack={() => {}}
          extraAction={{
            label: 'View on map',
            onPress: () => viewOnMap(selection.group.markers[0]!),
          }}
          onDismiss={() => setOpenMarkerId(null)}
          onEdit={(marker) => {
            setFieldErrors({})
            setConflict(null)
            setEditingId(marker.id)
          }}
          onDelete={(marker) => void remove(marker)}
          removingId={removingId}
        />
      ) : null}

      {editing ? (
        <MarkerFormSheet
          title="Edit place"
          initial={{
            name: editing.name,
            note: editing.note,
            cityId: editing.cityId,
            type: editing.type,
            link: editing.link,
            price: editing.price,
            localPrice: editing.localPrice,
            localCurrency: editing.localCurrency,
            plannedOn: editing.plannedOn,
            plannedUntil: editing.plannedUntil,
            hours: editing.hours,
          }}
          cities={cities}
          // Nothing to say: the place already has a city or does not, and this
          // screen never placed it anywhere for a rule to have an opinion about.
          cityNotice={null}
          fieldErrors={fieldErrors}
          message={conflict}
          notice={null}
          onSubmit={save}
          onCancel={() => {
            setEditingId(null)
            setFieldErrors({})
            setConflict(null)
          }}
          /*
            No `onAdjustPosition` and no `onCreateCity`. There is no map behind
            this sheet to correct a position on, and making a city is the map's
            business — on a screen that never shows where a city is, offering it
            would be a control that cannot answer for itself. Both are absent
            rather than present and inert, and the laptop's calendar leaves the
            same two out.

            That last sentence was wrong for as long as it stood. The laptop's
            calendar passed `async () => null`, which its form read as a failed
            creation rather than as an absence — so it offered `+ New city…` and
            refused every use of it (`#189`). The comment asserted a parity that
            was never checked, which is what let the defect live: anyone reading
            here was told the other side already agreed. Both calendars now pass
            nothing, and both forms draw the option only when they are given a
            way to honour it.
          */
          onDelete={() => void remove(editing)}
          removing={removingId === editing.id}
        />
      ) : null}

      <TripSheet
        open={tripsOpen}
        onClose={() => showSheet(setTripsOpen, false)}
        trip={trip}
        trips={trips.rows}
        archived={tripActions.archived}
        onRevealArchived={tripActions.revealArchived}
        /*
          Choosing another trip shows that trip's calendar rather than returning
          to the map. The route above remounts on the new trip, so the day is
          decided by the opening rule again — a day carried across means nothing
          in a trip that rarely covers the same dates.
        */
        onSelectTrip={onSelectTrip}
        onRename={tripActions.renameTrip}
        onSetDates={tripActions.setTripDates}
        // The map, which is the view this screen is not. The same way back the
        // header's control takes, so the two cannot disagree about what "back"
        // means.
        otherView={{ name: 'Map', onPress: backToTheMap }}
        onCreated={onCreated}
        onSetArchived={(tripId, value) => {
          void tripActions.setTripArchived(tripId, value)
          /*
            Archiving the trip being read leaves for the map, because the map is
            the screen that knows how to explain having no trips — it is where a
            first one is made. This screen could only say there is no trip here
            to show a calendar for.
          */
          if (value && tripId === trip.id) backToTheMap()
        }}
        onOpenPeople={() => {
          showSheet(setTripsOpen, false)
          showSheet(setPeopleOpen, true, memberQuery.refetch)
        }}
        problem={problem}
        onDismissProblem={() => setProblem(null)}
      />

      <PeopleSheet
        open={peopleOpen}
        onClose={() => showSheet(setPeopleOpen, false)}
        members={members}
        ownMemberId={ownMemberId}
        onInvite={tripActions.invite}
            onRemove={tripActions.removeInvitation}
      />

      <MenuSheet
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        onSignOut={() => void signOut(supabase)}
        member={ownMemberOf(members, userId) ?? null}
      />
    </CalendarScreen>
  )
}
