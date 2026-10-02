'use client'

import { formatWalkingDistance, type Marker } from '@pinpoint/core'
import {
  distanceKm,
  driftTolerance,
  hasDrifted,
  type LngLat,
  markerTypeOf,
  NEARBY_FAR_KM,
  NEARBY_ROUGH_METRES,
  orderByDistance,
} from '@pinpoint/map'
import { message, type Message } from '@pinpoint/wording'
import { RotateCw } from 'lucide-react'
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'

import { useLanguage, useSay } from '@/app/_components/language'
import { MarkerGlyph } from '@/app/_components/marker-icon'
import { markerTypeMessage } from '@/app/_components/marker-type-name'
import { Menu, toolGlyphClass, toolLabelClass } from '@/app/_components/ui'
import type { WhereAmI } from '@/lib/where-am-i'

import styles from './nearby-bar.module.css'

/** Where the list was left, for coming back to it after a place is closed. */
export interface NearbyReturn {
  order: readonly string[]
  offset: number
}

export type NearbyBarLiveProps = {
  waiting?: false
  open: boolean
  onOpen: (open: boolean) => void
  /** The places the map is showing under the current filter. */
  places: readonly Marker[]
  narrowed: boolean
  whereAmI: WhereAmI
  /** The middle of the visible map, read when the panel opens. */
  mapCentre: LngLat | null
  cityNameOf: (marker: Marker) => string | null
  /** Where to pick up, when this opening is a return from a place. */
  resume: NearbyReturn | null
  onChoose: (marker: Marker, left: NearbyReturn) => void
}

export type NearbyBarProps = NearbyBarLiveProps | { waiting: true }

/**
 * The trip's places, nearest first (`nearby-places`), as a panel hanging from
 * its trigger — and, below 700px, rising from the bottom edge as every panel in
 * this bar does. `Menu` owns both shapes; this owns what is in them.
 *
 * The laptop half of `apps/mobile/components/nearby-sheet.tsx`: the same order
 * from `@pinpoint/map`, the same distances from `@pinpoint/core`, the same
 * sentences. The one difference is the refusal, which says where to look — a
 * site cannot open the browser's settings.
 */
export function NearbyBar(props: NearbyBarProps) {
  const say = useSay()
  if (props.waiting) {
    return (
      <Menu
        name={say(message('nearby.tool'))}
        hint={say(message('nearby.hint'))}
        label={<NearbyLabel />}
        align="end"
        open={false}
        onOpen={() => {}}
        disabled
      >
        {null}
      </Menu>
    )
  }
  return (
    <Menu
      name={say(message('nearby.tool'))}
      hint={say(message('nearby.hint'))}
      label={<NearbyLabel />}
      align="end"
      open={props.open}
      onOpen={props.onOpen}
    >
      {props.open ? <NearbyList {...props} /> : null}
    </Menu>
  )
}

/** A glyph and a word, spelled twice for the two shapes, as `Filter` is. */
function NearbyLabel() {
  const say = useSay()
  return (
    <>
      <span className={styles.mark}>
        <NearbyGlyph className={toolGlyphClass} />
      </span>
      <span className={styles.wideLabel}>{say(message('nearby.tool'))}</span>
      <span className={toolLabelClass}>{say(message('nearby.tool'))}</span>
    </>
  )
}

/**
 * A pin beside the lines of a list. The phone draws the same paths in its own
 * `nearby-glyph.tsx`; no icon in the set says "places, by distance".
 */
function NearbyGlyph({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d="M14 6h7M14 12h7M14 18h7" />
      <path d="M10 9c0 3.5-4 7.5-4 7.5S2 12.5 2 9a4 4 0 0 1 8 0Z" />
      <circle cx="6" cy="9" r="1.2" />
    </svg>
  )
}

