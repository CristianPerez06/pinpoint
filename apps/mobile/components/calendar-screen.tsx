import {
  addDays,
  formatDay,
  formatDayFull,
  type IsoDay,
  type Marker,
  type WaitingGroup,
} from '@pinpoint/core'
import { markerView } from '@pinpoint/map'
import { RADIUS, SPACE, TYPE } from '@pinpoint/tokens'
// Deep imports, not the package root — see marker-icon.tsx. One value import of
// the barrel pulls all 1767 icons and crashes Hermes.
import ChevronDown from 'lucide-react-native/icons/chevron-down'
import ChevronLeft from 'lucide-react-native/icons/chevron-left'
import ChevronRight from 'lucide-react-native/icons/chevron-right'
import Map from 'lucide-react-native/icons/map'
import { type ReactNode, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { TypeChip } from '@/components/marker-details'
import { DayField, FormNote, NamePlaceholder } from '@/components/ui'
import { useTheme } from '@/lib/theme'
import { role } from '@/lib/type'

/**
 * The calendar screen, drawn from what it has been given — or from nothing yet.
 *
 * One definition for every moment of the wait, which is what `trip-calendar`
 * asks for. The route draws it with nothing while the session and the trips are
 * read; `TripCalendar` draws it with the trip once that is known and with the
 * places once they are. Each part stands where it will stand, at the size it
 * will have, and what arrives replaces a bar or a row where it stands.
 *
 * Two values rather than one, because the phone learns them at different
 * times: `live` is the trip and everything the header and the day controls
 * need, which the route already has; `lists` is the places, which this screen
 * reads for itself afterwards. Until `lists` arrives a day is drawn as rows, not
 * as "Nothing planned" — which is exactly what it said, falsely, before this.
 *
 * Everything that holds state or talks to the database stays in `TripCalendar`.
 * The only state here is which view is shown, which is about the screen rather
 * than the trip.
 */

/**
 * The place-shaped rows drawn while the places are being read.
 *
 * Fixed, and the same for every trip: a number that followed the trip would be
 * a count, and the count is exactly what is not known yet. The laptop draws the
 * same rows for the day being read and the same two groups.
 */
const WAITING_DAY_ROWS = ['55%', '74%', '40%'] as const
const WAITING_CITY_GROUPS = [
  { name: 56, rows: ['64%', '48%', '72%'] },
  { name: 40, rows: ['56%', '70%'] },
] as const

/** The header's own breathing room, above and below its content. */
const HEADER_PAD = SPACE.sm + 2

export type CalendarBindings = {
  tripName: string
  onOpenTrips: () => void
  onOpenMenu: () => void
  onBack: () => void
  day: IsoDay
  onGoToDay: (day: IsoDay) => void
  problem: string | null
  onDismissProblem: () => void
}

export type CalendarLists = {
  onThisDay: readonly Marker[]
  waiting: readonly WaitingGroup[]
  waitingCount: number
  onOpen: (marker: Marker) => void
}

export function CalendarScreen({
  live,
  lists,
  children,
}: {
  live: CalendarBindings | null
  lists: CalendarLists | null
  /** The sheets that open over the screen. */
  children?: ReactNode
}) {
  const theme = useTheme()
  const insets = useSafeAreaInsets()

  /**
   * Which of the two views is shown.
   *
   * Always starts on the day, and is kept nowhere else, so every arrival opens
   * the same way. Changing trip remounts the owner (`key={trip.id}` on the
   * route), which is arriving at that trip and resets this with nothing here
   * having to.
   *
   * Switching works while the screen is waiting, because both views are drawn,
   * rows and all — it is an act that can complete without the trip.
   */
  const [view, setView] = useState<CalendarView>('days')

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

          While waiting, every control is inert — present, announced as
          unavailable, doing nothing — and the trip's name is a drawn bar. The
          menu names nobody, so it has no bar to stand in for.
        */}
        <View style={styles.headerLine}>
          <View style={[styles.dot, { backgroundColor: theme.colour.accent }]} />
          <Pressable
            onPress={live?.onOpenTrips}
            accessibilityRole="button"
            accessibilityLabel={
              live ? `${live.tripName}. Switch or manage trips` : 'Trip'
            }
            accessibilityState={live ? undefined : { disabled: true }}
            hitSlop={6}
            style={styles.tripButton}
          >
            {live ? (
              <Text
                style={[styles.tripName, { color: theme.colour.ink }]}
                numberOfLines={1}
              >
                {live.tripName}
              </Text>
            ) : (
              <NamePlaceholder
                width={120}
                lineHeight={TYPE.title.size * TYPE.title.lineHeight}
              />
            )}
            <ChevronDown size={16} color={theme.colour.inkMuted} strokeWidth={2.4} />
          </Pressable>

          <Pressable
            onPress={live?.onOpenMenu}
            accessibilityRole="button"
            accessibilityLabel="Menu"
            accessibilityState={live ? undefined : { disabled: true }}
            hitSlop={8}
            style={styles.menuButton}
          >
            <Text
              style={[
                styles.menuGlyph,
                { color: live ? theme.colour.ink : theme.colour.inkMuted },
              ]}
            >
              ☰
            </Text>
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
            onPress={live?.onBack}
            accessibilityRole="button"
            accessibilityLabel="Back to the map"
            accessibilityState={live ? undefined : { disabled: true }}
            hitSlop={6}
            style={[
              styles.back,
              live
                ? { borderColor: theme.colour.lineStrong }
                : {
                    borderColor: 'transparent',
                    backgroundColor: theme.colour.surfaceSunk,
                  },
            ]}
          >
            <Map
              size={15}
              color={live ? theme.colour.ink : theme.colour.inkMuted}
              strokeWidth={2.2}
            />
            <Text
              style={[
                styles.backText,
                { color: live ? theme.colour.ink : theme.colour.inkMuted },
              ]}
            >
              Back to the map
            </Text>
          </Pressable>
        </View>
      </View>

      <ViewTabs
        view={view}
        onChange={setView}
        waitingCount={lists ? lists.waitingCount : null}
      />

      {/*
        The day band: pinned between the header and the part that scrolls.

        Below the header rather than among its controls, because the header says
        which trip and who is reading it and neither changes as the day does —
        and outside the scrolling view, because navigation that scrolls away
        strands whoever is at the bottom of a long day.
      */}
      {/* The day controls change nothing about the places waiting, so they
          belong to the day's view alone. */}
      {view === 'days' ? (
        <View style={styles.dayBand}>
          <Step
            direction="previous"
            label={
              live
                ? `Previous day, ${formatDayFull(addDays(live.day, -1))}`
                : 'Previous day'
            }
            onPress={live ? () => live.onGoToDay(addDays(live.day, -1)) : null}
          />

          <View style={styles.picker}>
            <DayField
              label="Day"
              value={live ? live.day : null}
              // The day being read is always a day: there is no "no day" to be on,
              // so this field cannot be cleared and an emptied value cannot arrive.
              clearable={false}
              standalone
              waiting={live === null}
              onChange={(next) => {
                if (live && next !== null) live.onGoToDay(next)
              }}
            />
          </View>

          <Step
            direction="next"
            label={
              live
                ? `Next day, ${formatDayFull(addDays(live.day, 1))}`
                : 'Next day'
            }
            onPress={live ? () => live.onGoToDay(addDays(live.day, 1)) : null}
          />
        </View>
      ) : null}

      {live?.problem != null ? (
        <Pressable
          onPress={live.onDismissProblem}
          accessibilityRole="button"
          accessibilityHint="Dismisses this message"
          style={styles.problem}
        >
          <FormNote tone="danger">{live.problem}</FormNote>
        </Pressable>
      ) : null}

      {/*
        The body does not scroll; the card inside it does.

        The day's name stays put above its places, and the screen around it
        never moves. The card takes `flex: 1` of a body that takes `flex: 1` of
        the screen, so its height is definite — which is what lets the
        `ScrollView` inside it scroll rather than collapse, the failure that
        catches one inside a container sized to its children.
      */}
      {/*
        The places waiting stand a gap below the tabs, as they do on the laptop.
        The day's view needs none here: the day band above it carries its own.

        While the places are being read, the body is one element to assistive
        technology, saying so — the rows inside it are shapes, and read out one
        by one they would say nothing more.
      */}
      <View
        accessible={lists === null}
        accessibilityLabel={lists === null ? 'Loading the calendar' : undefined}
        accessibilityState={lists === null ? { busy: true } : undefined}
        style={[
          styles.body,
          {
            paddingTop: view === 'waiting' ? SPACE.md : 0,
            paddingBottom: SPACE.md + insets.bottom,
          },
        ]}
      >
        {view === 'days' ? (
          <DayCard
            day={live ? live.day : null}
            markers={lists ? lists.onThisDay : null}
            onOpen={lists ? lists.onOpen : () => {}}
          />
        ) : (
          <Waiting
            groups={lists ? lists.waiting : null}
            onOpen={lists ? lists.onOpen : () => {}}
          />
        )}
      </View>

      {children}
    </View>
  )
}

