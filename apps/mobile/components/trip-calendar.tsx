import { signOut } from '@pinpoint/auth'
import {
  addDays,
  dayToOpenOn,
  type FieldErrors,
  formatDay,
  formatDayFull,
  groupMarkersByDay,
  type IsoDay,
  type Marker,
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
import { groupCoincident, markerView } from '@pinpoint/map'
import { RADIUS, SPACE, TYPE } from '@pinpoint/tokens'
import { useRouter } from 'expo-router'
// Deep imports, not the package root — see marker-icon.tsx. One value import of
// the barrel pulls all 1767 icons and crashes Hermes.
import ChevronDown from 'lucide-react-native/icons/chevron-down'
import ChevronLeft from 'lucide-react-native/icons/chevron-left'
import ChevronRight from 'lucide-react-native/icons/chevron-right'
import Map from 'lucide-react-native/icons/map'
import { useMemo, useState } from 'react'
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import {
  MarkerDetails,
  type Selection,
  TypeChip,
} from '@/components/marker-details'
import { MarkerFormSheet, type MarkerFormValues } from '@/components/marker-form'
import { MenuSheet } from '@/components/menu-sheet'
import { PeopleSheet } from '@/components/people-sheet'
import { TripSheet } from '@/components/trip-sheet'
import { DayField, FormNote } from '@/components/ui'
import { supabase } from '@/lib/supabase'
import { useTheme } from '@/lib/theme'
import { role } from '@/lib/type'
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
 * one day at a time, the places waiting for a day above it, and the controls for
 * stepping pinned between the header and the part that scrolls.
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

/**
 * How much of the window the opened waiting pile may take before it scrolls
 * inside itself.
 *
 * The laptop caps the same list at 38vh for a reason measured on a real trip:
 * ninety-one undated places pushed the day itself off the bottom of the screen,
 * so the one thing the pile is opened to do — put a place on a day — happened
 * with the day no longer visible. A fraction rather than a pixel count, so it
 * holds on every device.
 */
const WAITING_CAP = 0.38

/** The header's own breathing room, above and below its content. */
const HEADER_PAD = SPACE.sm + 2

export function TripCalendar({
  trip,
  trips,
  onSelectTrip,
  onCreated,
  userId,
}: {
  trip: Trip
  /** Every trip this account is on, so one can be chosen from here. */
  trips: Query<Trip>
  onSelectTrip: (tripId: string) => void
  onCreated: (tripId: string) => void
  userId: string
}) {
  const theme = useTheme()
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const windowHeight = useWindowDimensions().height

  /*
   * The four lists this screen shows, beside the trips it was handed.
   *
   * Read here rather than carried from the map, because this screen can be
   * reached, left and come back to — and because `data-freshness` says every
   * list a person can see is re-read when the application returns. The cities
   * are among them although this screen cannot make one: it *shows* them, in the
   * edit form's chooser and in the currency a price is written in, and a city
   * renamed on the map would otherwise stay stale here.
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
   */
  const [day, setDay] = useState<IsoDay>(() => dayToOpenOn(trip))

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

  const ownMemberId = ownMemberOf(members, userId)?.id ?? null

  const openMarker = markers.find((each) => each.id === openMarkerId) ?? null
  const editing = markers.find((each) => each.id === editingId) ?? null

  function currencyOf(marker: Marker): string | null {
    return cities.find((city) => city.id === marker.cityId)?.currency ?? null
  }

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

  function confirmRemove(marker: Marker) {
    Alert.alert(`Remove ${marker.name}?`, 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => void remove(marker) },
    ])
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
    <View style={[styles.screen, { backgroundColor: theme.colour.ground }]}>
      <View
        style={[
          styles.header,
          {
            backgroundColor: theme.colour.surface,
            borderColor: theme.colour.line,
            paddingTop: HEADER_PAD + insets.top,
          },
        ]}
      >
        {/*
          The same bar the map wears, in the same order: the point, the trip's
          name as the way into the trip's actions, and the account at the far
          end. No city control — there is no camera to frame here and nowhere to
          bias a search toward, so one would offer more than it can do.
        */}
        <View style={styles.headerLine}>
          <View style={[styles.dot, { backgroundColor: theme.colour.accent }]} />
          <Pressable
            onPress={() => showSheet(setTripsOpen, true, trips.refetch)}
            accessibilityRole="button"
            accessibilityLabel={`${trip.name}. Switch or manage trips`}
            hitSlop={6}
            style={styles.tripButton}
          >
            <Text
              style={[styles.tripName, { color: theme.colour.ink }]}
              numberOfLines={1}
            >
              {trip.name}
            </Text>
            <ChevronDown size={16} color={theme.colour.inkMuted} strokeWidth={2.4} />
          </Pressable>

          <Pressable
            onPress={() => setMenuOpen(true)}
            accessibilityRole="button"
            accessibilityLabel="Menu"
            hitSlop={8}
            style={styles.menuButton}
          >
            <Text style={[styles.menuGlyph, { color: theme.colour.ink }]}>☰</Text>
          </Pressable>
        </View>

        {/*
          The way back, on its own line beneath the trip's name.

          That is the line the map spends on the city, and this screen names no
          city — so it is the space this screen frees in the header, which is
          where the chrome puts the way out. It is also exactly where the laptop
          puts the same control once its bar takes the phone shape, so the two
          applications agree.

          Deliberately not beside the account: signing out is reached from there,
          and rare destructive controls are kept away from frequent ones. This is
          the most frequent control on the screen.
        */}
        <View style={styles.backLine}>
          <Pressable
            onPress={backToTheMap}
            accessibilityRole="button"
            accessibilityLabel="Back to the map"
            hitSlop={6}
            style={[styles.back, { borderColor: theme.colour.lineStrong }]}
          >
            <Map size={15} color={theme.colour.ink} strokeWidth={2.2} />
            <Text style={[styles.backText, { color: theme.colour.ink }]}>
              Back to the map
            </Text>
          </Pressable>
        </View>
      </View>

      {/*
        The day band: pinned between the header and the part that scrolls.

        Below the header rather than among its controls, because the header says
        which trip and who is reading it and neither changes as the day does —
        and outside the scrolling view, because navigation that scrolls away
        strands whoever is at the bottom of a long day.
      */}
      <View style={styles.dayBand}>
        <Pressable
          onPress={() => setDay(addDays(day, -1))}
          accessibilityRole="button"
          /*
            Named in words, in every rendering. An arrow conveys nothing to a
            screen reader, and "previous" alone conveys only that there is one —
            the day it leads to is what the control has to say.
          */
          accessibilityLabel={`Previous day, ${formatDayFull(addDays(day, -1))}`}
          style={[
            styles.step,
            { borderColor: theme.colour.lineStrong, backgroundColor: theme.colour.surface },
          ]}
        >
          <ChevronLeft size={18} color={theme.colour.ink} strokeWidth={2.2} />
        </Pressable>

        <View style={styles.picker}>
          <DayField
            label="Day"
            value={day}
            // The day being read is always a day: there is no "no day" to be on,
            // so this field cannot be cleared and an emptied value cannot arrive.
            clearable={false}
            onChange={(next) => {
              if (next !== null) setDay(next)
            }}
          />
        </View>

        <Pressable
          onPress={() => setDay(addDays(day, 1))}
          accessibilityRole="button"
          accessibilityLabel={`Next day, ${formatDayFull(addDays(day, 1))}`}
          style={[
            styles.step,
            { borderColor: theme.colour.lineStrong, backgroundColor: theme.colour.surface },
          ]}
        >
          <ChevronRight size={18} color={theme.colour.ink} strokeWidth={2.2} />
        </Pressable>
      </View>

      {problem !== null ? (
        <Pressable
          onPress={() => setProblem(null)}
          accessibilityRole="button"
          accessibilityHint="Dismisses this message"
          style={styles.problem}
        >
          <FormNote tone="danger">{problem}</FormNote>
        </Pressable>
      ) : null}

      {/*
        The body scrolls, and it is a child of a `flex: 1` screen — which has a
        definite height — so it does not meet the collapse that catches a
        `ScrollView` inside a container sized to its children.
      */}
      <ScrollView
        style={styles.body}
        contentContainerStyle={[
          styles.bodyContent,
          { paddingBottom: SPACE.xl + insets.bottom },
        ]}
      >
        <Waiting
          markers={grouped.undated}
          cap={Math.round(windowHeight * WAITING_CAP)}
          onOpen={(marker) => setOpenMarkerId(marker.id)}
        />

        <DayCard day={day} markers={onThisDay} onOpen={(marker) => setOpenMarkerId(marker.id)} />
      </ScrollView>

      {/*
        The place, in the same sheet the map opens, with the same actions.

        `marker-details` is rendered rather than reimplemented, so what a place
        shows here cannot drift from what it shows there — which is the whole of
        the requirement that this screen is not a lesser account of a place.
      */}
      {editing === null && selection ? (
        <MarkerDetails
          selection={selection}
          currencyOf={currencyOf}
          members={members}
          interestFor={interestFor}
          ownMemberId={ownMemberId}
          onRecordInterest={(marker, interested) => void answer(marker, interested)}
          onWithdrawInterest={(marker) => void unanswer(marker)}
          onSetVisited={(marker, visited) => void markVisited(marker, visited)}
          // One place at a time here: nothing on this screen groups by position,
          // so there is never a chooser to go back to.
          onChoose={() => {}}
          onBack={() => {}}
          onDismiss={() => setOpenMarkerId(null)}
          onEdit={(marker) => {
            setFieldErrors({})
            setConflict(null)
            setEditingId(marker.id)
          }}
          onDelete={confirmRemove}
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
            plannedOn: editing.plannedOn,
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
          */
          onDelete={() => confirmRemove(editing)}
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
      />

      <MenuSheet
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        onSignOut={() => void signOut(supabase)}
        member={ownMemberOf(members, userId) ?? null}
      />
    </View>
  )
}

/**
 * The places still waiting for a day.
 *
 * Above the day rather than behind a further act, because these are what
 * somebody came here to deal with — and on the map a place with no day looks
 * exactly like one that has a day, so without this, filling in a trip means
 * opening pins at random hoping to find undated ones.
 *
 * Collapsed by default, stating its count while collapsed, and **present when
 * the count is zero**. A region that appears and disappears moves everything
 * below it, so the screen would rearrange itself at the moment the last place is
 * dated — which is the moment somebody is most likely to still be reading it.
 */
function Waiting({
  markers,
  cap,
  onOpen,
}: {
  markers: readonly Marker[]
  /** A definite height for the opened list, so it can scroll inside itself. */
  cap: number
  onOpen: (marker: Marker) => void
}) {
  const theme = useTheme()
  const [open, setOpen] = useState(false)

  const label =
    markers.length === 0
      ? 'No places waiting for a day'
      : markers.length === 1
        ? '1 place with no day yet'
        : `${markers.length} places with no day yet`

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.colour.surface, borderColor: theme.colour.line },
      ]}
    >
      <Pressable
        onPress={() => {
          if (markers.length > 0) setOpen(!open)
        }}
        accessibilityRole={markers.length === 0 ? 'text' : 'button'}
        accessibilityState={{ expanded: markers.length === 0 ? undefined : open }}
        accessibilityLabel={label}
        style={styles.waitingSummary}
      >
        {markers.length === 0 ? null : (
          <Text style={[styles.waitingCaret, { color: theme.colour.inkMuted }]}>
            {open ? '▾' : '▸'}
          </Text>
        )}
        {/*
          `inkMuted`, never `inkFaint`. This line carries a count somebody is
          meant to act on, which is the opposite of text deliberately hard to
          notice.
        */}
        <Text style={[styles.waitingLabel, { color: theme.colour.inkMuted }]}>
          {label}
        </Text>
      </Pressable>

      {open && markers.length > 0 ? (
        /*
          A definite height, which is what lets this scroll at all: a
          `ScrollView` has no intrinsic content height, so one inside a card that
          sizes to its children is told it has almost no room and clips
          everything past the first row.
        */
        <ScrollView style={{ maxHeight: cap }} nestedScrollEnabled>
          {markers.map((marker) => (
            <PlaceRow key={marker.id} marker={marker} onOpen={onOpen} />
          ))}
        </ScrollView>
      ) : null}
    </View>
  )
}

