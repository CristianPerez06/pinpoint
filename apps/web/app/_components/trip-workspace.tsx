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
import { Button, Menu } from '@/app/_components/ui'
import { signOutAction } from '@/app/_actions/auth'
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
 *   renaming a trip, archiving one, restoring one, renaming a city or setting
 *   its currency.
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
 *
 * **Optimistic does not excuse a control from reporting**, and the two rules
 * meet in a place worth naming. Renaming applies at once *and* says `Saving…`,
 * because the field that asked for it is still on screen. So the question is
 * never "is this optimistic, therefore silent" but "is the control still there
 * to speak". Restoring a trip is where that bites: written the obvious way, the
 * archived row was removed on the press — and the row *is* the control, so
 * `Putting back…` was written and could never render. The optimistic change
 * belongs to whichever list the outcome is about; the control stays until the
 * answer arrives.
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

/**
 * The detours the toolbar raises, as one closed set.
 *
 * Deliberately flat rather than one value per bar. These panels are alike in
 * the only way that matters here — each hangs off a control in the chrome and
 * covers the map — so what has to be true is that at most one exists, and a
 * single value is what says so. Splitting it per bar is what produced two
 * panels drawn on top of each other.
 *
 * One value per control in the bar, not per view inside a panel. Which face
 * the trip menu is showing — its list, rename, people, new trip — is that
 * menu's own business and cannot break this rule, because only one of them can
 * be on screen anyway.
 *
 * `MarkerDetails` and `MarkerForm` are not in this set. They float over the
 * map from `overlayPanelClass` rather than hanging off the chrome, and they
 * are already mutually exclusive through `panel`.
 */
type DetourPanel = 'none' | 'trip' | 'city' | 'filter' | 'account'

/**
 * The order `fetchTrips` returns trips in: oldest first, ties broken by id.
 *
 * Restated here because a restored trip is put back into the list by hand
 * rather than by re-reading it, and a list that is sorted by the database on
 * every read but appended to locally is one that silently disagrees with itself
 * until the next read.
 */