type CalendarView = 'days' | 'waiting'

/**
 * One of the two arrows either side of the day.
 *
 * `onPress: null` is the waiting form: the chrome's inert look — the outline
 * gone and the fill sunk, so it differs from the live one by more than colour —
 * still announced, and doing nothing.
 */
function Step({
  direction,
  label,
  onPress,
}: {
  direction: 'previous' | 'next'
  label: string
  onPress: (() => void) | null
}) {
  const theme = useTheme()
  const inert = onPress === null
  const Glyph = direction === 'previous' ? ChevronLeft : ChevronRight

  return (
    <Pressable
      onPress={onPress ?? undefined}
      accessibilityRole="button"
      /*
        Named in words, in every rendering. An arrow conveys nothing to a
        screen reader, and "previous" alone conveys only that there is one —
        the day it leads to is what the control has to say.
      */
      accessibilityLabel={label}
      accessibilityState={inert ? { disabled: true } : undefined}
      style={[
        styles.step,
        inert
          ? { borderColor: 'transparent', backgroundColor: theme.colour.surfaceSunk }
          : { borderColor: theme.colour.lineStrong, backgroundColor: theme.colour.surface },
      ]}
    >
      <Glyph
        size={18}
        color={inert ? theme.colour.inkMuted : theme.colour.ink}
        strokeWidth={2.2}
      />
    </Pressable>
  )
}

