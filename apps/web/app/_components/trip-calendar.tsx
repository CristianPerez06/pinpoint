'use client'

import {
  addDays,
  type City,
  dayToOpenOn,
  type FieldErrors,
  groupMarkersByDay,
  type IsoDay,
  type Marker,
  type MarkerInterest,
  markersOnDay,
  type Trip,
  type TripMember,
} from '@pinpoint/core'
import {
  deleteMarker,
  recordInterest,
  setMarkerVisited,
  updateMarker,
  withdrawInterest,
} from '@pinpoint/data'
import { groupCoincident, markerView } from '@pinpoint/map'
import { ChevronLeft, ChevronRight, MapIcon } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useMemo, useState } from 'react'

import { MarkerDetails } from '@/app/_components/marker-details'
import { MarkerForm, type MarkerFormValues } from '@/app/_components/marker-form'
import { TypeChip } from '@/app/_components/pin'
import { createClient } from '@/lib/supabase/client'
import { formatDay, formatDayFull, formatDayShort } from '@/lib/day'

import styles from './trip-calendar.module.css'

/**
 * A trip's places, arranged by the day they are planned for.
 *
 * A screen rather than a panel over the map, because it is a different way of
 * looking at the trip rather than something laid on top of one — and because
 * the chrome's rule about leaving and returning is written for exactly this.
 *
 * **It applies no filter.** The workspace's filter is a property of the
 * workspace, and a calendar that inherited it would present a day as emptier
 * than it is and count the waiting pile short, with the control that would have
 * explained the absence left behind on another screen. Somebody would believe
 * they had finished arranging a trip they had not.
 *
 * Every day here is a `YYYY-MM-DD` string. Nothing in this file constructs a
 * `Date` from one — `dateOfDay` in `@pinpoint/core` is the only sanctioned way,
 * and `@/lib/day` is the only caller, because `new Date('2026-04-03')` parses
 * as UTC midnight and reads as the previous day across most of the western
 * hemisphere.
 */

/** How many days sit either side of the one being read, where there is room. */
const NEIGHBOURS = 1

/**
 * A refusal in words, whatever kind it was.
 *
 * `invalid-input` carries fields rather than a sentence, and every caller below
 * is a write with nothing to type into — a toggle, a delete — so there is no
 * field for one to land on. Naming that case here is what stops each of them
 * reading `.message` off an outcome that has none.
 */
function refusalMessage(
  outcome: { kind: 'invalid-input' } | { kind: 'rejected'; message: string } | { kind: 'conflict'; message: string },
  fallback: string,
): string {
  return outcome.kind === 'invalid-input' ? fallback : outcome.message
}

