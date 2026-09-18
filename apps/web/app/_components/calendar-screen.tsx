'use client'

import {
  addDays,
  formatDay,
  formatDayFull,
  formatDayShort,
  type IsoDay,
  type Marker,
  type WaitingGroup,
} from '@pinpoint/core'
import { markerView } from '@pinpoint/map'
import { ChevronLeft, ChevronRight, MapIcon } from 'lucide-react'
import Link from 'next/link'
import { type KeyboardEvent, type ReactNode, useId, useState } from 'react'

import { AccountMenu } from '@/app/_components/account-menu'
import { ChromeBar } from '@/app/_components/chrome-bar'
import { TypeChip } from '@/app/_components/pin'
import { TripBar } from '@/app/_components/trip-bar'
import { NamePlaceholder } from '@/app/_components/ui'

import styles from './trip-calendar.module.css'

/**
 * The calendar screen, drawn from what it has been given — or from nothing yet.
 *
 * One definition for both moments, which is what `trip-calendar` asks for and
 * the reason this is not a second component built to look like the first. With
 * `live` it is the screen `TripCalendar` owns; with `null` it is what stands
 * while the route's reads are running (`app/calendar/loading.tsx`), in the same
 * places and at the same sizes, so that the data arriving replaces bars where
 * they stand instead of arriving as a new screen.
 *
 * Everything that holds state or talks to the database stays in
 * `TripCalendar`. The only state here is which of the narrow shape's two views
 * is shown, which is about the screen rather than the trip — and resets on each
 * arrival because this remounts with its owner.
 */

/** How many days sit either side of the one being read, where there is room. */
export const NEIGHBOURS = 1

/**
 * The place-shaped rows drawn while the places are being read.
 *
 * Fixed, and the same for every trip: a number that followed the trip would be
 * a count, and the count is exactly what is not known yet. The widths vary per
 * row so a column reads as places rather than as a barcode.
 */
const WAITING_DAY_ROWS: readonly (readonly string[])[] = [
  ['62%', '44%', '71%'],
  ['55%', '74%', '40%'],
  ['68%', '47%', '58%'],
]
const WAITING_CITY_GROUPS: readonly { name: string; rows: readonly string[] }[] = [
  { name: '7ch', rows: ['64%', '48%', '72%'] },
  { name: '5ch', rows: ['56%', '70%'] },
]

export type CalendarBindings = {
  /** The trip's own menu, bound by the owner — it needs the trip's actions. */
  scope: ReactNode
  /** The account control, likewise. */
  account: ReactNode
  /** The way back, carrying the trip and the city. */
  workspaceHref: string
  day: IsoDay
  onGoToDay: (day: IsoDay) => void
  message: string | null
  waiting: readonly WaitingGroup[]
  waitingCount: number
  markersOn: (day: IsoDay) => readonly Marker[]
  onOpen: (marker: Marker) => void
}

