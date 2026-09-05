import MapPinPlus from 'lucide-react-native/icons/map-pin-plus'
import Search from 'lucide-react-native/icons/search'
import ChevronDown from 'lucide-react-native/icons/chevron-down'
import SlidersHorizontal from 'lucide-react-native/icons/sliders-horizontal'
import type { LucideIcon } from 'lucide-react-native'
import { signOut } from '@pinpoint/auth'
import type {
  CityNotice,
  FieldErrors,
  Marker,
  MarkerFilter,
  MarkerInterest,
  Trip,
  TripMember,
} from '@pinpoint/core'
import {
  cityClaiming,
  cityNoticeFor,
  isFiltered,
  markersSelectedBy,
  matchesFilter,
  NO_FILTER,
  UNASSIGNED_CITY,
} from '@pinpoint/core'
import {
  createCity,
  createMarker,
  deleteCity,
  deleteMarker,
  fetchTripCities,
  fetchTripInterest,
  fetchTripMarkers,
  fetchTripMembers,
  inviteMember,
  ownMemberOf,
  recordInterest,
  setMarkerVisited,
  updateCity,
  updateMarker,
  fetchTrips,
  updateTrip,
  withdrawInterest,
} from '@pinpoint/data'
import type { PlaceCandidate, SearchBias } from '@pinpoint/geocode'
import {
  FALLBACK_MARKER_TYPE,
  fitBounds,
  type LngLat,
  markersAt,
} from '@pinpoint/map'
import { RADIUS, SPACE, TYPE } from '@pinpoint/tokens'
import {
  type ReactNode,
  type Ref,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { CitySheet } from '@/components/city-sheet'
import { FilterSheet } from '@/components/filter-sheet'
import {
  MarkerFormSheet,
  type MarkerFormValues,
  openingHeight,
} from '@/components/marker-form'
import { MenuSheet } from '@/components/menu-sheet'
import { TripSheet } from '@/components/trip-sheet'
import { PeopleSheet } from '@/components/people-sheet'
import { openingHeight as detailsOpeningHeight } from '@/components/marker-details'
import { MarkersOverlayNote } from '@/components/overlay-note'
import { PlaceSearchScreen } from '@/components/place-search'
import { FailedState, LoadingState } from '@/components/states'
import { TripMap, type TripMapRef } from '@/components/trip-map'
import { supabase } from '@/lib/supabase'
import { useTheme } from '@/lib/theme'
import { role } from '@/lib/type'
import { useActiveAgain } from '@/lib/use-active-again'
import { type Query, useQuery } from '@/lib/use-query'

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
 *
 * ## What a write says while it is happening
 *
 * Two answers, and which one a write takes is decided by the write rather than
 * by whoever is writing the call site:
 *
 * - **Optimistic** — one row, reversible, and the screen can draw the outcome
 *   before it is confirmed. Apply it at once, restore exactly what was there if
 *   the database refuses, and say that it was refused. Interest, visited,
 *   renaming a trip, archiving one, renaming a city or setting its currency.
 * - **Pending** — everything else: the outcome cannot be drawn in advance, what
 *   happens next depends on the stored row, or the act cannot be undone. The
 *   control says what it is doing and is inert until it settles. Saving a
 *   place, removing one, creating a city, removing one, inviting somebody,
 *   creating a trip. Revealing archived trips is a read and is treated the same
 *   way, because the press still has to be answered.
 *
 * The pending state lives in the control, never in this file. One flag here
 * meaning "a write is happening" cannot say *which*, so it disabled controls
 * that had nothing to do with what was in flight and left the responsible one
 * live — which is exactly what `busy` did to the rename and the invite on both
 * platforms, arrived at independently.
 */

/**
 * What is open over the map, said in values rather than in flags.
 *
 * `position` is held beside the form rather than inside it, because it is the
 * one thing the form cannot edit — it is corrected out at the sight and comes
 * back. Keeping it here is what lets a trip out to the map and back preserve
 * everything typed: the values go out with the panel and return unchanged.
 *
 * `marker` on an edit is the version the form was opened against. Its
 * `updatedAt` is what the stale-read check is made against, and it deliberately
 * survives a trip to the sight — re-reading it at save time would make the check
 * pass by construction and guarantee nothing.
 */
type Panel =
  | { kind: 'none' }
  | {
      kind: 'create'
      position: LngLat
      initial: MarkerFormValues
      /**
       * What the trip's cities said about where this place is, when it is worth
       * saying. Null for the ordinary case — near the city being worked in —
       * which is a requirement rather than a gap.
       */
      cityNotice: CityNotice | null
    }
  | { kind: 'edit'; marker: Marker; position: LngLat; initial: MarkerFormValues }

/**
 * What the sight is doing, and what it returns to.
 *
 * Two jobs rather than one. A fresh drop starts here and ends in a new form; a
 * correction arrives from a form that already exists and has to go back to it
 * with its values intact. Modelling the second as "dropping, but remember this"
 * is what stops a correction being indistinguishable from starting again.
 */
type Sight = { kind: 'new' } | { kind: 'adjusting'; panel: Panel } | null

function valuesOf(marker: Marker): MarkerFormValues {
  return {
    name: marker.name,
    note: marker.note,
    cityId: marker.cityId,
    type: marker.type,
    link: marker.link,
    price: marker.price,
  }
}

export function TripWorkspace({
  trip,
  trips: tripQuery,
  onSelectTrip,
  onCreated,
  userId,
}: {
  trip: Trip
  /**
   * Every trip this account belongs to, as the route's own query rather than as
   * a list copied out of it.
   *
   * The query itself, so that a rename made here lands in the one place the
   * trips are held and every screen reading them follows — and so that a write
   * which changes the list can ask for it again without the route inventing a
   * counter to be told through. It used to be a plain array plus an
   * `onTripsChanged` callback, which is the same two capabilities with a
   * hand-built channel between them.
   */
  trips: Query<Trip>
  onSelectTrip: (tripId: string) => void
  /**
   * A trip was made from in here. The route has to re-read its list before it
   * can show it, so this is more than a selection and is kept separate from one.
   */
  onCreated: (tripId: string) => void
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
  const windowHeight = useWindowDimensions().height

  /**
   * The trips this account is on, and the four lists this trip is made of.
   *
   * One place each, and everything on screen reads it. `trip` is resolved
   * upstream out of `tripQuery`, so a rename recorded into the query flows back
   * down through it — which is what makes the name in the header, the name in
   * the trips sheet and the name in the picker incapable of disagreeing.
   */
  const trips = tripQuery.rows

  const markerQuery = useQuery(() => fetchTripMarkers(supabase, trip.id), [trip.id])
  const cityQuery = useQuery(() => fetchTripCities(supabase, trip.id), [trip.id])
  const interestQuery = useQuery(() => fetchTripInterest(supabase, trip.id), [trip.id])
  const memberQuery = useQuery(() => fetchTripMembers(supabase, trip.id), [trip.id])

  const markers = markerQuery.rows
  const cities = cityQuery.rows
  const interest = interestQuery.rows
  const members = memberQuery.rows

  /**
   * Every list this screen shows, read again.
   *
   * Each declines if it was read inside `FRESH_FOR_MS`, so calling this twice in
   * a second costs one round of requests — the floor is held by the list rather
   * than by whatever asked, which is what stops the return trigger and a sheet
   * opening straight after it reading the same list twice.
   */
  const rereadEverything = (options?: { force?: boolean }) =>
    Promise.all([
      tripQuery.refetch(options),
      markerQuery.refetch(options),
      cityQuery.refetch(options),
      interestQuery.refetch(options),
      memberQuery.refetch(options),
    ])

  /*
    Coming back to the application is how somebody learns that the person they
    are planning with changed something. It is the only automatic trigger: no
    polling, no interval, and nothing holding a connection open.
  */
  useActiveAgain(() => void rereadEverything())

  const [filter, setFilter] = useState<MarkerFilter>(NO_FILTER)
  const [filterOpen, setFilterOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [tripsOpen, setTripsOpen] = useState(false)
  const [archivedTrips, setArchivedTrips] = useState<readonly Trip[] | null>(null)
  const [citiesOpen, setCitiesOpen] = useState(false)
  const [peopleOpen, setPeopleOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  /**
   * A refusal that belongs to no field, shown over the map.
   *
   * There is deliberately no flag beside it saying "a write is happening". One
   * boolean per screen cannot say *which* write, so it was passed to the trips
   * sheet and the people sheet and disabled a rename and an invite during a
   * marker save — while leaving both live during their own. Every pending state
   * now lives in the control that starts the write.
   */
  const [problem, setProblem] = useState<string | null>(null)

  /**
   * Opening or closing a surface ends whatever refusal belonged to the last one.
   *
   * A refusal is about the act that was just attempted, in the place it was
   * attempted — so it has no business outliving that place. Without this a
   * rename refused ten minutes ago reappeared the next time the sheet was
   * opened, attached to nothing the person was doing, which is its own way of
   * saying something untrue.
   *
   * Every sheet toggle goes through here rather than each one remembering, so a
   * sheet added later cannot forget.
   */
  function showSheet(
    open: (value: boolean) => void,
    value: boolean,
    reread?: () => Promise<unknown>,
  ) {
    setProblem(null)
    open(value)
    /*
      Opening a sheet is somebody saying "show me this", which is the return
      trigger at the scale of one list. It lands on the surfaces where a stale
      list is actually visible — the names in the trips sheet, the people in the
      people sheet — and needs no gesture and nothing to discover.

      Not forced, so it goes through the list's own freshness floor: opening a
      sheet straight after coming back to the application reads nothing.
    */
    if (value && reread) void reread()
  }

  /** The place whose removal has been confirmed and is now in flight. */
  const [removingId, setRemovingId] = useState<string | null>(null)

  const [panel, setPanel] = useState<Panel>({ kind: 'none' })
  const [sight, setSight] = useState<Sight>(null)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [formMessage, setFormMessage] = useState<string | null>(null)
  /**
   * Somebody else changed this place while it was being edited.
   *
   * Held apart from `formMessage` because it is not the same kind of event. A
   * message above a form means the form is wrong; this means the world moved,
   * which is nobody's mistake and calls for a different next action — look at
   * their version, then decide. Sharing one channel would make the two
   * indistinguishable exactly where the difference matters.
   */
  const [conflict, setConflict] = useState<string | null>(null)

  /**
   * The city a place was last filed under on this device.
   *
   * Which city is being worked on, or null for the whole trip.
   *
   * This replaced a remembered `lastCityId`, which existed only because this
   * platform could not express a city at all. Keeping both would give the capture
   * form two answers to one question and make one of them invisible: a selection
   * already defaults every subsequent save, and says so on screen while doing it.
   *
   * In memory rather than stored, deliberately. It lasts a session and starts
   * empty on a cold launch, which is exactly what `lastCityId` did. The laptop
   * keeps its selection in the address, so a reload and a shared link both
   * survive it and this does not — the two are honestly different rather than
   * accidentally so, and closing the gap means choosing a store, which is a
   * decision of its own recorded in `ROADMAP.md`.
   */
  const [selectedCityId, setSelectedCityId] = useState<string | null>(null)

  /**
   * How tall the open form is, so the map can lift its credit clear of it.
   *
   * Held here rather than in the map because the form reports it and the map
   * consumes it, and this is what sits between them. Zero when no form is open,
   * which is also what the map falls back to.
   */
  const [formHeight, setFormHeight] = useState(0)

  const mapRef = useRef<TripMapRef>(null)
  /**
   * Where the map is, written by the map on every settle.
   *
   * A ref rather than state: this changes on every frame a pan settles into, and
   * a re-render per frame would be absurd. Everything that reads it does so at
   * the moment of a press.
   */
  const centreRef = useRef<LngLat | null>(null)

  /**
   * Which member the reader is, or null when their account matches none.
   *
   * Null is ordinary rather than broken: a member exists before the account
   * does. They can read the trip and see everyone's answers; they have nothing
   * to attribute an answer to, so no control is offered.
   */
  const ownMemberId = ownMemberOf(members, userId)?.id ?? null

  /**
   * The city being worked on, resolved against the current rows every render.
   *
   * By id rather than by holding the row, so renaming a city updates the header
   * without anything having to push the new name into a second place — and so an
   * id whose city has gone resolves to null instead of a stale name.
   */
  const selectedCity = cities.find((city) => city.id === selectedCityId) ?? null

  /**
   * What the header calls the selection.
   *
   * Three states, so three names. Unassigned resolves to no city — it is defined
   * by the absence of one — and would otherwise fall through to `All places`,
   * which is the widest view rather than this narrow one and would leave the
   * header saying the opposite of what is on the map.
   */
  const selectionName =
    selectedCityId === UNASSIGNED_CITY
      ? 'Unassigned'
      : (selectedCity?.name ?? 'All places')

  const currencyOf = (marker: Marker) =>
    cities.find((city) => city.id === marker.cityId)?.currency ?? null

  /**
   * The markers, under whatever name the rest of this file knows them by.
   *
   * There used to be a merge here — the query's rows with five piles of local
   * writes laid over them, plus a derivation that unassigned any marker whose
   * city had gone. All of it existed because `useQuery` owned its result and
   * gave no way to change it, so a write had nowhere else to go. It has one
   * now, and the unassignment is written by the removal that causes it.
   */
  const held = markers

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
   * Optimistic, like the laptop: a toggle that waited for a round trip would
   * feel worse than the spreadsheet this replaces, and these are the writes made
   * most often in a row. Refused, they put back what was displayed.
   */
  async function answer(marker: Marker, interested: boolean) {
    if (ownMemberId === null) return

    // A new attempt supersedes the last refusal. Without this a note about a
    // write that failed a minute ago outlives the one that has just succeeded,
    // which leaves the screen saying something that is no longer true.
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
        // Nothing reads this, and stamping it here beats inventing a value the
        // stored row will overwrite on the next read anyway.
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

  /**
   * The markers filed under the city being worked on, or all of them.
   *
   * Every marker rather than the visible ones, because this answers "where is
   * this group" for search. Framing is the other question and takes the narrowed
   * set — see `selectCity`.
   */
  const cityMarkers = useMemo(
    () => markersSelectedBy(selectedCityId, held),
    [held, selectedCityId],
  )

  /**
   * Where place search should look first.
   *
   * The selected city's markers when it has any, and the visible map otherwise —
   * the same two branches as the laptop, and the same reason: the markers already
   * filed under a city say where that group is, so nothing has to resolve its
   * name. That is what keeps a city a label somebody chose rather than a
   * geographical claim. A city with nothing in it yet has no answer, and the
   * visible map is the next best one.
   *
   * A function behind a ref rather than a value, so that panning does not
   * re-render the search screen and re-running a query is not provoked by
   * nudging the map.
   *
   * The ref is written by an effect rather than reassigned during render. It
   * used to close over `centreRef` alone and never need replacing; now that it
   * closes over the selection as well, it has to be kept current, and doing that
   * in the render body is what the React linter rejects outright.
   */
  const computeBias = useCallback((): SearchBias | undefined => {
    if (selectedCityId !== null && cityMarkers.length > 0) {
      // Reuses the shared framing logic rather than averaging coordinates by
      // hand, which is also what keeps a group spanning the antimeridian from
      // being biased to the opposite side of the planet.
      return fitBounds(cityMarkers).center
    }
    return centreRef.current ?? undefined
  }, [selectedCityId, cityMarkers])

  const biasRef = useRef<() => SearchBias | undefined>(computeBias)
  useEffect(() => {
    biasRef.current = computeBias
  }, [computeBias])

  /**
   * Choosing which group of places is being worked on.
   *
   * Two consequences, and it used to be three: the camera re-frames and search
   * biases toward it. It no longer decides where the next save is filed — that
   * is decided by where the place actually is, because a selection is a
   * statement about what is being *looked at* and filing is about where a place
   * *is*. It does not filter either: hiding the rest would answer "what is near
   * what" with a lie, and the pins of other cities stay drawn wherever they fall
   * on screen.
   *
   * Framed on what is *visible* rather than on everything filed under the city:
   * framing to include markers a filter is hiding would zoom out to fit places
   * that are not drawn, and the empty margin would have no explanation.
   *
   * Computed from the city being selected rather than from `cityMarkers`, which
   * still reflects the selection as it was a moment ago.
   */
  function selectCity(cityId: string | null) {
    setSelectedCityId(cityId)

    const points = markersSelectedBy(cityId, visible)

    // Not told what covers the bottom edge: the toolbar was already there and
    // the map has already measured it, so it frames above it on its own. An
    // empty set moves nothing, which the map enforces.
    mapRef.current?.frameOn(points)
  }

  /**
   * Starting a new place, from either entry path.
   *
   * `reportedCity` is what the geocoding service called the city this place is
   * in, and is null for a position aimed at with the sight — which knows where
   * it is and nothing else. Both paths go through the same rule; only the name
   * half is missing from one of them.
   */
  function beginCreate(
    position: LngLat,
    initial: Partial<MarkerFormValues>,
    reportedCity: string | null = null,
  ) {
    setFieldErrors({})
    setFormMessage(null)
    setConflict(null)
    setSight(null)

    /*
     * Where this place actually is decides the city, not what is selected.
     *
     * Measured against `held` — the whole trip — and never `visible`. A filter
     * decides what is drawn and has never decided what the trip holds, so filing
     * a place differently because a filter was on would be a view setting
     * reaching into stored data.
     */
    const claim = cityClaiming(
      { ...position, city: reportedCity },
      cities,
      held,
    )

    setPanel({
      kind: 'create',
      position,
      initial: {
        name: '',
        note: null,
        cityId: claim.kind === 'one' ? claim.city.id : null,
        type: FALLBACK_MARKER_TYPE,
        link: null,
        price: null,
        ...initial,
      },
      cityNotice: cityNoticeFor(claim, selectedCityId),
    })
  }

  function cancelPanel() {
    setPanel({ kind: 'none' })
    setSight(null)
    setFieldErrors({})
    setFormMessage(null)
    setConflict(null)
  }

  /**
   * Out to the sight and back, with everything typed still in hand.
   *
   * The values come from the form rather than from what it was opened with, so a
   * name typed and then a position corrected keeps the name. The panel is put
   * away while the sight is up — the map has to be visible to be aimed — and the
   * sight carries it so that confirming or cancelling both know where to return.
   */
  function adjustPosition(values: MarkerFormValues) {
    const returning: Panel =
      panel.kind === 'edit'
        ? { ...panel, initial: values }
        : panel.kind === 'create'
          ? { ...panel, initial: values }
          : { kind: 'none' }

    setPanel({ kind: 'none' })
    setSight({ kind: 'adjusting', panel: returning })
  }

  /** What the sight is aimed at, or nothing if the map has not settled yet. */
  function confirmSight() {
    const position = centreRef.current
    if (!position || sight === null) return

    if (sight.kind === 'new') {
      beginCreate(position, {})
      return
    }

    const returning = sight.panel
    setSight(null)
    if (returning.kind === 'none') return
    setPanel({ ...returning, position })
  }

  function cancelSight() {
    const returning = sight?.kind === 'adjusting' ? sight.panel : null
    setSight(null)
    // A correction abandoned goes back to the form it came from, at the position
    // it already had. Only a fresh drop leaves nothing behind.
    if (returning && returning.kind !== 'none') setPanel(returning)
  }

  async function save(values: MarkerFormValues) {
    if (panel.kind === 'none') return

    setFieldErrors({})
    setFormMessage(null)
    setConflict(null)

    const outcome =
      panel.kind === 'edit'
        ? await updateMarker(
            supabase,
            panel.marker.id,
            { ...values, lng: panel.position.lng, lat: panel.position.lat },
            // The version this edit was based on, captured when the form was
            // opened and carried through any trip out to the sight. Re-reading it
            // here would make the check pass by construction.
            panel.marker.updatedAt,
          )
        : await createMarker(supabase, {
            ...values,
            tripId: trip.id,
            lng: panel.position.lng,
            lat: panel.position.lat,
          })

    if (!outcome.ok) {
      // Everything typed, and the marker's position, survive a rejection.
      // Retyping a name is a nuisance; re-finding a spot on a map is worse.
      if (outcome.kind === 'invalid-input') setFieldErrors(outcome.fieldErrors)
      else if (outcome.kind === 'conflict') setConflict(outcome.message)
      else setFormMessage(outcome.message)
      // The panel is left exactly as it was, so nothing typed is lost and the
      // map keeps showing what is actually stored.
      return
    }

    const saved = outcome.data
    markerQuery.set((rows) =>
      rows.some((marker) => marker.id === saved.id)
        ? rows.map((marker) => (marker.id === saved.id ? saved : marker))
        : [...rows, saved],
    )
    cancelPanel()
  }

  /**
   * Removing a place, confirmed and said plainly.
   *
   * "Cannot be undone" rather than a softer word, because it cannot: there is no
   * archive, no trash, and nothing that would let a member get a marker back.
   * The platform's destructive styling is a signal, not a substitute for saying
   * it.
   *
   * One function for both routes in — the details sheet and the form — so the
   * two cannot drift into asking differently about the same act.
   */
  function confirmRemove(marker: Marker) {
    Alert.alert(`Remove ${marker.name}?`, 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => void remove(marker),
      },
    ])
  }

  async function remove(marker: Marker) {
    setProblem(null)
    // Which marker, not whether something is happening. Held here rather than
    // in the two controls that offer this write, because on this platform the
    // write does not start when either of them is pressed — it starts when the
    // alert between them is answered, and the alert belongs here so that both
    // routes ask the same question in the same words. Keyed by id, so it can
    // only ever make the control for *this* place say anything.
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
    cancelPanel()
  }

  /**
   * Renaming the trip, into the one place the trips are held.
   *
   * The route resolves `trip` out of that list, so writing here is what makes
   * the header, the trips sheet and the picker follow at once — they all read
   * the same rows and there is no second copy for one of them to be showing.
   */
  async function renameTrip(name: string) {
    setProblem(null)

    const previous = trips
    tripQuery.set((rows) =>
      rows.map((each) => (each.id === trip.id ? { ...each, name } : each)),
    )

    const outcome = await updateTrip(supabase, trip.id, { name })
    if (!outcome.ok) {
      tripQuery.set(() => previous)
      setProblem(
        outcome.kind === 'rejected' ? outcome.message : 'Could not rename this trip.',
      )
      return
    }
    const saved = outcome.data
    tripQuery.set((rows) => rows.map((each) => (each.id === saved.id ? saved : each)))
  }

  /**
   * Archive a trip, or put one back.
   *
   * The same write as a rename underneath — one column on one row — so it takes
   * the same shape here: say it happened, and put it back if the database
   * refuses. What it does not do is ask first. Archiving is reversible by any
   * member, and a confirmation on a reversible action trains people to dismiss
   * confirmations on the ones that are not.
   *
   * Dropping the trip from the list is what moves the person off one they just
   * archived: the resolver upstream falls through to the first remaining trip —
   * or to the no-trips state, which is the screen where a first trip is made.
   * That fall-through already existed for a trip left behind by other means;
   * archiving simply arrives at it by a new route.
   *
   * A restore is asked for again rather than written, because the row being put
   * back is not in the list to be edited — it is in the archived reveal, which
   * this list has never held.
   */
  async function setTripArchived(tripId: string, value: boolean) {
    setProblem(null)

    const outcome = await updateTrip(supabase, tripId, { archived: value })
    if (!outcome.ok) {
      setProblem(
        outcome.kind === 'rejected'
          ? outcome.message
          : value
            ? 'Could not archive this trip.'
            : 'Could not restore this trip.',
      )
      return
    }
    // Dropped rather than kept in step: the reveal is re-read from the database
    // the next time it is asked for, so a restored trip cannot linger in it.
    setArchivedTrips(null)

    if (value) tripQuery.set((rows) => rows.filter((each) => each.id !== tripId))
    else void tripQuery.refetch({ force: true })
  }

  /**
   * Archived trips, once somebody asks. Null until then.
   *
   * A read rather than a write, and treated like one anyway: the press has to
   * be answered. Until this returned, the row was unchanged and pressing it
   * again fired a second fetch — the clearest press-that-does-nothing in either
   * application. What fills the gap while it loads is a separate question.
   */
  async function revealArchived() {
    setProblem(null)

    const state = await fetchTrips(supabase, { includeArchived: true })
    if (state.status === 'failed') {
      setProblem(state.message)
      return
    }
    const all = state.status === 'ready' ? state.data : []
    setArchivedTrips(all.filter((each) => each.archived))
  }

  /**
   * Add somebody to the trip.
   *
   * Returns the offending field rather than setting a message here, because the
   * sheet that called it is what has to mark it up — a duplicate address is a
   * fact about the email box, not about the trip.
   */
  async function invite(displayName: string, email: string) {
    const outcome = await inviteMember(supabase, {
      tripId: trip.id,
      displayName,
      email,
    })

    if (!outcome.ok) {
      if (outcome.kind === 'invalid-input') {
        const [field, message] = Object.entries(outcome.fieldErrors)[0] ?? [
          '_',
          'Could not add that person.',
        ]
        return { field, message }
      }
      return { field: '_', message: outcome.message }
    }

    memberQuery.set((rows) => [...rows, outcome.data])
    return null
  }

  /**
   * Making a city, from inside the form that needs one.
   *
   * Pending rather than optimistic, and it could not be otherwise: the form has
   * to select the row that comes back, and a row that does not exist yet has no
   * id to select. This was the one write on this platform that failed in
   * silence — it returned `null` and left the form to guess.
   */
  async function addCity(name: string, currency: string | null) {
    setProblem(null)

    const outcome = await createCity(supabase, { tripId: trip.id, name, currency })
    if (!outcome.ok) {
      setProblem(
        outcome.kind === 'rejected' ? outcome.message : 'Could not create that city.',
      )
      return null
    }
    cityQuery.set((rows) => [...rows, outcome.data])
    return outcome.data
  }

  /**
   * Renaming a city, or changing what its prices are read in.
   *
   * Optimistic, by the same rule as renaming a trip: one row, reversible, and
   * the list can show the new name at once.
   *
   * One call carries both fields. Two calls from one press could store the name
   * and have the currency refused, which is a half-applied edit that nothing on
   * screen could describe.
   */
  async function patchCity(
    cityId: string,
    patch: { name?: string; currency?: string | null },
  ) {
    setProblem(null)

    const previous = cities
    cityQuery.set((rows) =>
      rows.map((city) => (city.id === cityId ? { ...city, ...patch } : city)),
    )

    const outcome = await updateCity(supabase, cityId, patch)
    if (!outcome.ok) {
      cityQuery.set(() => previous)
      setProblem(
        outcome.kind === 'rejected' ? outcome.message : 'Could not save that city.',
      )
      return
    }
    const saved = outcome.data
    cityQuery.set((rows) => rows.map((city) => (city.id === cityId ? saved : city)))
  }

  async function removeCity(cityId: string) {
    setProblem(null)

    const outcome = await deleteCity(supabase, cityId)
    if (!outcome.ok) {
      setProblem(
        outcome.kind === 'rejected' ? outcome.message : 'Could not remove that city.',
      )
      return
    }
    cityQuery.set((rows) => rows.filter((city) => city.id !== cityId))
    /*
      The database unassigns the markers filed under it, and the screen has to
      say the same without re-reading the trip.

      Written here rather than derived from a dangling reference, which is what
      it used to be. Deriving it needed a merge between two lists to exist at
      all, and one list cannot hold a reference to a row that is no longer in
      the other one.
    */
    markerQuery.set((rows) =>
      rows.map((marker) =>
        marker.cityId === cityId ? { ...marker, cityId: null } : marker,
      ),
    )
    // Removing the city being worked on leaves nothing to be working on. The
    // whole trip comes back rather than the selection dangling at an id that no
    // longer resolves — and `selectCity` rather than the setter, so the camera
    // re-frames on what is left instead of staying pointed at a group that has
    // just been dissolved.
    if (selectedCityId === cityId) selectCity(null)
  }

  /**
   * The form, built here and drawn by the map.
   *
   * Handed down rather than rendered beside the map for the reason the bar and
   * the marker sheet already are: the bottom edge is choreographed, and a licence
   * credit has to stay legible above whatever is standing on it. Now that the
   * form is a sheet rather than a full screen, it is one of those things.
   */
  const formSheet =
    panel.kind === 'create' || panel.kind === 'edit' ? (
      <MarkerFormSheet
        // Remounted per place, so the fields re-seed from `initial` when a
        // different marker is opened. Without it, editing one place after
        // another would show the first one's values in the second one's form.
        key={panel.kind === 'edit' ? panel.marker.id : 'create'}
        title={panel.kind === 'edit' ? 'Edit this place' : 'Save this place'}
        initial={panel.initial}
        cities={cities}
        // Editing never carries one: the rule guesses where a place is filed as
        // it is saved, and re-guessing it while somebody corrects a note would
        // be the form arguing with a decision already made.
        cityNotice={panel.kind === 'create' ? panel.cityNotice : null}
        fieldErrors={fieldErrors}
        message={formMessage}
        notice={conflict}
        onSubmit={save}
        onCancel={cancelPanel}
        onAdjustPosition={adjustPosition}
        onCreateCity={addCity}
        onDelete={panel.kind === 'edit' ? () => confirmRemove(panel.marker) : undefined}
        removing={panel.kind === 'edit' && removingId === panel.marker.id}
        onHeight={setFormHeight}
      />
    ) : null

  return (
    <View style={[styles.screen, { backgroundColor: theme.colour.surface }]}>
      <View
        style={[
          styles.header,
          { borderColor: theme.colour.line, paddingTop: HEADER_PAD + insets.top },
        ]}
      >
        <View style={styles.headerLine}>
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
        {/*
          The name is the way into the trips, and the caret is what says so.

          A label that opens something and looks like a label is a control
          nobody finds. It is also the only element here that yields, so a long
          name truncates rather than pushing the menu off the edge.
        */}
        <Pressable
          onPress={() => showSheet(setTripsOpen, true, tripQuery.refetch)}
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
          style={{ marginLeft: 'auto' }}
        >
          <Text style={[styles.menuGlyph, { color: theme.colour.ink }]}>☰</Text>
        </Pressable>
        </View>

        {/*
          The city being worked in, on its own line under the trip it narrows.

          Under rather than beside, and that is the whole finding of the mock in
          this change's `mock/` folder. The laptop puts `Trip / City` on one row
          and it cannot come here: at 320pt two names that both want the row
          leave each other about eleven characters, so `Tokyo & Kyoto Honeymoon`
          and `Hiroshima & Miyajima` both become stubs and neither answers its
          question. Neither name has a length anybody promised — both are typed
          by a person — so the arrangement fails exactly where it matters.

          Still in the header rather than in the bar at the bottom. A city is a
          narrowing of the trip and reads as one only when it stands where the
          trip does; the bar holds the controls that act on the map, and this
          acts on what is being worked on.
        */}
        <View style={styles.cityLine}>
          <Pressable
            onPress={() => showSheet(setCitiesOpen, true, cityQuery.refetch)}
            accessibilityRole="button"
            accessibilityLabel={
              selectedCityId === null
                ? 'All places. Choose a city to work on'
                : `${selectionName}. Change which city you are working on`
            }
            hitSlop={6}
            style={styles.cityButton}
          >
            <Text
              style={[
                styles.cityName,
                {
                  // Naming the whole trip rather than standing empty, and drawn
                  // quieter than a city so the two states are told apart
                  // without reading the word.
                  color:
                    selectedCityId === null ? theme.colour.inkMuted : theme.colour.ink,
                },
              ]}
              numberOfLines={1}
            >
              {selectionName}
            </Text>
            <ChevronDown size={14} color={theme.colour.inkMuted} strokeWidth={2.4} />
          </Pressable>
        </View>
      </View>

      <View style={styles.body}>
        <Body
          mapRef={mapRef}
          centreRef={centreRef}
          dropping={sight !== null}
          draft={panel.kind === 'none' ? null : panel.position}
          formSheet={formSheet}
          formHeight={formHeight}
          onEditMarker={(marker) => {
            setFieldErrors({})
            setFormMessage(null)
            setConflict(null)
            setPanel({
              kind: 'edit',
              marker,
              position: { lng: marker.lng, lat: marker.lat },
              initial: valuesOf(marker),
            })
          }}
          onDeleteMarker={confirmRemove}
          removingId={removingId}
          /*
            Tapping a saved place gives up on the one being added.

            `cancelPanel` already puts everything back: the form closes, the sight
            disarms, the draft position goes with the panel that held it, and the
            field errors clear. Nothing was stored, so the trip is exactly as it
            was — which is what the specification asks of abandoning.
          */
          onAbandonCapture={cancelPanel}
          confirmBar={
            <View style={styles.confirmRow}>
              {/*
                What the sight is waiting for.

                Standing where the trip's controls stand, rather than beside
                them: the map is doing something other than what it usually does,
                and replacing the row says so more clearly than any label added
                to it would.
              */}
              <Pressable
                onPress={cancelSight}
                accessibilityRole="button"
                accessibilityLabel="Cancel"
                hitSlop={6}
                style={[styles.pill, { borderColor: theme.colour.lineStrong }]}
              >
                <Text style={[styles.filterText, { color: theme.colour.ink }]}>
                  Cancel
                </Text>
              </Pressable>

              <Text
                style={[styles.sightHint, { color: theme.colour.inkMuted }]}
                numberOfLines={2}
              >
                Move the map to put the place under the ring.
              </Text>

              <Pressable
                onPress={confirmSight}
                accessibilityRole="button"
                accessibilityLabel="Use this spot"
                hitSlop={6}
                style={[
                  styles.pill,
                  {
                    borderColor: theme.colour.accent,
                    backgroundColor: theme.colour.accentWash,
                  },
                ]}
              >
                <Text
                  style={[styles.clearText, { color: theme.colour.accentInk }]}
                  numberOfLines={1}
                >
                  Use this spot
                </Text>
              </Pressable>
            </View>
          }
          loading={markerQuery.state.status === 'loading'}
          failed={
            markerQuery.state.status === 'failed' ? markerQuery.state.message : null
          }
          total={held.length}
          visible={visible}
          held={held}
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
              {/*
                A toolbar, and deliberately not a tab bar.

                A tab bar switches between sections of an application; every one
                of these fires an action, and drawing them as tab items would
                promise navigation that does not exist. What was here before was
                four text pills of equal weight whose borders arrived only under
                a finger — quiet taken as far as absent, which is why it read as
                unfinished rather than as restrained.

                Three, not four: `Clear` has moved into the filter sheet, and the
                filter tool declares the narrowing in its place. Four targets
                across a phone leaves each one narrow, and `Clear` was the least
                earned of them — it does nothing at all most of the time.

                All three weigh the same. An earlier pass drew `Drop` in the
                accent, on the argument that dropping a pin is what somebody
                opened the application to do while standing in a street. It was
                rejected on sight and the reason is the durable part: this row
                sits over a map whose pins are the only saturated colour in the
                system, and a fourth amber thing at the bottom competes with what
                it is meant to be serving.
              */}
              <Tool
                label="Search"
                hint="Search for a place"
                icon={Search}
                onPress={() => setSearchOpen(true)}
              />
              <Tool
                label="Drop"
                hint="Drop a pin on the map"
                icon={MapPinPlus}
                onPress={() => {
                  cancelPanel()
                  setSight({ kind: 'new' })
                }}
              />
              {/*
                Sliders rather than a funnel. A funnel says "narrow a list";
                sliders says "options you can change", which is what this opens.

                It carries the declaration `Clear` used to carry, by the accent
                *and* a dot — two signals, because a state that survives only in
                hue survives neither a greyscale screen nor a colour-blind
                reader, which is the same rule that keeps a visited marker from
                being recoloured.
              */}
              <Tool
                label="Filter"
                hint={
                  narrowed
                    ? 'Filter this trip. Some places are hidden'
                    : 'Filter this trip'
                }
                icon={SlidersHorizontal}
                marked={narrowed}
                onPress={() => setFilterOpen(true)}
              />
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

      <TripSheet
        open={tripsOpen}
        onClose={() => showSheet(setTripsOpen, false)}
        trip={trip}
        trips={trips}
        archived={archivedTrips}
        onRevealArchived={revealArchived}
        onSelectTrip={onSelectTrip}
        onRename={renameTrip}
        onCreated={onCreated}
        onSetArchived={(tripId, value) => void setTripArchived(tripId, value)}
        onOpenPeople={() => {
          showSheet(setTripsOpen, false)
          showSheet(setPeopleOpen, true, memberQuery.refetch)
        }}
        // The same refusal the map shows, handed to the sheet covering it. One
        // piece of state, rendered wherever the person actually is.
        problem={problem}
        onDismissProblem={() => setProblem(null)}
      />

      <MenuSheet
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        onSignOut={() => void signOut(supabase)}
        onRefresh={() => rereadEverything({ force: true })}
        member={ownMemberOf(members, userId) ?? null}
      />

      <PeopleSheet
        open={peopleOpen}
        onClose={() => showSheet(setPeopleOpen, false)}
        members={members}
        ownMemberId={ownMemberId}
        onInvite={invite}
      />

      <CitySheet
        open={citiesOpen}
        onClose={() => showSheet(setCitiesOpen, false)}
        cities={cities}
        markers={held}
        selectedCityId={selectedCityId}
        onSelect={selectCity}
        onSave={patchCity}
        onDelete={removeCity}
        problem={problem}
        onDismissProblem={() => setProblem(null)}
      />

      <PlaceSearchScreen
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        biasRef={biasRef}
        onChoose={(candidate: PlaceCandidate) => {
          const position = { lng: candidate.lng, lat: candidate.lat }

          /*
            Does the trip already hold this place?

            Asked against `held` and never `visible`. A filter decides what the
            map draws; it has never decided what the trip contains, and matching
            the drawn set would let a view setting produce the very duplicate
            this is here to prevent — narrow to food, search a saved temple, get
            a second temple.

            The match is exact, and `markersAt` is where that is written down.
            What it deliberately does not catch — a marker repositioned after
            saving, one dropped by pointing — falls through to a capture and
            behaves exactly as it did before.
          */
          const found = markersAt(position, held)
          /*
            Moved to, because a searched place is usually not on screen — that is
            generally why somebody searched. Leaving the camera still would put
            the place they just chose somewhere they cannot see, and then ask
            them to save it.

            A dropped pin is the opposite case and gets no movement: it is by
            definition somewhere they were already looking.
          */
          // Told where the sheet will be, not where it is: the form opens in the
          // same breath as this and does not exist yet to be measured. Without
          // it the camera centres the place on the middle of the map view, which
          // is the part the sheet is about to cover.
          /*
            Told what will cover the map, on both branches.

            This was written to pass nothing here, reasoning that a details
            sheet is not the form and does not cover as much. Looking at it
            settled that: the sheet sat squarely on top of the pin. The form
            opens at 52% of the window and this sheet is capped at 50% — at the
            sizes that matter they are the same thing, and the difference the
            argument rested on does not exist.

            Each branch asks the sheet that is about to open, rather than one
            borrowing the other's number. They are close today and nothing keeps
            them that way.
          */
          if (found) {
            mapRef.current?.flyTo(position, detailsOpeningHeight(windowHeight))
            mapRef.current?.openMarkers(
              found.key,
              found.markers.map((marker) => marker.id),
            )
            return
          }

          mapRef.current?.flyTo(position, openingHeight(windowHeight))
          beginCreate(
            position,
            { name: candidate.name, type: candidate.typeGuess },
            candidate.city,
          )
        }}
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
  mapRef,
  centreRef,
  dropping,
  draft,
  confirmBar,
  formSheet,
  formHeight,
  onEditMarker,
  onDeleteMarker,
  removingId,
  onAbandonCapture,
  loading,
  failed,
  total,
  visible,
  held,
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
  mapRef: Ref<TripMapRef>
  centreRef: { current: LngLat | null }
  dropping: boolean
  draft: LngLat | null
  confirmBar: ReactNode
  formSheet: ReactNode
  formHeight: number
  onEditMarker: (marker: Marker) => void
  onDeleteMarker: (marker: Marker) => void
  /** The place whose removal is in flight, so its control can say so. */
  removingId: string | null
  onAbandonCapture: () => void
  loading: boolean
  failed: string | null
  total: number
  visible: readonly Marker[]
  /**
   * Everything the trip holds. Passed through to the map for one lookup — a
   * sheet opened by identity may name a place the filter is hiding — and never
   * drawn from.
   */
  held: readonly Marker[]
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
        ref={mapRef}
        centreRef={centreRef}
        dropping={dropping}
        draft={draft}
        confirmBar={confirmBar}
        formSheet={formSheet}
        formHeight={formHeight}
        onEditMarker={onEditMarker}
        onDeleteMarker={onDeleteMarker}
        removingId={removingId}
        onAbandonCapture={onAbandonCapture}
        bottomRow={bottomRow}
        markers={visible}
        held={held}
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

/** A tool's glyph, and the room above and below the pair it makes with its label. */
const TOOL_GLYPH = 24
const TOOL_PAD_TOP = 9
const TOOL_PAD_BOTTOM = 7

/**
 * The height of whatever stands on the bottom edge.
 *
 * One number rather than two, because the toolbar and the sight's confirm row
 * swap places in the same slot: a shorter confirm row made the bar shrink under
 * the thumb at the moment the map was asking for a decision, which read as the
 * chrome flinching.
 *
 * Derived rather than chosen, because it has to be the height a tool already
 * comes to on its own. A tool is laid out from its parts, and a minimum below
 * their sum changes nothing — which is how a round 56 that read as
 * authoritative still left the confirm row two points short of the toolbar it
 * replaces. Both rows take this as a minimum, so a larger system text size
 * grows whichever one is standing there rather than clipping it.
 */
const BAR_HEIGHT =
  TOOL_PAD_TOP +
  TOOL_GLYPH +
  SPACE.xs +
  TYPE.label.size * TYPE.label.lineHeight +
  TOOL_PAD_BOTTOM

/**
 * One button in the bottom toolbar.
 *
 * A glyph above its own label, filling a third of the row. The label is not
 * decoration: an icon alone is a guess, and `sliders` in particular is a
 * convention rather than a picture of the thing it opens.
 *
 * `hint` is what a screen reader is told and is allowed to say more than the
 * label shows — "Filter this trip. Some places are hidden" is the narrowed
 * state reaching somebody who cannot see the dot.
 */
function Tool({
  label,
  hint,
  icon: Glyph,
  marked = false,
  onPress,
}: {
  label: string
  hint: string
  icon: LucideIcon
  /** Whether this tool is declaring a state — today, that a filter is applied. */
  marked?: boolean
  onPress: () => void
}) {
  const theme = useTheme()
  const ink = marked ? theme.colour.accentInk : theme.colour.inkMuted

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={hint}
      style={styles.tool}
    >
      <View>
        <Glyph size={TOOL_GLYPH} color={ink} strokeWidth={2} />
        {/*
          The second signal. The accent alone would be a state carried by hue,
          which this project forbids; a dot is a shape that survives greyscale.
          Ringed in the bar's own surface so it reads as sitting on top of the
          glyph rather than as part of it.
        */}
        {marked ? (
          <View
            style={[
              styles.pip,
              {
                backgroundColor: theme.colour.accent,
                borderColor: theme.colour.surface,
              },
            ]}
          />
        ) : null}
      </View>
      <Text style={[styles.toolLabel, { color: ink }]} numberOfLines={1}>
        {label}
      </Text>
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
  /** The trip, the mark, and the way out. What used to be the whole header. */
  headerLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.sm,
  },
  /*
   * Indented to clear the mark, so the city hangs off the trip's name rather
   * than starting a second column. `flexDirection` so the control shrinks to
   * its label instead of spanning the width, which would read as a field.
   */
  cityLine: { flexDirection: 'row', paddingLeft: 9 + SPACE.sm, marginTop: 1 },
  /*
   * The trip's name one step down, and deliberately not a pill.
   *
   * This was a filled, outlined pill and it was wrong twice over. It was an
   * *off-spec* pill — `DESIGN.md` gives a selector pill a transparent border
   * held in reserve for hover, 7×11 padding and `control` type, and this had a
   * border drawn at rest, its own padding and `rowName` — so it read as a third
   * thing nobody had designed. And a pill does not belong here at all: DESIGN.md
   * scopes them to "the toolbar and the bottom bar", and this header's own idiom
   * is already a name with a caret.
   *
   * There is also a miscue to avoid. An outlined chip is what a filter chip
   * looks like everywhere else, and it would sit two inches above `Filter` while
   * naming a control that deliberately hides nothing.
   *
   * So it mirrors `tripButton` exactly — same padding, no fill, no border — and
   * the hierarchy is carried by size and weight alone: `rowName` under the
   * title, which is the nearest role below it. The laptop reaches the same
   * arrangement from the other direction: both its trip and city triggers are
   * `tone="quiet"`, so this is the one shape where the two platforms agree about
   * the *relationship* between the two controls rather than only about each.
   */
  cityButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.xs,
    flexShrink: 1,
    paddingVertical: SPACE.xs,
    paddingRight: SPACE.xs,
  },
  cityName: { ...role(TYPE.rowName), flexShrink: 1 },
  dot: { width: 9, height: 9, borderRadius: 5 },
  // Carries the prominence the wordmark used to, and stays the only element
  // that yields, so a long name truncates instead of pushing the menu off.
  tripName: { ...role(TYPE.title), flexShrink: 1 },
  tripButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flexShrink: 1,
    paddingVertical: SPACE.xs,
    paddingRight: SPACE.xs,
  },
  menuGlyph: { fontSize: 19, lineHeight: 22 },

  /*
   * The contents of the row a thumb reaches. The bar behind it belongs to the
   * map, which owns this edge; this is only what stands on it.
   */
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  /*
   * A third of the row each, and `BAR_HEIGHT` tall — which is derived from
   * exactly these parts, so the minimum is the height a tool reaches anyway and
   * binds only on the row that replaces this one. Vertical padding rather than
   * a height, so a larger system text size grows the button instead of clipping
   * the word inside it — the same reason the text fields take padding.
   */
  tool: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACE.xs,
    minHeight: BAR_HEIGHT,
    paddingTop: TOOL_PAD_TOP,
    paddingBottom: TOOL_PAD_BOTTOM,
    paddingHorizontal: SPACE.xs,
  },
  toolLabel: { ...role(TYPE.label), textTransform: 'none', letterSpacing: 0.07 },
  pip: {
    position: 'absolute',
    top: -1,
    right: -5,
    width: 7,
    height: 7,
    borderRadius: 4,
    borderWidth: 2,
  },
  /*
   * The sight's confirm row, standing in the same slot as the toolbar.
   *
   * Centred rather than stretched, because these are pills and a pill stretched
   * to the height of the bar puts its own label at the top of itself. The
   * horizontal inset is the row's, not the buttons': the toolbar's thirds run
   * edge to edge and are read as one band, whereas two pills hard against the
   * screen's corners read as having fallen off it.
   *
   * The gap matches that inset, so the sentence is held off the two controls by
   * as much as they are held off the screen. It is the only element here that
   * yields, so widening the gap narrows the sentence rather than moving a
   * button — which is what keeps `Cancel` and `Use this spot` where a thumb
   * last found them.
   */
  confirmRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: BAR_HEIGHT,
    paddingHorizontal: SPACE.md,
    gap: SPACE.md,
  },
  /* Kept for the sight's confirm row, which still uses pills. */
  pill: {
    borderWidth: 1,
    borderRadius: RADIUS.pill,
    paddingVertical: 7,
    paddingHorizontal: 13,
    maxWidth: 150,
  },
  filterText: { ...role(TYPE.control) },
  // The only element in the confirm bar that yields, so the two controls keep
  // their size and the sentence between them wraps instead of pushing one off.
  sightHint: { ...role(TYPE.note), flex: 1, textAlign: 'center' },
  // Two states of one control. They differ by weight and by border as well as
  // by colour, so the declaration survives a greyscale screen and a
  // colour-blind reader — the same reason a visited marker is drawn visited
  // without changing colour.
  clearText: { ...role(TYPE.control), fontWeight: '700' },
  clearTextInert: { ...role(TYPE.control), fontWeight: '400' },
  body: { flex: 1 },
})