export function TripCalendar({
  trip,
  initialMarkers,
  cities,
  members,
  initialInterest,
  ownMemberId,
  workspaceHref,
}: {
  trip: Trip
  initialMarkers: readonly Marker[]
  cities: readonly City[]
  members: readonly TripMember[]
  initialInterest: readonly MarkerInterest[]
  ownMemberId: string | null
  /**
   * The way back, built by whoever knew which city was open.
   *
   * Carried rather than assembled here, because returning has to restore the
   * city as well as the trip. A link to `/` would let the workspace choose one
   * again and put somebody down somewhere they were not, with nothing on screen
   * saying it had happened.
   */
  workspaceHref: string
}) {
  const supabase = useMemo(() => createClient(), [])
  const router = useRouter()
  const searchParams = useSearchParams()

  const [markers, setMarkers] = useState(initialMarkers)
  const [interest, setInterest] = useState(initialInterest)
  const [message, setMessage] = useState<string | null>(null)
  const [conflict, setConflict] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [openMarkerId, setOpenMarkerId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)

  /**
   * The day being read lives in the address.
   *
   * So a reload lands where somebody was, and so a link to a day is a link to
   * that day. Falls back to the day the trip makes most sense to open on rather
   * than to a constant: today while the trip is happening, its start date
   * otherwise, and today for the many trips carrying no dates at all.
   */
  const day: IsoDay = searchParams.get('day') ?? dayToOpenOn(trip)

  const goToDay = useCallback(
    (next: IsoDay) => {
      const params = new URLSearchParams(searchParams.toString())
      params.set('day', next)
      // Replaced rather than pushed: stepping through a fortnight a day at a
      // time should not bury the page somebody arrived from under fourteen
      // entries of Back.
      router.replace(`/calendar?${params.toString()}`, { scroll: false })
    },
    [router, searchParams],
  )

  const grouped = useMemo(() => groupMarkersByDay(markers), [markers])

  const openMarker = useMemo(
    () => markers.find((each) => each.id === openMarkerId) ?? null,
    [markers, openMarkerId],
  )
  const editing = useMemo(
    () => markers.find((each) => each.id === editingId) ?? null,
    [markers, editingId],
  )

  const currencyOf = useCallback(
    (marker: Marker) =>
      cities.find((city) => city.id === marker.cityId)?.currency ?? null,
    [cities],
  )

  const interestFor = useCallback(
    (marker: Marker) => interest.filter((record) => record.markerId === marker.id),
    [interest],
  )

  /** One marker as the group shape the details panel speaks. */
  const selection = useMemo(() => {
    if (!openMarker) return null
    const group = groupCoincident([openMarker])[0]
    return group ? { group, index: 0, hidden: false } : null
  }, [openMarker])

  function replaceMarker(saved: Marker) {
    setMarkers((rows) => rows.map((each) => (each.id === saved.id ? saved : each)))
  }

  async function save(values: MarkerFormValues) {
    if (!editing) return
    setFieldErrors({})
    setMessage(null)
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
      // Everything typed survives a refusal, whichever kind it was.
      if (outcome.kind === 'invalid-input') setFieldErrors(outcome.fieldErrors)
      else if (outcome.kind === 'conflict') setConflict(outcome.message)
      else setMessage(outcome.message)
      return
    }

    replaceMarker(outcome.data)
    setEditingId(null)

    /*
     * Follow the place to the day it was moved to.
     *
     * Saving it and staying put would leave the person reading a day the place
     * is no longer on, having just been told the save worked — which reads as
     * the save having done nothing.
     */
    if (outcome.data.plannedOn !== null && outcome.data.plannedOn !== day) {
      goToDay(outcome.data.plannedOn)
    }
  }

  async function remove(marker: Marker) {
    const outcome = await deleteMarker(supabase, marker.id)
    if (!outcome.ok) {
      setMessage(refusalMessage(outcome, 'Could not remove that place.'))
      return
    }
    setMarkers((rows) => rows.filter((each) => each.id !== marker.id))
    setOpenMarkerId(null)
  }

  async function setVisited(marker: Marker, visited: boolean) {
    const previous = markers
    setMarkers((rows) =>
      rows.map((each) => (each.id === marker.id ? { ...each, visited } : each)),
    )

    const outcome = await setMarkerVisited(supabase, marker.id, visited)
    if (!outcome.ok) {
      setMarkers(previous)
      setMessage(refusalMessage(outcome, 'Could not save that.'))
    }
  }

  async function record(marker: Marker, interested: boolean) {
    if (!ownMemberId) return

    const previous = interest
    const optimistic: MarkerInterest = {
      markerId: marker.id,
      memberId: ownMemberId,
      interested,
      updatedAt: new Date().toISOString(),
    }

    setInterest((rows) => [
      ...rows.filter(
        (each) => !(each.markerId === marker.id && each.memberId === ownMemberId),
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
      setMessage(refusalMessage(outcome, 'Could not save that.'))
    }
  }

  async function withdraw(marker: Marker) {
    if (!ownMemberId) return

    const previous = interest
    setInterest((rows) =>
      rows.filter(
        (each) => !(each.markerId === marker.id && each.memberId === ownMemberId),
      ),
    )

    const outcome = await withdrawInterest(supabase, marker.id, ownMemberId)
    if (!outcome.ok) {
      setInterest(previous)
      setMessage(refusalMessage(outcome, 'Could not save that.'))
    }
  }

  const days = [-NEIGHBOURS, 0, NEIGHBOURS].map((offset) => addDays(day, offset))

  return (
    <div className={styles.screen}>
      <header className={styles.head}>
        <div className={styles.headRow}>
          {/*
            The way back, drawn rather than left to the browser's own. A screen
            that can be reached and not left is a screen that strands, and the
            control has to be here whether somebody arrived by link or by press.
          */}
          <Link href={workspaceHref} className={styles.back}>
            <MapIcon size={16} strokeWidth={2.2} aria-hidden />
            <span>Back to the map</span>
          </Link>
          <h1 className={styles.title}>{trip.name}</h1>
        </div>

        <div className={styles.controls}>
          <button
            type="button"
            onClick={() => goToDay(addDays(day, -1))}
            className={styles.step}
            /*
              Named in words, in every rendering. An arrow conveys nothing to a
              screen reader, and "previous" alone conveys only that there is one
              — the day it leads to is what the screen is showing and what the
              control therefore has to say.
            */
            aria-label={`Previous day, ${formatDayFull(addDays(day, -1))}`}
          >
            <ChevronLeft size={18} strokeWidth={2.2} aria-hidden />
          </button>

          <label className={styles.picker}>
            <span className={styles.pickerLabel}>Day</span>
            <input
              type="date"
              value={day}
              onChange={(event) => {
                // An emptied date control must not navigate to nowhere. There
                // is no "no day" to be on; the day being read is always a day.
                if (event.target.value !== '') goToDay(event.target.value)
              }}
              className={styles.pickerInput}
            />
          </label>

          <button
            type="button"
            onClick={() => goToDay(addDays(day, 1))}
            className={styles.step}
            aria-label={`Next day, ${formatDayFull(addDays(day, 1))}`}
          >
            <ChevronRight size={18} strokeWidth={2.2} aria-hidden />
          </button>
        </div>
      </header>

      <div className={styles.body}>
        {message ? (
          <p role="alert" className={styles.message}>
            {message}
          </p>
        ) : null}

        <Waiting
          markers={grouped.undated}
          onOpen={(marker) => setOpenMarkerId(marker.id)}
        />

        <div className={styles.days}>
          {days.map((each, index) => (
            <DayColumn
              key={each}
              day={each}
              current={index === NEIGHBOURS}
              markers={markersOnDay(grouped, each)}
              onOpen={(marker) => setOpenMarkerId(marker.id)}
            />
          ))}
        </div>
      </div>

      {selection && !editing ? (
        <div className={styles.panel}>
          <MarkerDetails
            selection={selection}
            currencyOf={currencyOf}
            members={members}
            interestFor={interestFor}
            ownMemberId={ownMemberId}
            onRecordInterest={(marker, interested) => void record(marker, interested)}
            onWithdrawInterest={(marker) => void withdraw(marker)}
            onSetVisited={(marker, visited) => void setVisited(marker, visited)}
            // One place at a time here: nothing on this screen groups by
            // position, so there is never a chooser to go back to.
            onChoose={() => {}}
            onBack={() => {}}
            onDismiss={() => setOpenMarkerId(null)}
            onEdit={(marker) => setEditingId(marker.id)}
            onDelete={(marker) => remove(marker)}
          />
        </div>
      ) : null}

      {editing ? (
        <div className={styles.panel}>
          <MarkerForm
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
              Creating a city is the map's business. Offering it from here would
              mean a second place that can make one, on a screen that never
              shows where a city is — so the detour is simply not offered and
              the list is whatever the trip already holds.
            */
            onCreateCity={async () => null}
          />
        </div>
      ) : null}
    </div>
  )
}

/**
 * The places still waiting for a day.
 *
 * Above the days rather than behind a further act, because these are what
 * somebody came here to deal with — and on the map a place with no day looks
 * exactly like one that has a day, so without this, filling in a trip means
 * opening pins at random hoping to find undated ones.
 *
 * Collapsed by default and stating its count while collapsed, and **present
 * when the count is zero**. A region that appears and disappears moves
 * everything below it, so the screen would rearrange itself at the moment the
 * last place is dated — which is the moment somebody is most likely to still be
 * reading it. The same decision the filter's declaration already carries.
 */
function Waiting({
  markers,
  onOpen,
}: {
  markers: readonly Marker[]
  onOpen: (marker: Marker) => void
}) {
  if (markers.length === 0) {
    return (
      <div className={styles.waitingEmpty}>
        <span className={styles.waitingLabel}>No places waiting for a day</span>
      </div>
    )
  }

  return (
    <details className={styles.waiting}>
      <summary className={styles.waitingSummary}>
        <span className={styles.waitingLabel}>
          {markers.length === 1
            ? '1 place with no day yet'
            : `${markers.length} places with no day yet`}
        </span>
      </summary>
      <ul className={styles.list}>
        {markers.map((marker) => (
          <PlaceRow key={marker.id} marker={marker} onOpen={onOpen} />
        ))}
      </ul>
    </details>
  )
}

function DayColumn({
  day,
  current,
  markers,
  onOpen,
}: {
  day: IsoDay
  current: boolean
  markers: readonly Marker[]
  onOpen: (marker: Marker) => void
}) {
  return (
    <section
      className={`${styles.day} ${current ? styles.dayCurrent : styles.dayNeighbour}`}
      aria-current={current ? 'date' : undefined}
      aria-label={formatDayFull(day)}
    >
      <h2 className={styles.dayName}>
        {/* The full wording where there is room, the short one where there is
            not — one element rather than two, so the accessible name does not
            depend on which of a pair happens to be drawn. */}
        <span className={styles.dayNameLong} aria-hidden>
          {formatDay(day)}
        </span>
        <span className={styles.dayNameShort} aria-hidden>
          {formatDayShort(day)}
        </span>
        <span className={styles.visuallyHidden}>{formatDayFull(day)}</span>
      </h2>

      {markers.length === 0 ? (
        // An empty day is the ordinary state of most days on most trips, and it
        // is information. It is said, not left blank and not drawn as a fault.
        <p className={styles.dayEmpty}>Nothing planned.</p>
      ) : (
        <ul className={styles.list}>
          {markers.map((marker) => (
            <PlaceRow key={marker.id} marker={marker} onOpen={onOpen} />
          ))}
        </ul>
      )}
    </section>
  )
}

function PlaceRow({
  marker,
  onOpen,
}: {
  marker: Marker
  onOpen: (marker: Marker) => void
}) {
  return (
    <li>
      <button type="button" onClick={() => onOpen(marker)} className={styles.place}>
        <TypeChip view={markerView(marker)} size={26} />
        <span className={styles.placeName}>{marker.name}</span>
        {/* Visited is said in words as well as drawn, because a signal that
            survives only in styling does not survive a screen reader. */}
        {marker.visited ? (
          <span className={styles.placeVisited}>Visited</span>
        ) : null}
      </button>
    </li>
  )
}