/**
 * The switch between the day and the places waiting for one.
 *
 * Directly under the header and outside the scrolling view, like the day band
 * beneath it: it is how the screen is navigated, and it must not scroll away
 * from whoever is at the bottom of a long day.
 *
 * The count rides on the second tab so it is legible from either view — the
 * tab is the only thing about the waiting places that the day's view shows.
 */
function ViewTabs({
  view,
  onChange,
  waitingCount,
}: {
  view: CalendarView
  onChange: (view: CalendarView) => void
  waitingCount: number | null
}) {
  const theme = useTheme()

  function tab(value: CalendarView, label: string, count?: number | null) {
    const selected = view === value
    return (
      <Pressable
        onPress={() => onChange(value)}
        accessibilityRole="tab"
        accessibilityState={{ selected }}
        accessibilityLabel={
          count === undefined || count === null
            ? label
            : `${label}, ${count === 1 ? '1 place' : `${count} places`}`
        }
        /*
          Outlined as well as lifted: `surface` on `surfaceSunk` is a clear step
          on the light ground and almost none on the dark one, where the brighter
          label was the only sign of which tab was chosen.
        */
        style={[
          styles.tab,
          selected
            ? {
                backgroundColor: theme.colour.surface,
                borderColor: theme.colour.lineStrong,
              }
            : null,
        ]}
      >
        <Text
          style={[
            styles.tabText,
            { color: selected ? theme.colour.ink : theme.colour.inkMuted },
          ]}
        >
          {label}
        </Text>
        {count === undefined ? null : <WaitingCount count={count} />}
      </Pressable>
    )
  }

  return (
    <View
      accessibilityRole="tablist"
      style={[
        styles.tabs,
        { backgroundColor: theme.colour.surfaceSunk, borderColor: theme.colour.line },
      ]}
    >
      {tab('days', 'Days')}
      {tab('waiting', 'No day yet', waitingCount)}
    </View>
  )
}

/**
 * How many places are waiting, as a badge.
 *
 * Washed in the accent while there is something to do and muted when there is
 * not. The lettering is `accentInk` on `accentWash`, the pair that stays apart
 * on both grounds — not `accentInk` on `accent`, which converges to one colour
 * on the dark ground.
 *
 * `null` is a count not yet read: the muted pill with a bar in it rather than a
 * number, because zero would be a claim.
 */