export function CalendarScreen({
  live,
  children,
}: {
  live: CalendarBindings | null
  /** What opens over the screen — the details card and the form. */
  children?: ReactNode
}) {
  /*
   * Which of the two views the narrow shape shows.
   *
   * Always starts on the days, and is written nowhere — not the address, not
   * storage — so every arrival opens the same way. Changing trip remounts the
   * owner (`key={trip.id}` on the page), which is arriving at that trip and
   * resets this without anything having to.
   *
   * It is only *read* by the stylesheet, and only below 900px. The wide shape
   * shows the waiting places beside the days whatever this says, so the shape
   * is decided by CSS alone and the server's first paint cannot disagree with
   * the browser's first render about it.
   */
  const [view, setView] = useState<CalendarView>('days')
  const viewIds = useId()

  const days = live
    ? [-NEIGHBOURS, 0, NEIGHBOURS].map((offset) => addDays(live.day, offset))
    : null

  return (
    <ChromeBar
      scope={live ? live.scope : <TripBar waiting />}
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

          Inert while waiting rather than guessed at: the route's loading screen
          is not told which trip it is for, so there is no address to go back to
          yet. Still focusable and still announced, as the chrome's inert rule
          asks.
        */
        <span className={styles.session}>
          {live ? (
            <Link href={live.workspaceHref} className={styles.back}>
              <MapIcon size={16} strokeWidth={2.2} aria-hidden />
              <span>Back to the map</span>
            </Link>
          ) : (
            <a role="link" aria-disabled="true" tabIndex={0} className={styles.back}>
              <MapIcon size={16} strokeWidth={2.2} aria-hidden />
              <span>Back to the map</span>
            </a>
          )}
        </span>
      }
      account={live ? live.account : <AccountMenu waiting />}
    >
      <main
        className={styles.screen}
        data-view={view}
        aria-busy={live ? undefined : true}
      >
        {live ? null : (
          <p role="status" className={styles.visuallyHidden}>
            Loading the calendar
          </p>
        )}

        <ViewTabs
          view={view}
          onChange={setView}
          waitingCount={live ? live.waitingCount : null}
          ids={viewIds}
        />

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
          {live ? (
            <div className={styles.controls}>
              <button
                type="button"
                onClick={() => live.onGoToDay(addDays(live.day, -1))}
                className={styles.step}
                /*
                  Named in words, in every rendering. An arrow conveys nothing to a
                  screen reader, and "previous" alone conveys only that there is one
                  — the day it leads to is what the screen is showing and what the
                  control therefore has to say.
                */
                aria-label={`Previous day, ${formatDayFull(addDays(live.day, -1))}`}
              >
                <ChevronLeft size={18} strokeWidth={2.2} aria-hidden />
              </button>

              <label className={styles.picker}>
                <span className={styles.pickerLabel}>Day</span>
                <input
                  type="date"
                  value={live.day}
                  onChange={(event) => {
                    // An emptied date control must not navigate to nowhere. There
                    // is no "no day" to be on; the day being read is always a day.
                    if (event.target.value !== '') live.onGoToDay(event.target.value)
                  }}
                  className={styles.pickerInput}
                />
              </label>

              <button
                type="button"
                onClick={() => live.onGoToDay(addDays(live.day, 1))}
                className={styles.step}
                aria-label={`Next day, ${formatDayFull(addDays(live.day, 1))}`}
              >
                <ChevronRight size={18} strokeWidth={2.2} aria-hidden />
              </button>
            </div>
          ) : (
            /*
              The same three controls, inert. The day is not known until the trip
              is — which day to open on depends on its dates — so the field holds
              a drawn bar where the date will be rather than a date that might be
              wrong.
            */
            <div className={styles.controls}>
              <button
                type="button"
                aria-disabled="true"
                className={styles.step}
                aria-label="Previous day"
              >
                <ChevronLeft size={18} strokeWidth={2.2} aria-hidden />
              </button>

              <label className={styles.picker}>
                <span className={styles.pickerLabel}>Day</span>
                <button
                  type="button"
                  aria-disabled="true"
                  className={styles.pickerInput}
                >
                  <NamePlaceholder className={styles.nameHolder} measure="10ch" />
                </button>
              </label>

              <button
                type="button"
                aria-disabled="true"
                className={styles.step}
                aria-label="Next day"
              >
                <ChevronRight size={18} strokeWidth={2.2} aria-hidden />
              </button>
            </div>
          )}
        </div>

        <div className={styles.body}>
          {live?.message ? (
            <p role="alert" className={styles.message}>
              {live.message}
            </p>
          ) : null}

          <div className={styles.board}>
            <Waiting
              groups={live ? live.waiting : null}
              count={live ? live.waitingCount : null}
              id={`${viewIds}-waiting`}
              labelledBy={`${viewIds}-waiting-tab`}
              onOpen={live ? live.onOpen : () => {}}
            />

            <div
              className={styles.days}
              id={`${viewIds}-days`}
              role="tabpanel"
              aria-labelledby={`${viewIds}-days-tab`}
            >
              {live && days
                ? days.map((each, index) => (
                    <DayColumn
                      key={each}
                      day={each}
                      current={index === NEIGHBOURS}
                      markers={live.markersOn(each)}
                      onOpen={live.onOpen}
                    />
                  ))
                : WAITING_DAY_ROWS.map((rows, index) => (
                    <WaitingDayColumn
                      key={index}
                      current={index === NEIGHBOURS}
                      rows={rows}
                    />
                  ))}
            </div>
          </div>
        </div>

        {children}
      </main>
    </ChromeBar>
  )
}