function inTripOrder(rows: readonly Trip[]): readonly Trip[] {
  return [...rows].sort((a, b) =>
    a.createdAt === b.createdAt
      ? a.id.localeCompare(b.id)
      : a.createdAt.localeCompare(b.createdAt),
  )
}

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
   * What to call the reader on the account control.
   *
   * Their member name when their account matches one, and `Account` when it
   * does not — which is ordinary rather than broken, since a member row exists
   * before the account does.
   */
  const youAre =
    members.find((member) => member.id === ownMemberId)?.displayName ?? 'Account'
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
  /**
   * Which of the chrome's detours is open, as one value for the whole toolbar.
   *
   * It was three flags inside `TripBar` and a fourth inside `CityBar`, and the
   * invariant "only one panel at a time" was enforced within each of them and
   * between neither. Opening `People` and then `Edit city` drew a 340px panel
   * and a 300px panel at the same position and the same stacking level, one
   * silently over the other.
   *
   * One variable is the only way to state the rule once. The alternative —
   * every panel closing the others through callbacks — is the same invariant
   * written in four places, which is how it came to be false.
   */
  const [detour, setDetour] = useState<DetourPanel>('none')
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
  /**
   * Archived trips, once somebody asks. Null until then.
   *
   * Null rather than an empty array, because "nobody has asked" and "there are
   * none" are different answers and only one of them is worth a line saying so.
   *
   * Deliberately not part of `trips`. That list is what the switcher offers and
   * archived trips are the ones it must not, so keeping them apart is what makes
   * it impossible for a reveal to leak one back into the menu.
   */
  const [archivedTrips, setArchivedTrips] = useState<readonly Trip[] | null>(null)

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
   * Archived trips, once somebody asks. Null until then.
   *
   * A read rather than a write, and treated like one anyway: the press has to be
   * answered. Returned rather than fired and forgotten, so the row that started
   * it can stay on screen and say so until it settles — until the phone did
   * that, pressing again simply sent a second one.
   *
   * A failure sets `message` rather than leaving the row to spring back with no
   * explanation, which is the same reason every optimistic write on this screen
   * reports its own refusal.
   */
  async function revealArchived() {
    setMessage(null)

    const state = await fetchTrips(supabase, { includeArchived: true })
    if (state.status === 'failed') {
      setMessage(state.message)
      return false
    }

    const all = state.status === 'ready' ? state.data : []
    setArchivedTrips(all.filter((each) => each.archived))
    return true
  }

  /**
   * Archive the trip being looked at.
   *
   * Optimistic, by the same rule as renaming it: one column on one row,
   * reversible, and the outcome can be drawn before it is confirmed. So the trip
   * leaves the list at once and goes back exactly as it was if the database
   * refuses.
   *
   * Only the trip being viewed can be archived, which is why this takes no
   * argument. Archiving one from the switcher would mean removing a trip the
   * person is not looking at, from a list they opened to move between them.
   *
   * It does not ask first. Archiving is reversible by any member, and a
   * confirmation on a reversible act trains people to dismiss confirmations on
   * the ones that are not.
   *
   * What it does *not* do here is move off the trip — see `archiveAndLeave`.
   * Dropping the row from `trips` is not enough on this platform, and the reason
   * is written there rather than in two places.
   */
  async function archiveTrip() {
    setMessage(null)

    const previous = trips
    setTrips((rows) => rows.filter((each) => each.id !== trip.id))

    const outcome = await updateTrip(supabase, trip.id, { archived: true })
    if (!outcome.ok) {
      setTrips(previous)
      setMessage(
        outcome.kind === 'rejected'
          ? outcome.message
          : 'Could not archive this trip.',
      )
      return false
    }

    return true
  }

  /**
   * Archive the trip being viewed, and stop showing it.
   *
   * **The second half is not the first half's consequence on this platform, and
   * that is the whole reason this function exists.** The phone drops the trip
   * from its list and lets the resolver above fall through to the next one.
   * Here the trip is resolved on the server from the URL, and the client then
   * holds
   *
   *     const trip = trips.find((each) => each.id === initialTrip.id) ?? initialTrip
   *
   * whose fallback is deliberate: it is what stops the screen emptying out from
   * under somebody when a re-read shows that *another member* archived the trip
   * they are looking at. So dropping the row from `trips` changes nothing
   * visible — the name, the markers and the cities all keep rendering, which is
   * the one thing the requirement forbids by name. Reach for the state change
   * first and it will look like it worked.
   *
   * `replace` plus `refresh` is the pair `selectTrip` already uses. The server
   * re-reads the trips with archived excluded and resolves the first remaining
   * one, or renders the screen for somebody with no trips — where a first trip
   * is made, and from which the archive is reachable again the moment there is
   * one.
   *
   * Only on success. A refused archive that navigated would remount this
   * component — it is keyed by the trip — and take the refusal with it, so
   * somebody would be moved to another trip and told nothing about why the one
   * they asked about is still there.
   */
  async function archiveAndLeave() {
    if (!(await archiveTrip())) return

    router.replace('/')
    router.refresh()
  }

  /**
   * Put an archived trip back.
   *
   * The same write with the flag inverted, so the same answer: optimistic, and
   * per row. The trip is offered again at once, inserted in the order
   * `fetchTrips` returns rather than appended — otherwise the switcher shows a
   * restored trip out of sequence until some later read happens to correct it —
   * and taken back out exactly as it was if the database refuses.
   *
   * **The archived row it came from stays until the write settles**, and that is
   * the half worth explaining, because removing it at once is what this did
   * first and it looked right. The optimistic change belongs to the switcher:
   * that list is what "restored" means. The archived list is a transient view of
   * one read, and the row in it is *the control that started the write* — so
   * taking it out on the press destroys the only thing on screen that can say
   * the round trip has not finished. `Putting back…` was written, shipped, and
   * could never once have been rendered; it was found by throttling the
   * connection and watching for it.
   *
   * So the trip is briefly in both lists, and that reads correctly: it is in the
   * switcher because it is back, and it is still on the archived page saying it
   * is on its way. The row goes when the answer does.
   *
   * The list is **not** dropped to null when this settles, which is what the
   * phone does and what this also did first. The phone can: its reveal collapses
   * back to a single row, so a null list renders as "ask again". Here the reveal
   * is a page that stays open and a null list on it renders as *Nothing
   * archived.* — so restoring one of three announced that there were none while
   * two were still sitting in the database. The next press of `Archived trips`
   * re-reads it, so nothing goes stale anywhere somebody can see.
   */
  async function restoreTrip(tripId: string) {
    setMessage(null)

    const restoring = archivedTrips?.find((each) => each.id === tripId)
    // Nothing to put back. Only reachable if the list changed underneath the
    // press, and doing nothing is the right answer to that.
    if (!restoring) return

    const previousTrips = trips
    setTrips((rows) => inTripOrder([...rows, { ...restoring, archived: false }]))

    const outcome = await updateTrip(supabase, tripId, { archived: false })
    if (!outcome.ok) {
      setTrips(previousTrips)
      setMessage(
        outcome.kind === 'rejected'
          ? outcome.message
          : 'Could not restore this trip.',
      )
      return
    }

    const saved = outcome.data
    setTrips((rows) => rows.map((each) => (each.id === saved.id ? saved : each)))
    setArchivedTrips(
      (current) => current?.filter((each) => each.id !== saved.id) ?? null,
    )
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
    <div className={styles.shell}>
      {/*
        One bar, and it is the header.

        This was a header plus three stacked toolbar rows — 205px of chrome on a
        929px viewport, holding 558px of controls, so between 78 and 86 per cent
        of every row was empty. The arrangement was not decided: each band
        arrived for its own good reason and none was ever weighed against the
        others, which left the topmost and leftmost strip of the interface —
        where a hand and an eye go first — holding `Rename`, `People` and
        `New trip`, three things somebody does about once per trip in total.

        Read left to right it is now scope, then the session, then the person.
        The trip and the city say what is being looked at and open everything
        rare that belongs to them. Search, drop and filter are what a session is
        actually made of. The account is at the far end, where DESIGN.md wants
        rare destructive things kept.
      */}
      <header className={styles.bar}>
        <span className={styles.mark} aria-hidden />

        <TripBar
          trip={trip}
          trips={trips}
          members={members}
          onSelect={selectTrip}
          onRename={renameTrip}
          archived={archivedTrips}
          onRevealArchived={revealArchived}
          onArchive={archiveAndLeave}
          onRestore={restoreTrip}
          onInvite={invite}
          onShowPeople={() =>
            void refreshMembers(() => fetchTripMembers(supabase, trip.id))
          }
          onCreated={selectTrip}
          open={detour === 'trip'}
          onOpen={(open) => setDetour(open ? 'trip' : 'none')}
        />

        <span className={styles.scopeSep} aria-hidden>
          /
        </span>

        {/*
          The city is a narrowing of the trip, so it reads as one — which is
          also true of what it does: it frames the camera on that city's places
          and biases search toward them. It still does not filter the map.
        */}
        <CityBar
          cities={cities}
          markers={markers}
          selectedCityId={selectedCityId}
          onSelect={selectCity}
          onSave={patchCity}
          onDelete={removeCity}
          onShowCities={() =>
            void refreshCities(() => fetchTripCities(supabase, trip.id))
          }
          open={detour === 'city'}
          onOpen={(open) => setDetour(open ? 'city' : 'none')}
        />

        <span className={styles.tools}>
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

          {/*
            A slot, so the two labels do not resize the control and push the
            filter sideways at the exact moment somebody is reaching for the map.

            The armed label is `Cancel` rather than `Cancel — click the map`,
            which is what it used to say. The banner standing over the map
            already says "Click the map where the place is", so the long form
            was the same sentence twice — and it was the widest thing in the
            bar, forcing a slot half again as wide as the control needed.
          */}
          <span className={styles.drop}>
            <Button
              tone={dropping ? 'danger' : 'primary'}
              onClick={() => {
                setDropping((armed) => !armed)
                setPanel({ kind: 'none' })
                setDraft(null)
              }}
            >
              {dropping ? 'Cancel' : '+ Drop a pin'}
            </Button>
          </span>

          <FilterBar
            filter={filter}
            onChange={setFilter}
            members={members}
            ownMemberId={ownMemberId}
            open={detour === 'filter'}
            onOpen={(open) => setDetour(open ? 'filter' : 'none')}
          />
        </span>

        {/*
          The person, not the trip.

          `Sign out` was a bare button one pixel from the corner with no menu
          around it and nowhere for anything else to go. A profile route and a
          settings route are both waiting on somewhere to hang, and this is it.
        */}
        <span className={styles.account}>
          <Menu
            name="Account"
            label={<span className={styles.you}>{youAre}</span>}
            align="end"
            tone="quiet"
            open={detour === 'account'}
            onOpen={(open) => setDetour(open ? 'account' : 'none')}
          >
            <form action={signOutAction}>
              <button type="submit" className={styles.signOut}>
                Sign out
              </button>
            </form>
          </Menu>
        </span>
      </header>

      {/*
        `<main>` is the map, and the bar above it is a sibling rather than a
        parent. A `<header>` inside `<main>` is exactly the condition under
        which it stops exposing a `banner` landmark, which is what the old
        arrangement did without anything reporting it.
      */}
      <main className={styles.stage}>
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
      </main>
    </div>
  )
}

function Banner({ children }: { children: React.ReactNode }) {
  return (
    <p role="status" className={styles.banner}>
      {children}
    </p>
  )
}