function WaitingCount({ count }: { count: number | null }) {
  const theme = useTheme()

  if (count === null) {
    return (
      <View
        style={[
          styles.count,
          styles.countWaiting,
          { backgroundColor: theme.colour.surfaceMuted },
        ]}
      >
        <NamePlaceholder
          width={12}
          lineHeight={TYPE.numeric.size * TYPE.numeric.lineHeight}
        />
      </View>
    )
  }

  const none = count === 0

  return (
    <Text
      style={[
        styles.count,
        {
          backgroundColor: none ? theme.colour.surfaceMuted : theme.colour.accentWash,
          color: none ? theme.colour.inkMuted : theme.colour.accentInk,
        },
      ]}
    >
      {count}
    </Text>
  )
}

/**
 * The places still waiting for a day, one group per city.
 *
 * The second of the two views, one press away from the day, rather than a
 * region that opens over the day and pushes it down. Its list scrolls inside
 * the card, which takes the height the screen leaves.
 *
 * **Present when the count is zero**, saying so. A region that appears and
 * disappears is a screen that rearranges itself at the moment the last place is
 * dated — which is the moment somebody is most likely to still be reading it.
 *
 * Grouped by city because a day is commonly spent in one, and the order of the
 * groups comes from `@pinpoint/core` so the laptop lists them identically.
 *
 * `null` groups are places not yet read: two groups of drawn rows, never the
 * "Nothing waiting" line, which would say something not yet known.
 */