type CalendarView = 'days' | 'waiting'

/**
 * The switch between the day and the places waiting for one, in the narrow
 * shape.
 *
 * Drawn always and hidden by the stylesheet at 900px and up, where both are on
 * screen at once and a switch would do nothing. `display: none` takes it out of
 * the accessibility tree as well, so nobody is announced tabs that are inert.
 *
 * The count rides on the second tab so it is legible from either view — the
 * specification asks for it without anything being opened, and the tab is the
 * only thing about the waiting places that the days view shows.
 *
 * Live while the screen is waiting, because switching view is an act that can
 * complete without the trip: both views are drawn, rows and all.
 */
function ViewTabs({
  view,
  onChange,
  waitingCount,
  ids,
}: {
  view: CalendarView
  onChange: (view: CalendarView) => void
  waitingCount: number | null
  ids: string
}) {
  // Arrow keys move between the two, as a tab list is expected to.
  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
    event.preventDefault()
    const next: CalendarView = view === 'days' ? 'waiting' : 'days'
    onChange(next)
    document.getElementById(`${ids}-${next}-tab`)?.focus()
  }

  return (
    <div
      className={styles.tabs}
      role="tablist"
      aria-label="Calendar"
      onKeyDown={onKeyDown}
    >
      <button
        type="button"
        role="tab"
        id={`${ids}-days-tab`}
        aria-controls={`${ids}-days`}
        aria-selected={view === 'days'}
        tabIndex={view === 'days' ? 0 : -1}
        onClick={() => onChange('days')}
        className={styles.tab}
      >
        Days
      </button>
      <button
        type="button"
        role="tab"
        id={`${ids}-waiting-tab`}
        aria-controls={`${ids}-waiting`}
        aria-selected={view === 'waiting'}
        tabIndex={view === 'waiting' ? 0 : -1}
        onClick={() => onChange('waiting')}
        className={styles.tab}
      >
        No day yet
        <WaitingCount count={waitingCount} />
      </button>
    </div>
  )
}

/**
 * How many places are waiting, as a badge.
 *
 * Washed in the accent while there is something to do and muted when there is
 * not. The lettering is `accent-ink` on `accent-wash`, which is the pair that
 * stays apart on both grounds — not `accent-ink` on `accent`, which converges
 * to one colour on the dark ground.
 *
 * `null` is a count not yet read: the muted pill with a bar in it rather than a
 * number, because zero would be a claim.
 */
function WaitingCount({ count }: { count: number | null }) {
  if (count === null) {
    return (
      <span className={`${styles.count} ${styles.countNone}`} aria-hidden>
        <NamePlaceholder className={styles.nameHolderInline} measure="1.5ch" />
      </span>
    )
  }

  return (
    <span className={`${styles.count} ${count === 0 ? styles.countNone : ''}`}>
      <span aria-hidden>{count}</span>
      <span className={styles.visuallyHidden}>
        {count === 1 ? ', 1 place' : `, ${count} places`}
      </span>
    </span>
  )
}

