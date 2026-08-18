'use client'

import type {
  City,
  FieldErrors,
  Marker,
  MarkerInterest,
  Trip,
  TripMember,
} from '@pinpoint/core'
import {
  createCity,
  createMarker,
  deleteCity,
  deleteMarker,
  recordInterest,
  setMarkerVisited,
  updateCity,
  updateMarker,
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
import { MarkerDetails, type Selection } from '@/app/_components/marker-details'
import {
  MarkerForm,
  type MarkerFormValues,
} from '@/app/_components/marker-form'
import { PlaceSearch } from '@/app/_components/place-search'
import { MapOverlayNote } from '@/app/_components/states'
import { type DraftPosition, TripMap } from '@/app/_components/trip-map'
import { Button } from '@/app/_components/ui'
import { createClient } from '@/lib/supabase/client'

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
 */

type Panel =
  | { kind: 'none' }
  | { kind: 'details'; selection: Selection }
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
  trip,
  initialMarkers,
  initialCities,
  members,
  initialInterest,
  ownMemberId,
  notice,
}: {
  trip: Trip
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

  const [markers, setMarkers] = useState<readonly Marker[]>(initialMarkers)
  const [cities, setCities] = useState<readonly City[]>(initialCities)
  const [interest, setInterest] = useState<readonly MarkerInterest[]>(initialInterest)
  const [panel, setPanel] = useState<Panel>({ kind: 'none' })
  const [dropping, setDropping] = useState(false)
  const [draft, setDraft] = useState<DraftPosition | null>(null)
  const [busy, setBusy] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [message, setMessage] = useState<string | null>(null)
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

  // The selection lives in the URL so it survives a reload and can be linked.
  const selectedCityId = searchParams.get('city')

  const groups = useMemo(() => groupCoincident([...markers]), [markers])

  /**
   * The open panel's group, resolved against current state rather than the copy
   * captured when the pin was clicked.
   *
   * The panel stores what was selected, which is a snapshot: marking a place
   * visited updated `markers`, the map redrew from the new groups, and the card
   * went on rendering the marker as it had been a moment earlier. The pin faded
   * and the button beside it still said "Mark visited".
   *
   * Interest did not show the bug because it is looked up by id at render time,
   * which is what this now does for the marker itself.
   *
   * Null when the group has gone — the last marker on the point was removed —
   * and the panel closes rather than rendering something that is not there.
   */
  const openGroup = useMemo(() => {
    if (panel.kind !== 'details') return null
    return groups.find((group) => group.key === panel.selection.group.key) ?? null
  }, [panel, groups])

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

  const interestFor = useCallback(
    (marker: Marker) => interest.filter((record) => record.markerId === marker.id),
    [interest],
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

  function selectCity(cityId: string | null) {
    const params = new URLSearchParams(searchParams.toString())
    if (cityId === null) params.delete('city')
    else params.set('city', cityId)

    const query = params.toString()
    router.replace(query === '' ? '/' : `/?${query}`, { scroll: false })

    // Selecting a city is a request to re-frame. Computed from the city being
    // selected rather than from `cityMarkers`, which still reflects the URL as
    // it was a moment ago.
    const points =
      cityId === null
        ? markers
        : markers.filter((marker) => marker.cityId === cityId)

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
  }

  async function save(values: MarkerFormValues) {
    setBusy(true)
    setFieldErrors({})
    setMessage(null)

    const outcome =
      panel.kind === 'edit'
        ? await updateMarker(supabase, panel.marker.id, {
            ...values,
            ...(draft ? { lng: draft.lng, lat: draft.lat } : {}),
          })
        : await createMarker(supabase, {
            ...values,
            tripId: trip.id,
            lng: draft?.lng,
            lat: draft?.lat,
          })

    setBusy(false)

    if (!outcome.ok) {
      // Everything typed, and the marker's position, survive a rejection.
      // Retyping a name is a nuisance; re-finding a spot on a map is worse.
      if (outcome.kind === 'invalid-input') setFieldErrors(outcome.fieldErrors)
      else setMessage(outcome.message)
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
    const outcome = await deleteMarker(supabase, marker.id)
    if (!outcome.ok) {
      setMessage(outcome.kind === 'rejected' ? outcome.message : 'Could not remove that place.')
      return
    }
    setMarkers((current) => current.filter((each) => each.id !== marker.id))
    cancel()
  }

  async function addCity(name: string, currency: string | null) {
    const outcome = await createCity(supabase, { tripId: trip.id, name, currency })
    if (!outcome.ok) return null
    setCities((current) => [...current, outcome.data])
    return outcome.data
  }

  async function patchCity(cityId: string, patch: { name?: string; currency?: string | null }) {
    const outcome = await updateCity(supabase, cityId, patch)
    if (!outcome.ok) return
    setCities((current) =>
      current.map((city) => (city.id === cityId ? outcome.data : city)),
    )
  }

  async function removeCity(cityId: string) {
    const outcome = await deleteCity(supabase, cityId)
    if (!outcome.ok) return

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
      <div className={styles.toolbar}>
        <CityBar
          cities={cities}
          markers={markers}
          selectedCityId={selectedCityId}
          onSelect={selectCity}
          onRename={(cityId, name) => void patchCity(cityId, { name })}
          onSetCurrency={(cityId, currency) => void patchCity(cityId, { currency })}
          onDelete={(cityId) => void removeCity(cityId)}
        />

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

        <span className={styles.spacer}>
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
        </span>
      </div>

      <div className={styles.stage}>
        <TripMap
          groups={groups}
          onSelectGroup={(group: MarkerGroup<Marker>) => {
            setDraft(null)
            setPanel({
              kind: 'details',
              selection: { group, index: group.count === 1 ? 0 : null },
            })
          }}
          draft={draft}
          dropping={dropping}
          onDropAt={(position) => beginCreate(position, {}, false)}
          onDraftMove={setDraft}
          frameTo={cameraTarget.points}
          frameToken={cameraTarget.token}
          centreRef={centreRef}
          selectedKey={panel.kind === 'details' ? panel.selection.group.key : null}
        />

        {dropping ? (
          <Banner>
            Click the map where the place is. You can drag the pin afterwards.
          </Banner>
        ) : null}

        {/* Suppressed once the trip has places: it described the first read, and
            saying "nothing saved yet" beside a marker somebody just added would
            be false. */}
        {notice && markers.length === 0 ? (
          <MapOverlayNote tone={notice.tone}>{notice.text}</MapOverlayNote>
        ) : null}

        {panel.kind === 'details' && openGroup ? (
          <MarkerDetails
            selection={{
              group: openGroup,
              // Clamped, because the group can shrink underneath an open card —
              // another member removes a place sharing this point — and an index
              // past the end would render nothing with no explanation.
              index:
                panel.selection.index !== null &&
                panel.selection.index < openGroup.count
                  ? panel.selection.index
                  : openGroup.count === 1
                    ? 0
                    : null,
            }}
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
                selection: { ...panel.selection, index },
              })
            }
            onBack={() =>
              setPanel({
                kind: 'details',
                selection: { ...panel.selection, index: null },
              })
            }
            // Dismissal touches no map method, so the camera cannot move.
            onDismiss={cancel}
            onEdit={(marker) => {
              setDraft({ lng: marker.lng, lat: marker.lat })
              setFieldErrors({})
              setMessage(null)
              setPanel({ kind: 'edit', marker, initial: valuesOf(marker) })
            }}
            onDelete={(marker) => void remove(marker)}
          />
        ) : null}

        {panel.kind === 'create' || panel.kind === 'edit' ? (
          <MarkerForm
            title={panel.kind === 'edit' ? 'Edit this place' : 'Save this place'}
            initial={panel.initial}
            cities={cities}
            busy={busy}
            fieldErrors={fieldErrors}
            message={message}
            onSubmit={(values) => void save(values)}
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