/** One day, and what is on it. */
function DayCard({
  day,
  markers,
  onOpen,
}: {
  day: IsoDay
  markers: readonly Marker[]
  onOpen: (marker: Marker) => void
}) {
  const theme = useTheme()

  return (
    <View
      style={[
        styles.card,
        styles.dayCard,
        { backgroundColor: theme.colour.surface, borderColor: theme.colour.lineStrong },
      ]}
      accessibilityLabel={formatDayFull(day)}
    >
      <Text style={[styles.dayName, { color: theme.colour.ink }]}>
        {formatDay(day)}
      </Text>

      {markers.length === 0 ? (
        // An empty day is the ordinary state of most days on most trips, and it
        // is information. It is said, not left blank and not drawn as a fault.
        <Text style={[styles.dayEmpty, { color: theme.colour.inkMuted }]}>
          Nothing planned.
        </Text>
      ) : (
        markers.map((marker) => (
          <PlaceRow key={marker.id} marker={marker} onOpen={onOpen} />
        ))
      )}
    </View>
  )
}

function PlaceRow({
  marker,
  onOpen,
}: {
  marker: Marker
  onOpen: (marker: Marker) => void
}) {
  const theme = useTheme()
  const view = markerView(marker)

  return (
    <Pressable
      onPress={() => onOpen(marker)}
      accessibilityRole="button"
      accessibilityLabel={
        marker.visited ? `${marker.name}, visited` : marker.name
      }
      style={styles.place}
    >
      <TypeChip view={view} size={26} />
      <Text
        style={[styles.placeName, { color: theme.colour.ink }]}
        numberOfLines={1}
      >
        {marker.name}
      </Text>
      {/* Visited is said in words as well as drawn, because a signal carried
          only by styling does not survive a screen reader. */}
      {marker.visited ? (
        <Text
          style={[
            styles.visited,
            {
              backgroundColor: theme.colour.surfaceSunk,
              color: theme.colour.inkMuted,
            },
          ]}
        >
          VISITED
        </Text>
      ) : null}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    paddingHorizontal: SPACE.md,
    // `paddingTop` is applied inline instead, because it has to carry the
    // device's top inset as well as this.
    paddingBottom: HEADER_PAD,
    borderBottomWidth: 1,
  },
  /** The point, the trip and the account. The map's own first line. */
  headerLine: { flexDirection: 'row', alignItems: 'center', gap: SPACE.sm },
  dot: { width: 9, height: 9, borderRadius: 5 },
  tripButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.xs,
    flexShrink: 1,
  },
  tripName: { ...role(TYPE.title), flexShrink: 1 },
  menuButton: { marginLeft: 'auto' },
  menuGlyph: { ...role(TYPE.title) },
  /*
   * Indented to clear the point, so the way back hangs off the trip's name
   * rather than starting a second column — the line the map spends on the city,
   * laid out the same way.
   */
  backLine: { flexDirection: 'row', paddingLeft: 9 + SPACE.sm, marginTop: SPACE.xs },
  back: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.xs,
    borderWidth: 1,
    borderRadius: RADIUS.pill,
    paddingVertical: 5,
    paddingHorizontal: SPACE.sm,
  },
  backText: { ...role(TYPE.control), fontWeight: '700' },
  /*
   * On the ground rather than on a surface, and that is the point of the band.
   *
   * Dressed as the bar above it, the two would read as one two-row bar and these
   * controls would look like chrome. They are not: the day being read belongs to
   * this screen. Standing on the same ground as the body below says so.
   */
  dayBand: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: SPACE.sm,
    paddingHorizontal: SPACE.md,
    paddingTop: SPACE.md,
    paddingBottom: SPACE.sm,
  },
  picker: { flex: 1, minWidth: 0 },
  step: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: RADIUS.md,
  },
  problem: { paddingHorizontal: SPACE.md, paddingBottom: SPACE.sm },
  body: { flex: 1 },
  bodyContent: { paddingHorizontal: SPACE.md, gap: SPACE.md },
  card: { borderWidth: 1, borderRadius: RADIUS.lg },
  dayCard: { padding: SPACE.md, gap: SPACE.xs },
  waitingSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.sm,
    padding: SPACE.md,
  },
  waitingCaret: { ...role(TYPE.note) },
  waitingLabel: { ...role(TYPE.rowName) },
  place: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.sm,
    paddingVertical: SPACE.xs + 2,
    paddingHorizontal: SPACE.sm,
  },
  placeName: { ...role(TYPE.rowName), flex: 1, minWidth: 0 },
  visited: {
    ...role(TYPE.label),
    overflow: 'hidden',
    borderRadius: RADIUS.pill,
    paddingVertical: 2,
    paddingHorizontal: SPACE.sm,
  },
  dayName: { ...role(TYPE.rowName) },
  dayEmpty: { ...role(TYPE.note) },
})