/**
 * The places still waiting for a day, one group per city.
 *
 * Beside the days where there is room, open and scrolling by itself, because
 * the work of this screen is taking a place from here and putting it on a day
 * — with both in view, a person sees it leave one and arrive on the other. In
 * the narrow shape it is the second of the two views instead, one press away.
 *
 * Never collapsed, and **present when the count is zero**. A region that
 * appears and disappears moves everything beside it, so the screen would
 * rearrange itself at the moment the last place is dated — which is the moment
 * somebody is most likely to still be reading it.
 *
 * Grouped by city because a day is commonly spent in one, and the order of the
 * groups comes from `@pinpoint/core` so the phone lists them identically.
 *
 * `null` groups are places not yet read: two groups of drawn rows, never the
 * "Nothing waiting" line, which would say something not yet known.
 */
function Waiting({
  groups,
  count,
  id,
  labelledBy,
  onOpen,
}: {
  groups: readonly WaitingGroup[] | null
  count: number | null
  id: string
  labelledBy: string
  onOpen: (marker: Marker) => void
}) {
  return (
    <section
      className={styles.waiting}
      id={id}
      role="tabpanel"
      aria-labelledby={labelledBy}
    >
      {/* The narrow shape's tab already says this, so the stylesheet hides it
          there. */}
      <div className={styles.waitingHead}>
        <h2 className={styles.waitingTitle}>No day yet</h2>
        <WaitingCount count={count} />
      </div>

      <div className={styles.waitingList}>
        {groups === null ? (
          WAITING_CITY_GROUPS.map((group, index) => (
            <div key={index} className={styles.cityGroup} aria-hidden>
              <p className={styles.cityName}>
                <NamePlaceholder className={styles.nameHolder} measure={group.name} />
              </p>
              <ul className={styles.list}>
                {group.rows.map((width, row) => (
                  <WaitingRow key={row} width={width} />
                ))}
              </ul>
            </div>
          ))
        ) : groups.length === 0 ? (
          <p className={styles.waitingEmpty}>Nothing waiting for a day.</p>
        ) : (
          groups.map((group) => (
            <div key={group.city?.id ?? 'unassigned'} className={styles.cityGroup}>
              {/* `Unassigned` is what the city control calls a place filed
                  under no city, so the product has one name for them. */}
              <h3 className={styles.cityName}>
                {group.city?.name ?? 'Unassigned'} · {group.markers.length}
              </h3>
              <ul className={styles.list}>
                {group.markers.map((marker) => (
                  <PlaceRow key={marker.id} marker={marker} onOpen={onOpen} />
                ))}
              </ul>
            </div>
          ))
        )}
      </div>
    </section>
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

/**
 * A day not yet read: its column, a bar where its name goes, and drawn rows.
 *
 * Hidden from assistive technology as a whole. The screen's status already says
 * the calendar is loading, and a column of unlabelled shapes read out one by one
 * would say nothing more.
 */
function WaitingDayColumn({
  current,
  rows,
}: {
  current: boolean
  rows: readonly string[]
}) {
  return (
    <section
      className={`${styles.day} ${current ? styles.dayCurrent : styles.dayNeighbour}`}
      aria-hidden
    >
      <h2 className={styles.dayName}>
        <NamePlaceholder className={styles.nameHolder} measure="14ch" />
      </h2>
      <ul className={styles.list}>
        {rows.map((width, index) => (
          <WaitingRow key={index} width={width} />
        ))}
      </ul>
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

/**
 * A place not yet read, in the shape of `PlaceRow`.
 *
 * The same row class and the same name class, so the two come to the same height
 * by the same rules rather than by a number copied between them: the chip block
 * is the chip's 26px, and the name block is one line of the name's own type.
 */
function WaitingRow({ width }: { width: string }) {
  return (
    <li>
      <span className={`${styles.place} ${styles.placeWaiting}`}>
        <span className={`${styles.block} ${styles.blockChip}`} />
        <span className={styles.placeName}>
          <span className={`${styles.block} ${styles.blockName}`} style={{ width }} />
        </span>
      </span>
    </li>
  )
}
