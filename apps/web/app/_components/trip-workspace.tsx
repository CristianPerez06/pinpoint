'use client'

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
  fetchTrips,
  inviteMember,
  recordInterest,
  setMarkerVisited,
  updateCity,
  updateMarker,
  updateTrip,
  withdrawInterest,
} from '@pinpoint/data'
import type { PlaceCandidate, SearchBias } from '@pinpoint/geocode'
import {
  DEFAULT_VIEWPORT,
  FALLBACK_MARKER_TYPE,
  fitBounds,
  groupCoincident,
  type LngLat,
  type MarkerGroup,
} from '@pinpoint/map'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { CityBar } from '@/app/_components/city-bar'
import { FilterBar } from '@/app/_components/filter-bar'
import { MarkerDetails } from '@/app/_components/marker-details'
import {
  MarkerForm,
  type MarkerFormValues,
} from '@/app/_components/marker-form'
import { PlaceSearch } from '@/app/_components/place-search'
import { TripBar } from '@/app/_components/trip-bar'
import { MapOverlayNote } from '@/app/_components/states'
import { type DraftPosition, TripMap } from '@/app/_components/trip-map'
import { Button } from '@/app/_components/ui'
import { createClient } from '@/lib/supabase/client'
import { useRows } from '@/lib/use-rows'
import { useVisibleAgain } from '@/lib/use-visible-again'

import styles from './trip-workspace.module.css'

