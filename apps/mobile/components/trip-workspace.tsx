import MapPinPlus from 'lucide-react-native/icons/map-pin-plus'
import Search from 'lucide-react-native/icons/search'
import ChevronDown from 'lucide-react-native/icons/chevron-down'
import SlidersHorizontal from 'lucide-react-native/icons/sliders-horizontal'
import type { LucideIcon } from 'lucide-react-native'
import { signOut } from '@pinpoint/auth'
import type {
  City,
  FieldErrors,
  Marker,
  MarkerFilter,
  MarkerInterest,
  Trip,
  TripMember,
} from '@pinpoint/core'
import { isFiltered, matchesFilter, NO_FILTER } from '@pinpoint/core'
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
import { FALLBACK_MARKER_TYPE, type LngLat } from '@pinpoint/map'
import { RADIUS, SPACE, TYPE } from '@pinpoint/tokens'
import { type ReactNode, type Ref, useMemo, useRef, useState } from 'react'
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
import { MarkersOverlayNote } from '@/components/overlay-note'
import { PlaceSearchScreen } from '@/components/place-search'
import { FailedState, LoadingState } from '@/components/states'
import { TripMap, type TripMapRef } from '@/components/trip-map'
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
  | { kind: 'create'; position: LngLat; initial: MarkerFormValues }
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
  trip: storedTrip,
  trips,
  onSelectTrip,
  onTripsChanged,
  onCreated,
  userId,
}: {
  trip: Trip
  /**
   * Every trip this account belongs to, so one can be chosen without another
   * read. One is the ordinary case and will be for a long time.
   */
  trips: readonly Trip[]
  onSelectTrip: (tripId: string) => void
  /**
   * Ask for the trip list again, because this screen changed what is in it.
   *
   * Creating already had `onCreated`, which also chooses the new trip. Archiving
   * needs the re-read without the choosing: the person stays where the resolver
   * upstream puts them, which for the trip they just archived is the next one
   * along or the no-trips state.
   */
  onTripsChanged: () => void
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
   * A rename this device made, laid over the trip it was handed.
   *
   * Null means no local opinion, which is the same shape as every other override
   * here — nothing is copied, so a refetch is respected and there is nothing to
   * re-seed.
   */
  const [renamed, setRenamed] = useState<Trip | null>(null)
  const trip = renamed?.id === storedTrip.id ? renamed : storedTrip

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
  const [tripsOpen, setTripsOpen] = useState(false)
  const [archivedTrips, setArchivedTrips] = useState<readonly Trip[] | null>(null)
  const [citiesOpen, setCitiesOpen] = useState(false)
  const [peopleOpen, setPeopleOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [problem, setProblem] = useState<string | null>(null)

  /**
   * Markers this device has written, laid over what the query returned.
   *
   * The same shape as the overrides above and for the same reason — nothing is
   * copied, so nothing can go stale and a refetch is respected for free. `null`
   * means removed, which absence cannot express: absence is "no local opinion",
   * and having removed something is very much an opinion.
   *
   * Unlike `visitedWrites` these are written *after* the database agrees rather
   * than before it. A toggle that waited for a round trip would feel worse than
   * the spreadsheet this replaces; a save that appeared to succeed and then
   * vanished would be worse than either.
   */
  const [markerWrites, setMarkerWrites] = useState<ReadonlyMap<string, Marker | null>>(
    new Map(),
  )
  /** Cities this device has written, over the query, in the same shape. */
  const [cityWrites, setCityWrites] = useState<ReadonlyMap<string, City | null>>(
    new Map(),
  )

  const [panel, setPanel] = useState<Panel>({ kind: 'none' })
  const [sight, setSight] = useState<Sight>(null)
  const [busy, setBusy] = useState(false)
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
   * What the laptop gets from its selected city, which this platform does not
   * have. Adding several places in a row is the case that matters — walking a
   * neighbourhood, saving four things — and they are almost always the same city.
   *
   * In memory rather than stored: it lasts a session and starts empty on a cold
   * launch. See the note in the change's report; the specification says "on that
   * device", which is a stronger promise than this keeps.
   */
  const [lastCityId, setLastCityId] = useState<string | null>(null)

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

  /** People invited from this device, over what the query returned. */
  const [invited, setInvited] = useState<readonly TripMember[]>([])

  const members: readonly TripMember[] = useMemo(() => {
    const base = memberQuery.status === 'ready' ? memberQuery.data : []
    if (invited.length === 0) return base

    // Anything the query has caught up on is dropped from the overrides rather
    // than shown twice.
    const known = new Set(base.map((member) => member.id))
    return [...base, ...invited.filter((member) => !known.has(member.id))]
  }, [memberQuery, invited])
  /**
   * Which member the reader is, or null when their account matches none.
   *
   * Null is ordinary rather than broken: a member exists before the account
   * does. They can read the trip and see everyone's answers; they have nothing
   * to attribute an answer to, so no control is offered.
   */
  const ownMemberId = ownMemberOf(members, userId)?.id ?? null

  /** The stored cities, with this device's writes laid over them. */
  const cities: readonly City[] = useMemo(() => {
    const base = cityQuery.status === 'ready' ? cityQuery.data : []
    if (cityWrites.size === 0) return base

    const merged: City[] = []
    for (const city of base) {
      const written = cityWrites.get(city.id)
      if (written === null) continue
      merged.push(written ?? city)
    }
    // Cities created here, which the query has never seen.
    const known = new Set(base.map((city) => city.id))
    for (const [id, written] of cityWrites) {
      if (written !== null && !known.has(id)) merged.push(written)
    }
    return merged
  }, [cityQuery, cityWrites])

  const cityIds = useMemo(() => new Set(cities.map((city) => city.id)), [cities])

  const currencyOf = (marker: Marker) =>
    cities.find((city) => city.id === marker.cityId)?.currency ?? null

  /** The stored markers, with this device's writes laid over them. */
  const held = useMemo(() => {
    const base = markerQuery.status === 'ready' ? markerQuery.data : []

    const lay = (marker: Marker): Marker => {
      const withVisited = visitedWrites.has(marker.id)
        ? { ...marker, visited: visitedWrites.get(marker.id)! }
        : marker

      /*
        A marker filed under a city that no longer exists is unassigned, and that
        is derived rather than written down.

        Removing a city unassigns its markers in the database, and the screen has
        to say the same without re-reading the trip. Deriving it means no
        override per affected marker — sixteen of them for one removal — and no
        set of overrides to keep in agreement with the city list. A dangling
        reference simply cannot be displayed, because nothing can look it up.
      */
      return withVisited.cityId !== null && !cityIds.has(withVisited.cityId)
        ? { ...withVisited, cityId: null }
        : withVisited
    }

    const merged: Marker[] = []
    for (const marker of base) {
      const written = markerWrites.get(marker.id)
      if (written === null) continue
      merged.push(lay(written ?? marker))
    }
    const known = new Set(base.map((marker) => marker.id))
    for (const [id, written] of markerWrites) {
      if (written !== null && !known.has(id)) merged.push(lay(written))
    }
    return merged
  }, [markerQuery, visitedWrites, markerWrites, cityIds])

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

  /**
   * Where place search should look first.
   *
   * The visible map, always. Web can also derive this from the selected city's
   * markers; there is no selection here, so this takes the branch the
   * `place-search` specification names as the fallback — which is that
   * requirement being satisfied rather than an exception to it.
   *
   * A function behind a ref rather than a value, so that panning does not
   * re-render the search screen and re-running a query is not provoked by
   * nudging the map.
   *
   * Built once and never replaced. It closes over `centreRef` rather than over a
   * value, so it reads the current centre at the moment it is called without
   * anything having to keep it up to date — an earlier version reassigned it on
   * every render, which the React linter rejected outright and was right to.
   */
  const biasRef = useRef<() => SearchBias | undefined>(
    () => centreRef.current ?? undefined,
  )

  /** Starting a new place, from either entry path. */
  function beginCreate(position: LngLat, initial: Partial<MarkerFormValues>) {
    setFieldErrors({})
    setFormMessage(null)
    setConflict(null)
    setSight(null)
    setPanel({
      kind: 'create',
      position,
      initial: {
        name: '',
        note: null,
        // The city last filed under, which is almost always right when several
        // places are being added in a row, and one tap away when it is not.
        cityId: lastCityId,
        type: FALLBACK_MARKER_TYPE,
        link: null,
        price: null,
        ...initial,
      },
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

    setBusy(true)
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

    setBusy(false)

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
    setMarkerWrites((current) => new Map(current).set(saved.id, saved))
    // The stored row is now authoritative about this marker, including whether it
    // is visited, so an optimistic override for it would only be able to be
    // wrong from here on.
    setVisitedWrites((current) => withoutOverride(current, saved.id))
    setLastCityId(saved.cityId)
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
    const outcome = await deleteMarker(supabase, marker.id)
    if (!outcome.ok) {
      setProblem(
        outcome.kind === 'rejected' ? outcome.message : 'Could not remove that place.',
      )
      return
    }
    setMarkerWrites((current) => new Map(current).set(marker.id, null))
    cancelPanel()
  }

  async function renameTrip(name: string) {
    const previous = renamed
    setRenamed({ ...trip, name })

    const outcome = await updateTrip(supabase, trip.id, { name })
    if (!outcome.ok) {
      setRenamed(previous)
      setProblem(
        outcome.kind === 'rejected' ? outcome.message : 'Could not rename this trip.',
      )
      return
    }
    setRenamed(outcome.data)
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
   * `onTripsChanged` is what moves the person off a trip they just archived.
   * The list re-reads, the archived trip is no longer in it, and the resolver
   * upstream falls through to the first remaining one — or to the no-trips
   * state, which is the screen where a first trip is made. That fall-through
   * already existed for a trip left behind by other means; archiving simply
   * arrives at it by a new route.
   */
  async function setTripArchived(tripId: string, value: boolean) {
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
    onTripsChanged()
  }

  /** Archived trips, once somebody asks. Null until then. */
  async function revealArchived() {
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

    setInvited((current) => [...current, outcome.data])
    return null
  }

  async function addCity(name: string, currency: string | null) {
    const outcome = await createCity(supabase, { tripId: trip.id, name, currency })
    if (!outcome.ok) return null
    setCityWrites((current) => new Map(current).set(outcome.data.id, outcome.data))
    return outcome.data
  }

  async function patchCity(
    cityId: string,
    patch: { name?: string; currency?: string | null },
  ) {
    const outcome = await updateCity(supabase, cityId, patch)
    if (!outcome.ok) {
      setProblem(
        outcome.kind === 'rejected' ? outcome.message : 'Could not save that city.',
      )
      return
    }
    setCityWrites((current) => new Map(current).set(cityId, outcome.data))
  }

  async function removeCity(cityId: string) {
    const outcome = await deleteCity(supabase, cityId)
    if (!outcome.ok) {
      setProblem(
        outcome.kind === 'rejected' ? outcome.message : 'Could not remove that city.',
      )
      return
    }
    setCityWrites((current) => new Map(current).set(cityId, null))
    // Markers filed under it become unassigned without being written to — see the
    // derivation in `held`.
    if (lastCityId === cityId) setLastCityId(null)
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
        busy={busy}
        fieldErrors={fieldErrors}
        message={formMessage}
        notice={conflict}
        onSubmit={(values) => void save(values)}
        onCancel={cancelPanel}
        onAdjustPosition={adjustPosition}
        onCreateCity={addCity}
        onDelete={panel.kind === 'edit' ? () => confirmRemove(panel.marker) : undefined}
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
          onPress={() => setTripsOpen(true)}
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
          /*
            Tapping a saved place gives up on the one being added.

            `cancelPanel` already puts everything back: the form closes, the sight
            disarms, the draft position goes with the panel that held it, and the
            field errors clear. Nothing was stored, so the trip is exactly as it
            was — which is what the specification asks of abandoning.
          */
          onAbandonCapture={cancelPanel}
          confirmBar={
            <View style={styles.bottomRow}>
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
        onClose={() => setTripsOpen(false)}
        trip={trip}
        trips={trips}
        archived={archivedTrips}
        onRevealArchived={() => void revealArchived()}
        onSelectTrip={onSelectTrip}
        onRename={(name) => void renameTrip(name)}
        onCreated={onCreated}
        onSetArchived={(tripId, value) => void setTripArchived(tripId, value)}
        onOpenPeople={() => {
          setTripsOpen(false)
          setPeopleOpen(true)
        }}
        onOpenCities={() => {
          setTripsOpen(false)
          setCitiesOpen(true)
        }}
        busy={busy}
      />

      <MenuSheet
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        onSignOut={() => void signOut(supabase)}
        member={ownMemberOf(members, userId) ?? null}
      />

      <PeopleSheet
        open={peopleOpen}
        onClose={() => setPeopleOpen(false)}
        members={members}
        ownMemberId={ownMemberId}
        busy={busy}
        onInvite={invite}
      />

      <CitySheet
        open={citiesOpen}
        onClose={() => setCitiesOpen(false)}
        cities={cities}
        markers={held}
        onRename={(cityId, name) => void patchCity(cityId, { name })}
        onSetCurrency={(cityId, currency) => void patchCity(cityId, { currency })}
        onDelete={(cityId) => void removeCity(cityId)}
      />

      <PlaceSearchScreen
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        biasRef={biasRef}
        onChoose={(candidate: PlaceCandidate) => {
          const position = { lng: candidate.lng, lat: candidate.lat }
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
          mapRef.current?.flyTo(position, openingHeight(windowHeight))
          beginCreate(position, {
            name: candidate.name,
            type: candidate.typeGuess,
          })
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
  onAbandonCapture,
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
  mapRef: Ref<TripMapRef>
  centreRef: { current: LngLat | null }
  dropping: boolean
  draft: LngLat | null
  confirmBar: ReactNode
  formSheet: ReactNode
  formHeight: number
  onEditMarker: (marker: Marker) => void
  onDeleteMarker: (marker: Marker) => void
  onAbandonCapture: () => void
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
        ref={mapRef}
        centreRef={centreRef}
        dropping={dropping}
        draft={draft}
        confirmBar={confirmBar}
        formSheet={formSheet}
        formHeight={formHeight}
        onEditMarker={onEditMarker}
        onDeleteMarker={onDeleteMarker}
        onAbandonCapture={onAbandonCapture}
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
        <Glyph size={24} color={ink} strokeWidth={2} />
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
   * A third of the row each, and at least 44pt tall before the label is
   * measured. Vertical padding rather than a height, so a larger system text
   * size grows the button instead of clipping the word inside it — the same
   * reason the text fields take padding.
   */
  tool: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACE.xs,
    minHeight: 56,
    paddingTop: 9,
    paddingBottom: 7,
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
