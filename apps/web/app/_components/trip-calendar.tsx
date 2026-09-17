'use client'

import {
  addDays,
  type City,
  dayShown,
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
  fetchTripCities,
  fetchTripInterest,
  fetchTripMarkers,
  fetchTripMembers,
  fetchTrips,
  recordInterest,
  setMarkerVisited,
  updateMarker,
  withdrawInterest,
} from '@pinpoint/data'
import { groupCoincident, markerView } from '@pinpoint/map'
import { ChevronLeft, ChevronRight, MapIcon } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useCallback, useMemo, useState } from 'react'

import { AccountMenu } from '@/app/_components/account-menu'
import { ChromeBar } from '@/app/_components/chrome-bar'
import { MarkerDetails } from '@/app/_components/marker-details'
import { MarkerForm, type MarkerFormValues } from '@/app/_components/marker-form'
import { TypeChip } from '@/app/_components/pin'
import { TripBar } from '@/app/_components/trip-bar'
import { useTripActions } from '@/app/_components/use-trip-actions'
import { createClient } from '@/lib/supabase/client'
import { formatDay, formatDayFull, formatDayShort } from '@/lib/day'
import { useRows } from '@/lib/use-rows'
import { useVisibleAgain } from '@/lib/use-visible-again'

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
  trip: initialTrip,
  trips: storedTrips,
  initialMarkers,
  initialCities,
  members: initialMembers,
  initialInterest,
  ownMemberId,
  workspaceHref,
}: {
  trip: Trip
  /**
   * Every trip this account belongs to, so one can be chosen from here without
   * another read. The trip's name opens the same menu it opens on the map, and
   * that menu is the switcher.
   */
  trips: readonly Trip[]
  initialMarkers: readonly Marker[]
  initialCities: readonly City[]
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
  const searchParams = useSearchParams()

  /*
   * The lists this screen shows, each with a way to read it again.
   *
   * `useRows` rather than `useState` because the account menu in the bar
   * carries `Refresh`, and a refresh has to actually re-read. It cannot go
   * through `router.refresh()`: this component is keyed by the trip, so it does
   * not remount, and its state initialisers never run again — the props would
   * change and nothing on screen would.
   */
  const [trips, setTrips, refreshTrips] = useRows<Trip>(storedTrips)
  const [members, setMembers, refreshMembers] = useRows<TripMember>(initialMembers)
  const [markers, setMarkers, refreshMarkers] = useRows<Marker>(initialMarkers)
  const [interest, setInterest, refreshInterest] =
    useRows<MarkerInterest>(initialInterest)
  /*
   * The cities, read again but never written here.
   *
   * No setter, because this screen cannot create, rename or remove one — that
   * is the map's business, which is why the edit form's city chooser offers no
   * way to add one. It still *shows* them, in that chooser and in the currency
   * a price is written in, and `data-freshness` says no list a person can see
   * may be left out of the re-read. Held as a prop and never refreshed, a city
   * renamed on the map stayed stale in an open calendar until the page was
   * reloaded.
   */
  const [cities, , refreshCities] = useRows<City>(initialCities)

  /**
   * The trip being read, out of the list that holds it.
   *
   * Derived rather than held beside the list, the same way the map does it: a
   * rename writes to one place and everything on screen reads it. Falling back
   * to what the server resolved covers the trip having left the list under a
   * re-read — somebody else archived it — because going on showing the trip
   * that is open beats emptying the screen out from under whoever is reading
   * it.
   */
  const trip = trips.find((each) => each.id === initialTrip.id) ?? initialTrip

  /**
   * What to call the reader on the account control.
   *
   * Their member name when their account matches one, and `Account` when it does
   * not — which is ordinary rather than broken, since a member row exists before
   * the account does.
   */
  const youAre =
    members.find((member) => member.id === ownMemberId)?.displayName ?? 'Account'

  const [message, setMessage] = useState<string | null>(null)
  const [conflict, setConflict] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [openMarkerId, setOpenMarkerId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  /**
   * Which of the bar's menus is open, as one value.
   *
   * The same rule the map states and for the same reason: only one panel in the
   * bar may be open at a time, and that is a fact about the whole bar — no
   * control can enforce it about panels it cannot see.
   */
  const [detour, setDetour] = useState<'none' | 'trip' | 'account'>('none')

  /**
   * Everything the trip's own menu does, shared with the map.
   *
   * The two addresses are what differ. Choosing a trip stays on the calendar
   * and goes to *that* trip's calendar — rather than returning to the map to
   * get there — and it carries no `day`, so the opening-day rule decides
   * afresh. A day from one trip means nothing in another: two trips rarely
   * cover the same dates, so the day carried across lands outside the trip
   * arrived at and the calendar opens on an empty day, which reads as a trip
   * with nothing planned.
   *
   * Archiving leaves for the map, because the map is the screen that knows how
   * to explain having no trips — it is where a first one is made. This screen
   * can only say there is no trip here to show a calendar for.
   */
  const tripActions = useTripActions({
    supabase,
    trip,
    trips,
    setTrips,
    setMembers,
    report: setMessage,
    addressOfTrip: (tripId) => `/calendar?trip=${tripId}`,
    addressAfterArchive: '/',
  })

  /**
   * The day being read lives in the address.
   *
   * So a reload lands where somebody was, and so a link to a day is a link to
   * that day. Falls back to the day the trip makes most sense to open on rather
   * than to a constant: today while the trip is happening, its start date
   * otherwise, and today for the many trips carrying no dates at all.
   */
  /**
   * The day being read is client state, and the address follows it.
   *
   * It used to be the other way round — read from `useSearchParams`, written
   * with `router.replace` — and that was a real cost rather than a stylistic
   * one. `/calendar` is a dynamic route, so changing a search parameter through
   * the router re-runs the page's server component, which awaits five queries:
   * the trips, and then this trip's markers, cities, interest and members.
   * Stepping through a fortnight a day at a time asked the database seventy
   * times for a list that was already in memory.
   *
   * Nothing about a day needs the server. The whole trip is fetched once and
   * grouped by `groupMarkersByDay`; every day of it is already here.
   *
   * Seeded from the address so a reload or a shared link still opens where it
   * says, and falls back to the day this trip makes most sense to open on.
   */
  const [day, setDay] = useState<IsoDay>(() =>
    dayShown(searchParams.get('day'), trip),
  )

  const goToDay = useCallback(
    (next: IsoDay) => {
      setDay(next)

      /*
       * `history.replaceState`, not `router.replace`.
       *
       * The address has to stay honest — somebody who reloads, or sends the
       * link to whoever they are travelling with, should land on the day they
       * were reading. But that is all it is for, and going through the router
       * would buy it at the price of the five queries above.
       *
       * Replaced rather than pushed, so stepping through a fortnight does not
       * bury the page somebody arrived from under fourteen entries of Back.
       */
      const params = new URLSearchParams(window.location.search)
      params.set('day', next)
      window.history.replaceState(null, '', `/calendar?${params.toString()}`)
    },
    [],
  )

  /**
   * Every list this screen shows, read again.
   *
   * The reason these lists are `useRows` rather than plain state. Each declines
   * if it was read inside `FRESH_FOR_MS`, so calling this twice in a second
   * costs one round of requests — the floor is held by the list rather than by
   * whatever asked for the read.
   *
   * Every list this screen shows is here, which is what the specification asks
   * for: the cities are included even though this screen cannot change one,
   * because it displays them and a list a person can see may not be left out.
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
   * Coming back to the tab is how somebody learns that the person they are
   * planning with changed something. It is the only automatic trigger: no
   * polling, no interval, and nothing holding a connection open.
   *
   * **This screen did not do it, and nothing said so.** `data-freshness`
   * requires every screen in the application to re-read what it is showing when
   * the document becomes visible again, and the map has always called this — but
   * the calendar never did, so a place somebody else dated did not arrive until
   * the page was reloaded. It was hidden by the web account menu's `Refresh`
   * row, which this change removed: that row is forbidden on web by the same
   * specification, and it was standing in for the trigger that should have been
   * here.
   */
  useVisibleAgain(() => void rereadEverything())

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
     * The day being read does not move.
     *
     * This used to follow the place to whatever day it had just been given, on
     * the reasoning that staying put would leave somebody on a day the place is
     * no longer on with nothing to show the save had worked. That reasoning was
     * wrong: saving returns to the details card, and the card states the new
     * day. The save is already confirmed, in front of them.
     *
     * Moving them as well costs the thing they were doing. Working through the
     * places with no day yet is a queue — assign one, get carried off to its
     * day, navigate back — and the queue is reachable from every day, so there
     * was never a reason to leave the one they were on. A place moved off the
     * day being read simply leaves the column, which is the whole answer.
     */
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
    <ChromeBar
      scope={
        <TripBar
          trip={trip}
          trips={trips}
          members={members}
          onSelect={tripActions.onSelect}
          onRename={tripActions.onRename}
          onSetDates={tripActions.onSetDates}
          /*
            The map, because this is the calendar. The menu names the view
            somebody is *not* in, so it never offers to take them where they
            already are — and the address is the one that restores the city as
            well as the trip.
          */
          otherView={{ name: 'Map', href: workspaceHref }}
          archived={tripActions.archived}
          onRevealArchived={tripActions.onRevealArchived}
          onArchive={tripActions.onArchive}
          onRestore={tripActions.onRestore}
          onInvite={tripActions.onInvite}
          onShowPeople={() =>
            void refreshMembers(() => fetchTripMembers(supabase, trip.id))
          }
          onCreated={tripActions.onSelect}
          open={detour === 'trip'}
          onOpen={(open) => setDetour(open ? 'trip' : 'none')}
        />
      }
      /*
        No city. There is no camera to frame here and nowhere to bias a search
        toward, so a city control would offer more than it can do — and leaving
        the position empty is what collapses the phone-width bar to one row.
      */
      session={
        /*
          The way back, in the band the map spends on finding, dropping and
          filtering.

          That band is empty on this screen and going back is the only session
          control it has, so this is where the chrome's placement rule puts it.
          Deliberately *not* beside the account: signing out is reached from
          there, and rare destructive controls are kept away from frequent ones
          so that neither is reached while aiming for the other. This is the
          most frequent control on the screen.

          Visible without opening anything, which the row in the trip's menu is
          not — a control that has to be revealed before it can be seen does not
          satisfy the requirement on its own.
        */
        <span className={styles.session}>
          <Link href={workspaceHref} className={styles.back}>
            <MapIcon size={16} strokeWidth={2.2} aria-hidden />
            <span>Back to the map</span>
          </Link>
        </span>
      }
      account={
        <AccountMenu
          youAre={youAre}
          open={detour === 'account'}
          onOpen={(open) => setDetour(open ? 'account' : 'none')}
        />
      }
    >
    <main className={styles.screen}>
      {/*
        The day controls, and they belong to the screen rather than to the
        product.

        Below the header and not among its controls: the header says which trip
        and who is reading it, and neither changes as the day does. Pinned
        between the header and the scrolling body rather than inside that body,
        because a screen whose navigation scrolls away strands whoever is at the
        bottom of a long day.
      */}
      <div className={styles.dayBand}>
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
      </div>

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
    </main>
    </ChromeBar>
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
      <ul className={`${styles.list} ${styles.waitingList}`}>
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