/**
 * Everything a trip's map can be doing, in one place.
 *
 * The markers arrive from the server render and become client state from there,
 * because a saved place has to appear immediately and re-reading the whole trip
 * to add one row is a poor trade. That is the real cost of writing from the
 * browser rather than through a server action, and it is worth it: an action
 * would mean a round trip plus a revalidation that re-fetches every marker.
 *
 * Writes go through `@pinpoint/data` with the browser client. There is no secret
 * involved and row-level security is the authorization either way, so the only
 * thing a server hop would add is latency.
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

type Panel =
  | { kind: 'none' }
  /**
   * What is open, said in identities rather than in positions.
   *
   * `groupKey` is the point that was clicked and `markerId` is which place on it
   * is being read, or null while several are still being chosen between. Neither
   * is a snapshot, so the card re-resolves against current state every render.
   *
   * Positions would be wrong here, and were: a filter routinely shrinks a group
   * out from under an open card, and an index into the shrunken group points at
   * a different place than the one somebody opened. Removal could already do
   * that; filtering makes it ordinary rather than exceptional.
   */
  | { kind: 'details'; groupKey: string; markerId: string | null }
  | { kind: 'create'; initial: MarkerFormValues }
  | { kind: 'edit'; marker: Marker; initial: MarkerFormValues }

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
  trip: initialTrip,
  trips: storedTrips,
  initialMarkers,
  initialCities,
  members: initialMembers,
  initialInterest,
  ownMemberId,
  notice,
}: {
  trip: Trip
  /**
   * Every trip this account belongs to, so one can be chosen without another
   * read. One is the ordinary case and will be for a long time.
   */
  trips: readonly Trip[]
  initialMarkers: readonly Marker[]
  initialCities: readonly City[]
  members: readonly TripMember[]
  initialInterest: readonly MarkerInterest[]
  /**
   * Which member the reader is, or null when their account matches none.
   *
   * Null is ordinary rather than broken: a member exists before the account
   * does. They can read the trip and see everyone's answers; they have nothing
   * to attribute an answer to, so no control is offered.
   */
  ownMemberId: string | null
  /**
   * What the initial read of the markers did, when it did not produce any. The
   * map still renders — it is fine either way — and only this note distinguishes
   * a trip with nothing on it from a trip that would not load.
   */
  notice: { tone: 'muted' | 'danger'; text: string } | null
}) {
  const supabase = useMemo(() => createClient(), [])
  const router = useRouter()
  const searchParams = useSearchParams()

  /**
   * The trip, its name, and the people on it — client state now, because all
   * three can change without leaving the page.
   *
   * The server hands them down once and this owns them from there, which is the
   * same trade the markers make: a rename or an invitation has to show
   * immediately, and re-reading the whole trip to see one row change is a poor
   * exchange.
   */
  const [trips, setTrips, refreshTrips] = useRows<Trip>(storedTrips)
  const [members, setMembers, refreshMembers] = useRows<TripMember>(initialMembers)
  const [markers, setMarkers, refreshMarkers] = useRows<Marker>(initialMarkers)
  const [cities, setCities, refreshCities] = useRows<City>(initialCities)
  const [interest, setInterest, refreshInterest] =
    useRows<MarkerInterest>(initialInterest)

  /**
   * The trip being looked at, out of the list that holds it.
   *
   * Derived rather than held beside the list, which is what it used to be —
   * and the two then disagreed the moment it was renamed, because the picker
   * read one and the name read the other. One place, and everything on screen
   * reads it.
   *
   * Falling back to what the server resolved covers the trip having left the
   * list under a re-read: somebody else archived it. Going on showing the trip
   * that is open beats emptying the screen out from under whoever is looking at
   * it, and the next navigation resolves it properly.
   */
  const trip = trips.find((each) => each.id === initialTrip.id) ?? initialTrip
  /**
   * Unfiltered, and not persisted anywhere.
   *
   * A trip opens showing everything because the interest choices do not
   * partition it — a place both of you declined matches none of them — so an
   * unfiltered view is the only thing that guarantees every marker stays
   * reachable. Remembering a filter across reloads would mean opening a trip
   * that appears to have lost places, for a reason nobody can see.
   */
  const [filter, setFilter] = useState<MarkerFilter>(NO_FILTER)
  /**
   * Whether the map has anything drawn inside its current view.
   *
   * True until the map says otherwise, so that nothing is claimed before there
   * is a camera to claim it about.
   */
  const [anyInView, setAnyInView] = useState(true)
  const [panel, setPanel] = useState<Panel>({ kind: 'none' })
  const [dropping, setDropping] = useState(false)
  const [draft, setDraft] = useState<DraftPosition | null>(null)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  /**
   * A refusal that belongs to no field: the database said no to the act.
   *
   * There is deliberately no flag here saying "a write is happening". One
   * boolean per workspace cannot say *which* write, so it disabled controls
   * that had nothing to do with what was in flight and left the responsible one
   * live — which is what `busy` did to the rename and the invite until this
   * change. Every pending state now lives in the control that starts the write.
   */
  const [message, setMessage] = useState<string | null>(null)
  /**
   * Somebody else changed this place while it was being edited.
   *
   * Held apart from `message` because it is not the same kind of event. A
   * message above a form means the form is wrong; this means the world moved,
   * which is nobody's mistake and calls for a different next action — look at
   * their version, then decide. Sharing one channel would make the two
   * indistinguishable exactly where the difference matters.
   */
  const [conflict, setConflict] = useState<string | null>(null)
  /**
   * What the camera has been asked to show, and how many times it has been
   * asked. Nothing else moves it.
   *
   * Points rather than markers, because the two requests come from different
   * places and want the same treatment: a city's saved markers, and the single
   * position of a place just chosen from search. The token is what distinguishes
   * "somebody asked again" from "this array is a new object", which re-renders
   * produce constantly.
   */
  const [cameraTarget, setCameraTarget] = useState<{
    points: readonly LngLat[]
    token: number
  }>({ points: initialMarkers, token: 0 })

  const centreRef = useRef<DraftPosition | null>(null)

  /**
   * Every list this screen shows, read again.
   *
   * Each declines if it was read inside `FRESH_FOR_MS`, so calling this twice
   * in a second costs one round of requests — the floor is held by the list
   * rather than by whatever asked, which is what stops coming back to the tab
   * and opening a panel straight afterwards reading the same list twice.
   */
  function rereadEverything(options?: { force?: boolean }) {
    return Promise.all([
      refreshTrips(() => fetchTrips(supabase), options),
      refreshMarkers(() => fetchTripMarkers(supabase, trip.id), options),
      refreshCities(() => fetchTripCities(supabase, trip.id), options),
      refreshInterest(() => fetchTripInterest(supabase, trip.id), options),
      refreshMembers(() => fetchTripMembers(supabase, trip.id), options),
    ])
  }

  /*
    Coming back to the tab is how somebody learns that the person they are
    planning with changed something. It is the only automatic trigger: no
    polling, no interval, and nothing holding a connection open.
  */
  useVisibleAgain(() => void rereadEverything())

  // The selection lives in the URL so it survives a reload and can be linked.
  const selectedCityId = searchParams.get('city')

  const interestFor = useCallback(
    (marker: Marker) => interest.filter((record) => record.markerId === marker.id),
    [interest],
  )

  /**
   * One narrowed set, computed once and used by everything that shows a marker.
   *
   * Deliberately upstream of the grouping rather than applied per view: the map
   * and the card's chooser both read from `groups`, so filtering here is what
   * makes it impossible for them to disagree about what the trip contains. A
   * predicate applied twice is a predicate that eventually gets applied
   * differently.
   *
   * What each choice selects is decided in `@pinpoint/core`, not here, so the
   * phone will narrow the same trip to the same places without either
   * application owning the definition.
   */
  const visibleMarkers = useMemo(
    () =>
      markers.filter((marker) => matchesFilter(marker, interestFor(marker), filter)),
    [markers, interestFor, filter],
  )

  const groups = useMemo(
    () => groupCoincident([...visibleMarkers]),
    [visibleMarkers],
  )

  /**
   * What the open card is looking at, re-resolved against current state on every
   * render rather than read back from what was captured at click time.
   *
   * The panel used to store the group itself, which is a snapshot: marking a
   * place visited updated `markers`, the map redrew from the new groups, and the
   * card went on rendering the marker as it had been a moment earlier — the pin
   * faded while the button beside it still said "Mark visited".
   *
   * Resolving the marker by id rather than by position closes the other half of
   * that. A group can shrink under an open card — a filter hides one of the
   * places sharing the point, or another member removes it — and an index into
   * the shrunken group silently addresses a different place.
   *
   * Null when what was open is no longer there, and the card closes rather than
   * showing something else in its place.
   */
  const open = useMemo(() => {
    if (panel.kind !== 'details') return null

    const group = groups.find((each) => each.key === panel.groupKey)
    if (!group) return null

    if (panel.markerId === null) return { group, index: null }

    const index = group.markers.findIndex((marker) => marker.id === panel.markerId)
    return index === -1 ? null : { group, index }
  }, [panel, groups])

  /**
   * A refusal with no form to sit above.
   *
   * The form renders `message` itself when it is open, which is the closer
   * place to say it; this is every other write's failure, which until now had
   * nowhere on this screen to appear at all.
   */
  const refusal =
    panel.kind === 'create' || panel.kind === 'edit' ? null : message

  const cityMarkers = useMemo(
    () =>
      selectedCityId === null
        ? markers
        : markers.filter((marker) => marker.cityId === selectedCityId),
    [markers, selectedCityId],
  )

  /**
   * Where place search should look first.
   *
   * The markers already filed under the selected city say where that group is,
   * so nothing has to resolve its name — which is what makes a city a label
   * somebody chose rather than a geographical claim. A city with nothing in it
   * yet has no answer, and the visible map is the next best one.
   *
   * A ref because the map's centre changes on every pan, and re-rendering the
   * search box for each frame of a drag would be absurd.
   */
  const computeBias = useCallback((): SearchBias | undefined => {
    if (selectedCityId !== null && cityMarkers.length > 0) {
      // Reuses the shared framing logic rather than averaging coordinates by
      // hand, which is also what keeps a group spanning the antimeridian from
      // being biased to the opposite side of the planet.
      return fitBounds([...cityMarkers], { viewport: DEFAULT_VIEWPORT }).center
    }
    return centreRef.current ?? undefined
  }, [selectedCityId, cityMarkers])

  const biasRef = useRef<() => SearchBias | undefined>(computeBias)
  useEffect(() => {
    biasRef.current = computeBias
  }, [computeBias])

  const currencyOf = useCallback(
    (marker: Marker) =>
      cities.find((city) => city.id === marker.cityId)?.currency ?? null,
    [cities],
  )

  /**
   * Recording an answer, and putting it back if the database disagrees.
   *
   * Optimistic, like saving and removing a place already are: a toggle that
   * waited for a round trip would feel worse than the spreadsheet this replaces.
   * The previous records are captured before the change so the revert restores
   * exactly what was there, rather than guessing at what to undo.
   */
  async function answer(marker: Marker, interested: boolean) {
    if (ownMemberId === null) return

    // A new attempt supersedes the last refusal. Without this a note about a
    // write that failed a minute ago outlives the one that has just succeeded,
    // which leaves the screen saying something that is no longer true.
    setMessage(null)

    const previous = interest
    const optimistic: MarkerInterest = {
      markerId: marker.id,
      memberId: ownMemberId,
      interested,
      updatedAt: new Date().toISOString(),
    }

    setInterest((current) => [
      ...current.filter(
        (record) =>
          !(record.markerId === marker.id && record.memberId === ownMemberId),
      ),
      optimistic,
    ])

    const outcome = await recordInterest(supabase, {
      markerId: marker.id,
      memberId: ownMemberId,
      interested,
    })

    if (!outcome.ok) {
      setInterest(previous)
      setMessage(
        outcome.kind === 'rejected' ? outcome.message : 'Could not save that.',
      )
    }
  }

  async function unanswer(marker: Marker) {
    if (ownMemberId === null) return

    setMessage(null)

    const previous = interest
    setInterest((current) =>
      current.filter(
        (record) =>
          !(record.markerId === marker.id && record.memberId === ownMemberId),
      ),
    )

    const outcome = await withdrawInterest(supabase, marker.id, ownMemberId)
    if (!outcome.ok) {
      setInterest(previous)
      setMessage(
        outcome.kind === 'rejected' ? outcome.message : 'Could not save that.',
      )
    }
  }

  async function markVisited(marker: Marker, visited: boolean) {
    setMessage(null)

    const previous = markers
    setMarkers((current) =>
      current.map((each) => (each.id === marker.id ? { ...each, visited } : each)),
    )

    const outcome = await setMarkerVisited(supabase, marker.id, visited)
    if (!outcome.ok) {
      setMarkers(previous)
      setMessage(
        outcome.kind === 'rejected'
          ? outcome.message
          : 'Could not change whether this place is visited.',
      )
    }
  }

  /**
   * Move to another trip.
   *
   * A navigation rather than a state change, because everything on this screen
   * is scoped to a trip and was fetched on the server for one. Reaching for the
   * URL means the server re-reads the new trip's markers, cities, members and
   * interest — and it means the choice survives a reload and can be linked, in
   * the same way the selected city already does.
   *
   * The city goes with it. A city id belongs to the trip it was created under,
   * so carrying one across would select nothing and read as broken. The filter
   * goes for the same reason and is handled by the page remounting this.
   */
  function selectTrip(nextTripId: string) {
    if (nextTripId === trip.id) return
    router.replace(`/?trip=${nextTripId}`)
    router.refresh()
  }

  /**
   * Renaming the trip, into the one place the trips are held.
   *
   * The name shown in the bar is resolved out of that list, so writing here is
   * what makes the name and the picker follow together. They used to be two
   * values, and a rename reported success while leaving the old name in the
   * picker.
   */
  async function renameTrip(name: string) {
    setMessage(null)

    const previous = trips
    setTrips((rows) =>
      rows.map((each) => (each.id === trip.id ? { ...each, name } : each)),
    )

    const outcome = await updateTrip(supabase, trip.id, { name })
    if (!outcome.ok) {
      setTrips(previous)
      setMessage(
        outcome.kind === 'rejected' ? outcome.message : 'Could not rename this trip.',
      )
      return
    }
    const saved = outcome.data
    setTrips((rows) => rows.map((each) => (each.id === saved.id ? saved : each)))
  }

  /**
   * Add somebody to the trip.
   *
   * Returns the offending field rather than setting a message here, because the
   * form that called it is the thing that has to mark it up — a duplicate
   * address is a fact about the email box, not about the trip.
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

    setMembers((current) => [...current, outcome.data])
    return null
  }

  function selectCity(cityId: string | null) {
    const params = new URLSearchParams(searchParams.toString())
    if (cityId === null) params.delete('city')
    else params.set('city', cityId)

    const query = params.toString()
    router.replace(query === '' ? '/' : `/?${query}`, { scroll: false })

    // Selecting a city is a request to re-frame. Computed from the city being
    // selected rather than from `cityMarkers`, which still reflects the URL as
    // it was a moment ago.
    //
    // Framed on what is visible rather than on everything filed under the city:
    // framing to include markers a filter is hiding would zoom out to fit places
    // that are not drawn, and the empty margin would have no explanation.
    const points =
      cityId === null
        ? visibleMarkers
        : visibleMarkers.filter((marker) => marker.cityId === cityId)

    // An empty list leaves the camera alone: there is nothing to frame, and
    // moving somewhere arbitrary would be worse than not moving.
    setCameraTarget((current) => ({ points, token: current.token + 1 }))
  }

  function beginCreate(
    position: DraftPosition,
    initial: Partial<MarkerFormValues>,
    /**
     * Whether to move the camera to the new place.
     *
     * True for a search result, which is usually not on screen — that is
     * generally why somebody searched — so leaving the camera still would put
     * the place they just chose somewhere they cannot see, and ask them to
     * confirm a position while it was invisible.
     *
     * False for a pointed one, where the position is by definition somewhere
     * they were already looking, and moving would be the map taking the view
     * away from them.
     */
    moveThere: boolean,
  ) {
    setDraft(position)
    setDropping(false)
    if (moveThere) {
      setCameraTarget((current) => ({
        points: [position],
        token: current.token + 1,
      }))
    }
    setFieldErrors({})
    setMessage(null)
    setConflict(null)
    setPanel({
      kind: 'create',
      initial: {
        name: '',
        note: null,
        // Defaults to what is being worked on, which is almost always right and
        // is a select away when it is not.
        cityId: selectedCityId,
        type: FALLBACK_MARKER_TYPE,
        link: null,
        price: null,
        ...initial,
      },
    })
  }

  function cancel() {
    setPanel({ kind: 'none' })
    setDraft(null)
    setDropping(false)
    setFieldErrors({})
    setMessage(null)
    setConflict(null)
  }

  async function save(values: MarkerFormValues) {
    setFieldErrors({})
    setMessage(null)
    setConflict(null)

    const outcome =
      panel.kind === 'edit'
        ? await updateMarker(
            supabase,
            panel.marker.id,
            {
              ...values,
              ...(draft ? { lng: draft.lng, lat: draft.lat } : {}),
            },
            // The version this edit was based on — captured when the form was
            // opened, not read again now. Re-reading it here would make the
            // check pass by construction and guarantee nothing.
            panel.marker.updatedAt,
          )
        : await createMarker(supabase, {
            ...values,
            tripId: trip.id,
            lng: draft?.lng,
            lat: draft?.lat,
          })

    if (!outcome.ok) {
      // Everything typed, and the marker's position, survive a rejection.
      // Retyping a name is a nuisance; re-finding a spot on a map is worse.
      if (outcome.kind === 'invalid-input') setFieldErrors(outcome.fieldErrors)
      else if (outcome.kind === 'conflict') setConflict(outcome.message)
      else setMessage(outcome.message)
      // Nothing is written to `markers` on any of these paths, so the map keeps
      // showing what is stored while the form keeps what was typed.
      return
    }

    const saved = outcome.data
    setMarkers((current) =>
      current.some((marker) => marker.id === saved.id)
        ? current.map((marker) => (marker.id === saved.id ? saved : marker))
        : [...current, saved],
    )
    cancel()
  }

  async function remove(marker: Marker) {
    setMessage(null)

    const outcome = await deleteMarker(supabase, marker.id)
    if (!outcome.ok) {
      setMessage(outcome.kind === 'rejected' ? outcome.message : 'Could not remove that place.')
      return
    }
    setMarkers((current) => current.filter((each) => each.id !== marker.id))
    cancel()
  }

  /**
   * Making a city, from inside the form that needs one.
   *
   * Pending rather than optimistic, and it could not be otherwise: the form
   * has to select the row that comes back, and a row that does not exist yet
   * has no id to select. The caller says `Creating…` while this is in flight.
   */
  async function addCity(name: string, currency: string | null) {
    setMessage(null)

    const outcome = await createCity(supabase, { tripId: trip.id, name, currency })
    if (!outcome.ok) {
      setMessage(
        outcome.kind === 'rejected' ? outcome.message : 'Could not create that city.',
      )
      return null
    }
    setCities((current) => [...current, outcome.data])
    return outcome.data
  }

  /**
   * Renaming a city, or changing what its prices are read in.
   *
   * Optimistic, by the same rule as renaming a trip: one row, reversible, and
   * the picker can show the new name at once. One call carries both fields —
   * two calls from one press could store the name and have the currency
   * refused, which is a half-applied edit that nothing on screen could
   * describe.
   */
  async function patchCity(cityId: string, patch: { name?: string; currency?: string | null }) {
    setMessage(null)

    const previous = cities
    setCities((current) =>
      current.map((city) => (city.id === cityId ? { ...city, ...patch } : city)),
    )

    const outcome = await updateCity(supabase, cityId, patch)
    if (!outcome.ok) {
      setCities(previous)
      setMessage(
        outcome.kind === 'rejected' ? outcome.message : 'Could not save that city.',
      )
      return
    }
    setCities((current) =>
      current.map((city) => (city.id === cityId ? outcome.data : city)),
    )
  }

  /**
   * Removing a city.
   *
   * Pending rather than optimistic: it cannot be undone, and its consequence
   * lands on markers the person is not looking at.
   */
  async function removeCity(cityId: string) {
    setMessage(null)

    const outcome = await deleteCity(supabase, cityId)
    if (!outcome.ok) {
      setMessage(
        outcome.kind === 'rejected' ? outcome.message : 'Could not remove that city.',
      )
      return
    }

    setCities((current) => current.filter((city) => city.id !== cityId))
    // The database unassigns them rather than removing them, and the screen has
    // to say the same thing without being re-read.
    setMarkers((current) =>
      current.map((marker) =>
        marker.cityId === cityId ? { ...marker, cityId: null } : marker,
      ),
    )
    if (selectedCityId === cityId) selectCity(null)
  }

  return (
    <>
      {/*
        Two rows, because they are two thoughts: the first narrows what is on the
        map, the second adds to it. Narrowing sits on top because a trip is
        scanned far more often than it is added to.

        Search and the drop button are together because they are the two ways to
        create a marker. They used to sit at opposite ends of one wrapping row
        with a filter between them, which is an arrangement flex produced rather
        than one anybody chose.
      */}
      <div className={styles.toolbar}>
        {/*
          Which trip, what it is called, and who is on it — above the controls
          that narrow it and the ones that add to it, because it is what those
          two are about. It used to be a static line in the page header, which
          is rendered on the server and cannot follow a rename.
        */}
        <TripBar
          trip={trip}
          trips={trips}
          members={members}
          onSelect={selectTrip}
          onRename={renameTrip}
          onInvite={invite}
          onShowPeople={() =>
            void refreshMembers(() => fetchTripMembers(supabase, trip.id))
          }
          onCreated={selectTrip}
        />

        <div className={styles.narrowRow}>
          <CityBar
            cities={cities}
            markers={markers}
            selectedCityId={selectedCityId}
            onSelect={selectCity}
            onSave={patchCity}
            onDelete={removeCity}
            onEditCity={() =>
              void refreshCities(() => fetchTripCities(supabase, trip.id))
            }
          />

          <FilterBar
            filter={filter}
            onChange={setFilter}
            members={members}
            ownMemberId={ownMemberId}
          />
        </div>

        <div className={styles.addRow}>
          <span className={styles.search}>
            <PlaceSearch
              biasRef={biasRef}
              onChoose={(candidate: PlaceCandidate) =>
                beginCreate(
                  { lng: candidate.lng, lat: candidate.lat },
                  { name: candidate.name, type: candidate.typeGuess },
                  true,
                )
              }
            />
          </span>

          <Button
            tone={dropping ? 'danger' : 'primary'}
            onClick={() => {
              setDropping((armed) => !armed)
              setPanel({ kind: 'none' })
              setDraft(null)
            }}
            title="Point at the map to place somewhere search cannot find"
          >
            {dropping ? 'Cancel — click the map' : '+ Drop a pin'}
          </Button>
        </div>
      </div>

      <div className={styles.stage}>
        <TripMap
          groups={groups}
          onSelectGroup={(group: MarkerGroup<Marker>) => {
            setDraft(null)
            setPanel({
              kind: 'details',
              groupKey: group.key,
              markerId: group.count === 1 ? group.markers[0]!.id : null,
            })
          }}
          draft={draft}
          dropping={dropping}
          onDropAt={(position) => beginCreate(position, {}, false)}
          onDraftMove={setDraft}
          frameTo={cameraTarget.points}
          frameToken={cameraTarget.token}
          centreRef={centreRef}
          selectedKey={panel.kind === 'details' ? panel.groupKey : null}
          onMarkersInView={setAnyInView}
        />

        {dropping ? (
          <Banner>
            Click the map where the place is. You can drag the pin afterwards.
          </Banner>
        ) : null}

        {/*
          A refusal, where the person is looking.

          Without this the five optimistic writes on this screen rolled back in
          silence: `message` was rendered in exactly one place — above the
          marker form — and none of those writes has a form open when it fails.
          The screen put back what the database refused and said nothing, which
          is the worst version of a failure, because something visibly happened
          and then visibly un-happened.

          Every one of these notes is drawn at the same spot, so precedence has
          to be stated rather than left to the order they are written in: a
          refusal outranks anything the filter has to say about what is or is
          not on screen.
        */}
        {refusal !== null ? (
          <MapOverlayNote tone="danger">
            {refusal}{' '}
            <button
              type="button"
              onClick={() => setMessage(null)}
              className={styles.inlineAction}
            >
              Dismiss
            </button>
          </MapOverlayNote>
        ) : null}

        {/* Suppressed once the trip has places: it described the first read, and
            saying "nothing saved yet" beside a marker somebody just added would
            be false. */}
        {refusal === null && notice && markers.length === 0 ? (
          <MapOverlayNote tone={notice.tone}>{notice.text}</MapOverlayNote>
        ) : null}

        {/*
          A filter that matches nothing, said differently from a trip with
          nothing on it. The two render identically — an empty map — and the
          difference is not one a person can recover on their own: "there is
          nothing here" is alarming in a way "nothing matches what you asked
          for" is not. The way back out is offered here rather than only in the
          toolbar, because this is where the absence is being read.
        */}
        {refusal === null && markers.length > 0 && visibleMarkers.length === 0 ? (
          <MapOverlayNote tone="muted">
            No places match this filter. The trip still has {markers.length}{' '}
            {markers.length === 1 ? 'place' : 'places'}.{' '}
            <button
              type="button"
              onClick={() => setFilter(NO_FILTER)}
              className={styles.inlineAction}
            >
              Clear the filter
            </button>
          </MapOverlayNote>
        ) : null}

        {/*
          Matches, but all of them somewhere else.

          A filter never moves the camera — panning somewhere deliberately is not
          undone by narrowing what you are looking at. That rule produces one bad
          state on its own: a map with nothing on it while the toolbar reports
          matches, which is the indistinguishable-empty problem from the other
          side. So it is said, and moving there is offered rather than taken.
        */}
        {refusal === null &&
        isFiltered(filter) &&
        visibleMarkers.length > 0 &&
        !anyInView ? (
          <MapOverlayNote tone="muted">
            {visibleMarkers.length}{' '}
            {visibleMarkers.length === 1 ? 'place matches' : 'places match'}, none
            of them in view.{' '}
            <button
              type="button"
              onClick={() =>
                setCameraTarget((current) => ({
                  points: visibleMarkers,
                  token: current.token + 1,
                }))
              }
              className={styles.inlineAction}
            >
              Show {visibleMarkers.length === 1 ? 'it' : 'them'}
            </button>
          </MapOverlayNote>
        ) : null}

        {open ? (
          <MarkerDetails
            selection={open}
            currencyOf={currencyOf}
            members={members}
            interestFor={interestFor}
            ownMemberId={ownMemberId}
            onRecordInterest={(marker, interested) => void answer(marker, interested)}
            onWithdrawInterest={(marker) => void unanswer(marker)}
            onSetVisited={(marker, visited) => void markVisited(marker, visited)}
            onChoose={(index) =>
              setPanel({
                kind: 'details',
                groupKey: open.group.key,
                markerId: open.group.markers[index]!.id,
              })
            }
            onBack={() =>
              setPanel({
                kind: 'details',
                groupKey: open.group.key,
                markerId: null,
              })
            }
            // Dismissal touches no map method, so the camera cannot move.
            onDismiss={cancel}
            onEdit={(marker) => {
              setDraft({ lng: marker.lng, lat: marker.lat })
              setFieldErrors({})
              setMessage(null)
              setConflict(null)
              setPanel({ kind: 'edit', marker, initial: valuesOf(marker) })
            }}
            onDelete={remove}
          />
        ) : null}

        {panel.kind === 'create' || panel.kind === 'edit' ? (
          <MarkerForm
            title={panel.kind === 'edit' ? 'Edit this place' : 'Save this place'}
            initial={panel.initial}
            cities={cities}
            fieldErrors={fieldErrors}
            message={message}
            notice={conflict}
            onSubmit={save}
            onCancel={cancel}
            onCreateCity={addCity}
          />
        ) : null}
      </div>
    </>
  )
}

function Banner({ children }: { children: React.ReactNode }) {
  return (
    <p role="status" className={styles.banner}>
      {children}
    </p>
  )
}