function NearbyList({
  places,
  narrowed,
  whereAmI,
  mapCentre,
  cityNameOf,
  resume,
  onChoose,
}: NearbyBarLiveProps) {
  const say = useSay()
  const language = useLanguage()

  const fix = whereAmI.fix
  const fromYou = fix !== null
  const from: LngLat | null = fix ?? mapCentre

  /*
    Opening Nearby is asking where you are, once the answer has been yes
    (`device-location`). This list mounts when the panel opens, so mounting is
    opening — and a permission granted while it is open, from the address bar,
    is the other moment worth asking.
  */
  useEffect(() => {
    // Only when nothing is known yet: once a position has been found, the
    // follow behind the map's dot keeps it current, and asking again would
    // make the person wait for something already on screen.
    if (
      whereAmI.fix === null &&
      whereAmI.permission === 'granted' &&
      whereAmI.status !== 'finding'
    ) {
      void whereAmI.locate()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [whereAmI.permission])

  const distances = useMemo(() => {
    const map = new Map<string, number>()
    if (from) for (const place of places) map.set(place.id, distanceKm(from, place))
    return map
  }, [places, from])

  const fresh = () =>
    from ? orderByDistance(places, from).map((row) => row.id) : places.map((place) => place.id)

  /*
    Held, not derived: fresh on opening (or as left, on a return), fresh again
    when the point becomes the person, and fresh when the set itself changes.
    Between those the distances follow and the rows stay put.
  */
  const [order, setOrder] = useState<readonly string[]>(() => resume?.order ?? fresh())
  const placeKey = places.map((place) => place.id).sort().join(',')
  const [heldFor, setHeldFor] = useState({ fromYou, placeKey })
  if (heldFor.fromYou !== fromYou || heldFor.placeKey !== placeKey) {
    setHeldFor({ fromYou, placeKey })
    setOrder(fresh())
  }

  /* The list scrolls inside `Menu`'s panel, which this cannot hold a ref to. */
  const root = useRef<HTMLDivElement | null>(null)
  const scroller = () => root.current?.closest<HTMLElement>('[role="group"]') ?? null
  useLayoutEffect(() => {
    const element = scroller()
    if (element && resume) element.scrollTop = resume.offset
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const byId = useMemo(() => new Map(places.map((place) => [place.id, place])), [places])
  const rows = order.map((id) => byId.get(id)).filter((place) => place !== undefined)

  const drifted =
    from !== null &&
    hasDrifted(order, distances, fromYou ? driftTolerance(fix?.accuracy ?? null) : undefined)

  const rough =
    fix !== null && fix.accuracy !== null && fix.accuracy > NEARBY_ROUGH_METRES
      ? fix.accuracy / 1000
      : null

  let line: {
    text: Message
    hint?: Message
    action?: { label: Message; onPress: () => void }
  } | null = null
  if (whereAmI.status === 'finding') {
    line = { text: message('nearby.finding') }
  } else if (fix === null && (whereAmI.status === 'refused' || whereAmI.permission === 'refused')) {
    line = { text: message('map.locationBlocked') }
  } else if (fix === null && whereAmI.status === 'notFound') {
    line = {
      text: message('map.locationNotFound'),
      action: { label: message('common.tryAgain'), onPress: () => void whereAmI.locate() },
    }
  } else if (fix === null && whereAmI.permission === 'unknown') {
    line = {
      text: message('nearby.offer'),
      hint: message('nearby.offerHint'),
      action: { label: message('nearby.useLocation'), onPress: () => void whereAmI.locate() },
    }
  } else if (rough !== null) {
    line = { text: message('nearby.rough', { distance: say(formatWalkingDistance(language, rough)) }) }
  }

  return (
    <div ref={root} className={styles.body}>
      <div className={styles.head}>
        <div className={styles.headText}>
          <h2 className={styles.title}>{say(message(fromYou ? 'nearby.fromYou' : 'nearby.fromMap'))}</h2>
          <p className={styles.sub}>
            {narrowed ? (
              <span className={styles.filtered}>
                {say(message('nearby.filtered'))}
                {' · '}
              </span>
            ) : null}
            {say(message('city.placeCount', { count: places.length }))}
          </p>
        </div>
        {drifted ? (
          <button
            type="button"
            className={styles.resort}
            onClick={() => setOrder(fresh())}
            title={say(message('nearby.resortHint'))}
          >
            <RotateCw aria-hidden size={13} strokeWidth={2.4} />
            {say(message('nearby.resort'))}
          </button>
        ) : null}
      </div>

      {line ? (
        <div className={styles.line} role="status">
          {whereAmI.status === 'finding' ? <span aria-hidden className={styles.spinner} /> : null}
          <span className={styles.lineText}>
            {say(line.text)}
            {line.hint ? <small className={styles.lineHint}>{say(line.hint)}</small> : null}
          </span>
          {line.action ? (
            <button type="button" className={styles.lineAction} onClick={line.action.onPress}>
              {say(line.action.label)}
            </button>
          ) : null}
        </div>
      ) : null}

      {places.length === 0 ? <p className={styles.empty}>{say(message('map.noPlacesYet'))}</p> : null}

      <ul className={styles.rows}>
        {rows.map((place) => {
          const km = distances.get(place.id)
          const definition = markerTypeOf(place.type)
          const city = cityNameOf(place)
          return (
            <li key={place.id}>
              <button
                type="button"
                className={styles.row}
                onClick={() =>
                  onChoose(place, { order, offset: scroller()?.scrollTop ?? 0 })
                }
              >
                <span
                  className={styles.glyph}
                  style={{ backgroundColor: `var(--pp-pin-${definition.id})` }}
                  title={say(markerTypeMessage(definition.id))}
                >
                  <MarkerGlyph icon={definition.icon} size={14} />
                </span>
                <span className={styles.rowText}>
                  <span className={`${styles.name} ${place.visited ? styles.visitedName : ''}`}>
                    {place.name}
                  </span>
                  <span className={styles.meta}>
                    {city ?? say(message('empty.city'))}
                    {place.visited ? (
                      <span className={styles.visited}>
                        {' · '}
                        {say(message('visited.on'))}
                      </span>
                    ) : null}
                  </span>
                </span>
                {km === undefined ? null : (
                  <span className={`${styles.distance} ${km > NEARBY_FAR_KM ? styles.far : ''}`}>
                    {say(formatWalkingDistance(language, km))}
                  </span>
                )}
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