function Waiting({
  groups,
  onOpen,
}: {
  groups: readonly WaitingGroup[] | null
  onOpen: (marker: Marker) => void
}) {
  const theme = useTheme()

  return (
    <View
      style={[
        styles.card,
        styles.waitingCard,
        { backgroundColor: theme.colour.surface, borderColor: theme.colour.line },
      ]}
    >
      <ScrollView contentContainerStyle={styles.waitingContent}>
        {groups === null ? (
          WAITING_CITY_GROUPS.map((group, index) => (
            <View key={index} style={styles.cityGroup}>
              <View style={styles.cityNameBox}>
                <NamePlaceholder
                  width={group.name}
                  lineHeight={TYPE.label.size * TYPE.label.lineHeight}
                />
              </View>
              {group.rows.map((width, row) => (
                <WaitingRow key={row} width={width} />
              ))}
            </View>
          ))
        ) : groups.length === 0 ? (
          /*
            `inkMuted`, never `inkFaint`. This says nothing is left to do, which
            somebody is meant to read.
          */
          <Text style={[styles.waitingEmpty, { color: theme.colour.inkMuted }]}>
            Nothing waiting for a day.
          </Text>
        ) : (
          groups.map((group) => (
            <View key={group.city?.id ?? 'unassigned'} style={styles.cityGroup}>
              {/* `Unassigned` is what the city control calls a place filed
                  under no city, so the product has one name for them. */}
              <Text
                accessibilityRole="header"
                style={[styles.cityName, { color: theme.colour.inkMuted }]}
              >
                {group.city?.name ?? 'Unassigned'} · {group.markers.length}
              </Text>
              {group.markers.map((marker) => (
                <PlaceRow key={marker.id} marker={marker} onOpen={onOpen} />
              ))}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  )
}

/**
 * One day, and what is on it.
 *
 * `day: null` is a day not yet known — the trip decides which day opens — so
 * its name is a bar. `markers: null` is a day whose places are not yet read, so
 * it holds drawn rows rather than "Nothing planned".
 */
function DayCard({
  day,
  markers,
  onOpen,
}: {
  day: IsoDay | null
  markers: readonly Marker[] | null
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
      accessibilityLabel={day ? formatDayFull(day) : undefined}
    >
      {/* Outside the scroll, so the day's name stays put above its places. */}
      {day ? (
        <Text style={[styles.dayName, { color: theme.colour.ink }]}>
          {formatDay(day)}
        </Text>
      ) : (
        <NamePlaceholder
          width={150}
          lineHeight={TYPE.rowName.size * TYPE.rowName.lineHeight}
        />
      )}

      <ScrollView contentContainerStyle={styles.dayContent}>
        {markers === null ? (
          WAITING_DAY_ROWS.map((width, index) => (
            <WaitingRow key={index} width={width} />
          ))
        ) : markers.length === 0 ? (
          // An empty day is the ordinary state of most days on most trips, and
          // it is information. It is said, not left blank and not drawn as a
          // fault.
          <Text style={[styles.dayEmpty, { color: theme.colour.inkMuted }]}>
            Nothing planned.
          </Text>
        ) : (
          markers.map((marker) => (
            <PlaceRow key={marker.id} marker={marker} onOpen={onOpen} />
          ))
        )}
      </ScrollView>
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

/**
 * A place not yet read, in the shape of `PlaceRow`.
 *
 * The same row style, a block the chip's size and a block one line of the
 * name's type tall — so the two rows come to the same height by the same rules
 * rather than by a number copied between them. `surfaceMuted`, no animation:
 * the search list's waiting rows, which `DESIGN.md` keeps still.
 */
function WaitingRow({ width }: { width: `${number}%` }) {
  const theme = useTheme()

  return (
    <View style={styles.place}>
      <View
        style={[styles.blockChip, { backgroundColor: theme.colour.surfaceMuted }]}
      />
      <View style={styles.placeNameBox}>
        <View
          style={[
            styles.blockName,
            { width, backgroundColor: theme.colour.surfaceMuted },
          ]}
        />
      </View>
    </View>
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
   * Starting at the point's left edge, not indented to the trip's name — where
   * the laptop's bar puts the same control once it takes the phone shape, so
   * the two applications draw it in the same place.
   */
  backLine: { flexDirection: 'row', marginTop: SPACE.xs },
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
  body: { flex: 1, paddingHorizontal: SPACE.md },
  card: { borderWidth: 1, borderRadius: RADIUS.lg },
  dayCard: { flex: 1, padding: SPACE.md, gap: SPACE.xs },
  dayContent: { gap: SPACE.xs },
  tabs: {
    flexDirection: 'row',
    gap: SPACE.xs,
    marginHorizontal: SPACE.md,
    marginTop: SPACE.md,
    padding: 3,
    borderWidth: 1,
    borderRadius: RADIUS.md,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACE.sm,
    minHeight: 36,
    paddingHorizontal: SPACE.sm,
    // Transparent until chosen, so choosing does not shift the label.
    borderWidth: 1,
    borderColor: 'transparent',
    borderRadius: RADIUS.sm,
  },
  tabText: { ...role(TYPE.control), fontWeight: '600' },
  count: {
    ...role(TYPE.numeric),
    fontWeight: '700',
    overflow: 'hidden',
    minWidth: 22,
    textAlign: 'center',
    borderRadius: RADIUS.pill,
    paddingVertical: 1,
    paddingHorizontal: SPACE.sm,
  },
  /* The pill's own box, holding a bar instead of a number. */
  countWaiting: { alignItems: 'center' },
  waitingCard: { flex: 1, overflow: 'hidden' },
  waitingContent: { padding: SPACE.sm, gap: SPACE.sm },
  waitingEmpty: { ...role(TYPE.note), padding: SPACE.sm },
  cityGroup: { gap: 2 },
  cityName: {
    ...role(TYPE.label),
    paddingHorizontal: SPACE.sm,
    paddingTop: SPACE.sm,
    paddingBottom: SPACE.xs,
  },
  place: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.sm,
    paddingVertical: SPACE.xs + 2,
    paddingHorizontal: SPACE.sm,
  },
  placeName: { ...role(TYPE.rowName), flex: 1, minWidth: 0 },
  /* The boxes the waiting forms stand in, without the type the text carries. */
  placeNameBox: { flex: 1, minWidth: 0 },
  cityNameBox: {
    paddingHorizontal: SPACE.sm,
    paddingTop: SPACE.sm,
    paddingBottom: SPACE.xs,
  },
  visited: {
    ...role(TYPE.label),
    overflow: 'hidden',
    borderRadius: RADIUS.pill,
    paddingVertical: 2,
    paddingHorizontal: SPACE.sm,
  },
  /* The chip's own size, as `PlaceRow` draws it. */
  blockChip: { width: 26, height: 26, borderRadius: RADIUS.sm },
  /* One line of the name's type. */
  blockName: {
    height: TYPE.rowName.size * TYPE.rowName.lineHeight,
    borderRadius: RADIUS.sm,
  },
  dayName: { ...role(TYPE.rowName) },
  dayEmpty: { ...role(TYPE.note) },
})
