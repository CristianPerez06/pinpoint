import {
  describeHours,
  EMPTY_FIELD_WORDING,
  formatDay,
  formatDayRange,
  UNFILED_CITY_WORDING,
  formatPrices,
  type Marker,
  type MarkerInterest,
  type OpeningHours,
  type TripMember,
  formatWalkingDistance,
  formatWalkingTime,
} from '@pinpoint/core'
import { walkingMinutes, type MarkerGroup, type MarkerView } from '@pinpoint/map'
import { RADIUS, SPACE, TYPE } from '@pinpoint/tokens'
import { message } from '@pinpoint/wording'
// Deep import, not the package root — see marker-icon.tsx. One value
// import of the barrel pulls all 1767 icons and crashes Hermes.
import Footprints from 'lucide-react-native/icons/footprints'
import X from 'lucide-react-native/icons/x'
import { type ReactNode, useState } from 'react'
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native'
import Animated from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { InterestRows, VisitedToggle } from '@/components/interest'
import { sheetHeight } from '@/components/sheet'
import { MarkerGlyph, markerTypeMessage } from '@/components/marker-icon'
import { Question } from '@/components/ui'
import { NeedsConnection } from '@/components/needs-connection'
import { useLanguage, useSay } from '@/lib/language'
import { useTheme } from '@/lib/theme'
import { role } from '@/lib/type'
import { useOnline } from '@/lib/connectivity'
import { SCRIM_ENTERING, SCRIM_EXITING, SHEET_ENTERING, SHEET_EXITING } from '@/lib/motion'
import { useWaiting } from '@/lib/waiting'

/**
 * What was recorded about a place, as a sheet rising from the bottom.
 *
 * The same fields as web — that part comes from the domain schema and is shared
 * — presented the way a phone expects. A popup anchored to a pin reads fine on
 * a laptop and fights the pin it is anchored to on a phone.
 *
 * This is a plain positioned view rather than a gesture-driven sheet. The
 * specification requires the information be reachable without leaving the map,
 * not that it arrive on a draggable surface, and a real sheet would pull in
 * gesture and animation handling this app does not have yet. Dismissal is a
 * button, which works today and does not owe anything to a library.
 *
 * Colours are applied inline rather than through `StyleSheet.create`, because
 * they now depend on which ground the device is drawing on. Everything that
 * does not depend on the theme stays in the sheet below, where it is created
 * once.
 */

/**
 * The most of the map this sheet can cover, for whoever has to get a place out
 * from under it before it exists.
 *
 * The same job `openingHeight` does for the capture form, and exported for the
 * same reason: recognising a searched place moves the camera and opens this
 * sheet in one breath, so the camera has to know where the sheet will be while
 * it is still being decided. A camera that centres on the map's own middle puts
 * the place exactly where the sheet is about to be.
 *
 * Exact rather than an estimate: a place's sheet stands at the shared
 * `sheetHeight` whatever it holds, so the height it will take is known before
 * it exists.
 */
export function openingHeight(windowHeight: number): number {
  return sheetHeight(windowHeight)
}

const styles = StyleSheet.create({
  routeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACE.sm,
    borderWidth: 1,
    borderRadius: RADIUS.pill,
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  routeButtonText: { ...role(TYPE.control), fontWeight: '600' },
  route: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: RADIUS.md,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  routeText: { flex: 1, minWidth: 0 },
  routeMain: { ...role(TYPE.rowName) },
  routeSub: { ...role(TYPE.note) },
  routeClear: {
    borderWidth: 1,
    borderRadius: RADIUS.pill,
    paddingVertical: 5,
    paddingHorizontal: 12,
  },
  rowActions: { flexDirection: 'row', gap: SPACE.sm, paddingTop: SPACE.xs },
  action: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'transparent',
    borderRadius: RADIUS.md,
    paddingVertical: 10,
    alignItems: 'center',
  },
  actionText: { ...role(TYPE.control), fontWeight: '700' },
  // The sheet's place on the screen, and the thing that slides. Separate from
  // the surface so that changing from the list of places on one point to one
  // of them — two different surfaces — happens in place rather than as one
  // sheet leaving and another arriving.
  positioner: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 1,
    padding: SPACE.md,
    gap: SPACE.sm,
  },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 11 },
  chip: {
    width: 34,
    height: 34,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { ...role(TYPE.title), flexShrink: 1, flex: 1 },
  dismiss: { padding: SPACE.xs },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
  },
  tagText: { fontSize: 11.5, fontWeight: '600' },
  field: { gap: 2, paddingVertical: SPACE.xs },
  fieldLabel: { ...role(TYPE.label) },
  fieldValue: { ...role(TYPE.body) },
  /*
    The laptop's weight, and only as wide as its words — a column stretches its
    children, which would make the empty row beside a short link tappable too.
  */
  link: { fontWeight: '600', alignSelf: 'flex-start' },
  absent: { ...role(TYPE.body), fontStyle: 'italic' },
  hours: { gap: 1 },
  hoursLine: { flexDirection: 'row', gap: 14 },
  /*
    Wide enough for `Every day`, the longest name a line can carry. Spanish's
    `Todos los días` is wider and simply takes more room: it only ever appears on
    a card's single line, with no line under it whose times must align.
  */
  hoursDays: { ...role(TYPE.body), minWidth: 72, fontVariant: ['tabular-nums'] },
  hoursText: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', columnGap: 4 },
  hoursRange: { ...role(TYPE.body), fontVariant: ['tabular-nums'] },
  hint: { ...role(TYPE.note) },
  /*
    A place the filter is not drawing, opened anyway because search recognised
    it. Muted rather than warning-coloured: nothing failed and the trip is
    intact — the only thing worth saying is why the map behind this sheet is
    empty. Coloured `inkMuted` rather than `inkFaint` at the call site: this
    sentence is the whole explanation for an otherwise inexplicable screen and
    has to be read.
  */
  hiddenNote: {
    ...role(TYPE.note),
    marginTop: SPACE.sm,
    padding: SPACE.sm,
    borderRadius: RADIUS.sm,
  },
  choice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.sm,
    paddingVertical: SPACE.sm,
  },
  choiceName: { ...role(TYPE.rowName), flex: 1 },
  choiceType: { ...role(TYPE.note) },
  /**
   * Only used once the content has been found not to fit, at which point the
   * sheet has a definite height and `flex: 1` resolves to the space left over.
   * Inside a content-sized parent this would be zero — which is the whole reason
   * the sheet has to decide its height before a ScrollView can exist in it.
   */
  scroller: { flex: 1 },
  scrollerContent: { paddingBottom: SPACE.xs },
  back: {
    marginTop: SPACE.sm,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: RADIUS.pill,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  backText: { ...role(TYPE.control) },
})

/**
 * A place's icon, without the teardrop — a point would mean nothing here.
 *
 * Exported for the calendar's lists, which name places away from any map and
 * need the same mark beside each one. One definition rather than two, for the
 * reason the pin itself is drawn from one path.
 */
export function TypeChip({ view, size = 34 }: { view: MarkerView; size?: number }) {
  const theme = useTheme()

  return (
    <View
      style={[
        styles.chip,
        {
          width: size,
          height: size,
          backgroundColor: theme.markerType[view.type],
        },
      ]}
    >
      <MarkerGlyph
        icon={view.icon}
        size={Math.round(size * 0.52)}
        colour={theme.markerForeground}
      />
    </View>
  )
}

/** A field that holds nothing is shown as holding nothing, never as blank text. */
function Field({
  label,
  value,
  absent,
  isLink = false,
}: {
  label: string
  value: string | null
  /** What an empty field says — from `EMPTY_FIELD_WORDING`, so the laptop says the same. */
  absent: string
  /**
   * The value is an address to open. It is drawn on one line, cut short with
   * "…" at the end — a link copied from a map or a booking site runs to
   * hundreds of characters of tracking parameters, and in full it took over the
   * card (#173) — and a tap opens the whole of it in the browser, as a click
   * does on the laptop.
   */
  isLink?: boolean
}) {
  const theme = useTheme()
  const say = useSay()

  return (
    <View style={styles.field}>
      <Text style={[styles.fieldLabel, { color: theme.colour.inkMuted }]}>
        {label}
      </Text>
      {value === null ? (
        <Text style={[styles.absent, { color: theme.colour.inkMuted }]}>
          {absent}
        </Text>
      ) : isLink ? (
        <Text
          style={[styles.fieldValue, styles.link, { color: theme.colour.accentInk }]}
          numberOfLines={1}
          ellipsizeMode="tail"
          /*
            A refusal is swallowed, as on the credits sheet: the address is on
            screen, and a device that cannot open it is not a state this card
            has anything useful to say about.
          */
          onPress={() => void Linking.openURL(value).catch(() => {})}
          accessibilityRole="link"
          accessibilityHint={say(message('common.opensInBrowser'))}
        >
          {value}
        </Text>
      ) : (
        <Text style={[styles.fieldValue, { color: theme.colour.ink }]}>{value}</Text>
      )}
    </View>
  )
}

/**
 * A place's week, one line per run of days, in the words both cards share.
 *
 * Every day name is measured into one column width, so the times start at the
 * same place down the card — `Tue–Thu` and `Fri` are not the same width, and
 * times that jump sideways from line to line cannot be compared at a glance.
 * A line that has to wrap breaks between ranges, never inside one: each range
 * is its own unbreakable word.
 */
function HoursLines({ hours }: { hours: OpeningHours }) {
  const theme = useTheme()
  const say = useSay()
  const lines = describeHours(useLanguage(), hours)

  return (
    <View style={styles.hours}>
      {lines.map((line) => {
        const colour = line.closed ? theme.colour.inkMuted : theme.colour.ink
        return (
          <View key={say(line.days)} style={styles.hoursLine}>
            <Text
              style={[
                styles.hoursDays,
                { color: colour, fontWeight: line.closed ? '400' : '600' },
              ]}
            >
              {say(line.days)}
            </Text>
            <View style={styles.hoursText}>
              {say(line.text).split(', ').map((part, index, parts) => (
                <Text key={part} style={[styles.hoursRange, { color: colour }]}>
                  {index < parts.length - 1 ? `${part},` : part}
                </Text>
              ))}
            </View>
          </View>
        )
      })}
    </View>
  )
}

function Dismiss({ onDismiss }: { onDismiss: () => void }) {
  const theme = useTheme()
  const say = useSay()

  return (
    <Pressable
      onPress={onDismiss}
      accessibilityRole="button"
      accessibilityLabel={say(message('common.close'))}
      style={styles.dismiss}
      hitSlop={8}
    >
      <X size={18} color={theme.colour.inkMuted} strokeWidth={2.2} />
    </Pressable>
  )
}

/**
 * Why the map behind this sheet is empty.
 *
 * A sheet only ever shows a place the map is drawing, with one exception:
 * searching for somewhere the trip already holds opens it wherever it is,
 * behind a filter included. Without this sentence the result is a camera that
 * moves, a sheet about a place with no pin under it, and no way to tell that
 * from the application failing.
 *
 * It does not offer to clear the filter. The filter was set deliberately, and a
 * product that quietly unsets one so its own output makes sense leaves somebody
 * to notice and undo it. Clearing is already reachable from the bar that says
 * the view is narrowed.
 */
function HiddenNote() {
  const theme = useTheme()
  const say = useSay()

  return (
    <Text
      style={[
        styles.hiddenNote,
        {
          backgroundColor: theme.colour.surfaceSunk,
          color: theme.colour.inkMuted,
        },
      ]}
    >
      {say(message('placeCard.hidden'))}
    </Text>
  )
}

export interface Selection {
  group: MarkerGroup<Marker>
  /** Null while a group of several is still being chosen between. */
  index: number | null
  /**
   * Whether the filter is hiding what this sheet is showing.
   *
   * Only ever true for a sheet the application opened by identity — recognising
   * a searched place the trip already holds. Tapping the map cannot produce it,
   * because a tap can only reach what is drawn.
   */
  hidden: boolean
}

/** An action the sheet offers on behalf of the screen that opened it. */
export type ExtraAction = { label: string; onPress: () => void }

/**
 * One marker resolves straight to its details; several insert a chooser in
 * front of the same view — the same two steps as web, because the mechanism is
 * shared even though none of the markup is.
 */
/**
 * Where the sheet stands, and what slides it in and out (`motion`, *A surface
 * opening over a screen arrives and leaves with the shared timing*).
 *
 * The root of both the list of places on one point and a single place's
 * details, so moving between the two keeps this element and does not replay
 * the slide: only mounting and unmounting the sheet does.
 */
function SheetSurface({
  onScrimPress,
  children,
}: {
  /** Draws the scrim behind the sheet, and what a press on it does. */
  onScrimPress?: () => void
  children: ReactNode
}) {
  const theme = useTheme()
  const say = useSay()
  return (
    <>
      {onScrimPress ? (
        <Animated.View
          entering={SCRIM_ENTERING}
          exiting={SCRIM_EXITING}
          style={[StyleSheet.absoluteFill, { backgroundColor: theme.colour.scrim }]}
        >
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={onScrimPress}
            accessibilityLabel={say(message('common.close'))}
          />
        </Animated.View>
      ) : null}
      <Animated.View entering={SHEET_ENTERING} exiting={SHEET_EXITING} style={styles.positioner}>
        {children}
      </Animated.View>
    </>
  )
}

/**
 * What the map offers about getting to the open place (`place-route`).
 *
 * Optional, and only the map passes it: the calendar opens this same sheet with
 * no map on screen, and a line drawn on a map nobody can see would be a button
 * that does nothing.
 */
export interface RouteOffer {
  /** Waiting for the person's position, after a press. */
  finding: boolean
  /** The straight-line distance once the line is drawn, or null before. */
  km: number | null
  onCalculate: () => void
  onClear: () => void
}

/**
 * The button, and once pressed, how far and how long — the laptop's card in
 * the phone's idiom. Inert while finding rather than disabled, so it keeps its
 * name for a screen reader (`Inert, not absent`).
 */
function Route({ offer, name }: { offer: RouteOffer; name: string }) {
  const theme = useTheme()
  const language = useLanguage()
  const say = useSay()

  if (offer.km === null) {
    return (
      <Pressable
        onPress={offer.finding ? undefined : offer.onCalculate}
        accessibilityRole="button"
        accessibilityLabel={say(
          offer.finding ? message('route.finding') : message('route.calculateNamed', { name }),
        )}
        accessibilityState={{ busy: offer.finding, disabled: offer.finding }}
        style={({ pressed }) => [
          styles.routeButton,
          {
            borderColor: theme.colour.lineStrong,
            backgroundColor: pressed && !offer.finding ? theme.colour.surfaceMuted : theme.colour.surface,
          },
        ]}
      >
        {offer.finding ? (
          <ActivityIndicator size="small" color={theme.colour.inkMuted} />
        ) : (
          <Footprints size={17} color={theme.colour.ink} />
        )}
        <Text
          style={[
            styles.routeButtonText,
            { color: offer.finding ? theme.colour.inkMuted : theme.colour.ink },
          ]}
        >
          {say(message(offer.finding ? 'route.finding' : 'route.calculate'))}
        </Text>
      </Pressable>
    )
  }

  const minutes = walkingMinutes(offer.km)
  const distance = say(
    message('route.straightLine', { distance: say(formatWalkingDistance(language, offer.km)) }),
  )
  return (
    <View style={[styles.route, { backgroundColor: theme.colour.surfaceMuted }]}>
      <Footprints size={20} color={theme.colour.ink} />
      <View style={styles.routeText}>
        {minutes === null ? (
          <Text style={[styles.routeMain, { color: theme.colour.ink }]}>{distance}</Text>
        ) : (
          <>
            <Text style={[styles.routeMain, { color: theme.colour.ink }]}>
              {say(formatWalkingTime(language, minutes))}
            </Text>
            <Text style={[styles.routeSub, { color: theme.colour.inkMuted }]}>{distance}</Text>
          </>
        )}
      </View>
      <Pressable
        onPress={offer.onClear}
        accessibilityRole="button"
        accessibilityLabel={say(message('route.clearNamed', { name }))}
        style={({ pressed }) => [
          styles.routeClear,
          {
            borderColor: theme.colour.lineStrong,
            backgroundColor: pressed ? theme.colour.surfaceSunk : theme.colour.surface,
          },
        ]}
      >
        <Text style={[styles.routeButtonText, { color: theme.colour.ink }]}>
          {say(message('route.clear'))}
        </Text>
      </Pressable>
    </View>
  )
}

export function MarkerDetails({
  selection,
  members,
  interestFor,
  cityNameOf,
  ownMemberId,
  onRecordInterest,
  onWithdrawInterest,
  onSetVisited,
  onChoose,
  onBack,
  extraAction,
  onDismiss,
  dimBehind = false,
  onEdit,
  onDelete,
  removingId,
  route,
}: {
  selection: Selection
  members: readonly TripMember[]
  /** One marker's records, so this component never sees the whole trip's. */
  interestFor: (marker: Marker) => readonly MarkerInterest[]
  /** One marker's city name, resolved by the workspace that holds the cities. */
  cityNameOf: (marker: Marker) => string | null
  ownMemberId: string | null
  onRecordInterest: (marker: Marker, interested: boolean) => void
  onWithdrawInterest: (marker: Marker) => void
  onSetVisited: (marker: Marker, visited: boolean) => void
  onChoose: (index: number) => void
  onBack: () => void
  /**
   * One more thing the sheet can do, named by whoever opened it.
   *
   * It stands where `← Others at this point` stands and takes that place when
   * given: the calendar offers the map from here, and the map offers the way
   * back to the calendar, and a sheet carrying a second way back beside the
   * first would leave somebody guessing which one leads where they came from.
   * The other places at the point are still one tap on the pin away.
   */
  extraAction?: ExtraAction
  onDismiss: () => void
  /**
   * Sets the screen behind the sheet back with the scrim, and a press on it
   * dismisses (`trip-calendar`, *A place opened over the calendar sets the
   * calendar back*).
   *
   * Only the calendar asks for it. Over the map the sheet describes a pin the
   * person is looking at, and dimming the map would hide it (`workspace-chrome`).
   */
  dimBehind?: boolean
  /**
   * Correcting or removing what this sheet is describing.
   *
   * Reached from here because this is the surface that shows what was recorded,
   * which is where the specification says editing is reached from — and because
   * it is where somebody notices the thing that is wrong.
   */
  onEdit: (marker: Marker) => void
  /**
   * Asks for the removal; it does not perform one. The confirmation lives with
   * whoever owns the write, so that both routes to removing a place — here and
   * the form — ask the same question in the same words.
   */
  onDelete: (marker: Marker) => void
  /**
   * The place whose removal is already in flight, or null.
   *
   * An id rather than a boolean: this sheet can be showing one place out of
   * several at a point, and "a removal is happening" would let it say so about
   * the wrong one.
   */
  removingId: string | null
  /** See `RouteOffer`. Only the map passes it. */
  route?: RouteOffer
}) {
  const theme = useTheme()
  const language = useLanguage()
  const say = useSay()
  const online = useOnline()
  const { waitingFor } = useWaiting()
  /**
   * Whether the question is standing in place of the footer.
   *
   * Up here with the other hooks rather than beside the footer it belongs to,
   * because this component returns early when the group holds more than one
   * place — a hook below that return would be called on some renders and not
   * others. Held locally at all because it is about what this sheet is showing
   * and nothing outside it needs to know. Deliberately not reset when the write
   * is refused: the refusal is reported over the map and the question stays, so
   * the person can answer again without reopening it.
   */
  const [asking, setAsking] = useState(false)
  const { group, index, hidden } = selection
  // The sheet is pinned to the very bottom of the screen, so its last field —
  // or its "Others at this point" button — would otherwise sit under the home
  // indicator, which is exactly where a thumb reaches for it.
  const insets = useSafeAreaInsets()

  const cap = sheetHeight(useWindowDimensions().height)

  const sheet = [
    styles.sheet,
    {
      backgroundColor: theme.colour.surface,
      borderColor: theme.colour.line,
      shadowColor: theme.elevation.lg.colour,
      paddingBottom: SPACE.md + insets.bottom,
      maxHeight: cap,
    },
  ]

  if (index === null) {
    return (
      <SheetSurface onScrimPress={dimBehind ? onDismiss : undefined}>
        <View style={sheet}>
          <View style={styles.headerRow}>
            <Text style={[styles.title, { color: theme.colour.ink }]}>
              {say(message('placeGroup.count', { count: group.count }))}
            </Text>
            <Dismiss onDismiss={onDismiss} />
          </View>
          <Text style={[styles.hint, { color: theme.colour.inkMuted }]}>
            {say(message('placeGroup.note'))}
          </Text>
          {hidden ? <HiddenNote /> : null}
          {/* Same reasoning as the fields below: a ScrollView here reports almost
              no height to a sheet that is asking how tall its children are, and
              takes the list down with it. Markers sharing one point come in twos
              and threes, so nothing needs scrolling. */}
          <View>
            {group.markers.map((marker, i) => (
              <Pressable
                key={marker.id}
                onPress={() => onChoose(i)}
                style={styles.choice}
                accessibilityRole="button"
              >
                <TypeChip view={group.views[i]!} size={26} />
                <Text style={[styles.choiceName, { color: theme.colour.ink }]}>
                  {marker.name}
                </Text>
                <Text style={[styles.choiceType, { color: theme.colour.inkMuted }]}>
                  {say(markerTypeMessage(group.views[i]!.type))}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </SheetSurface>
    )
  }

  const marker = group.markers[index]!
  const view = group.views[index]!
  const prices = formatPrices(language, marker)
  // Only reached with both ends present, which always words a stretch.
  const stretch =
    marker.plannedOn === null || marker.plannedUntil === null
      ? null
      : formatDayRange(language, marker.plannedOn, marker.plannedUntil)
  const removing = removingId === marker.id

  const fields = (
    <>
      <View style={styles.field}>
        <Text style={[styles.fieldLabel, { color: theme.colour.inkMuted }]}>
          {say(message('placeField.whoWantsToGo'))}
        </Text>
        <InterestRows
          members={members}
          interest={interestFor(marker)}
          ownMemberId={ownMemberId}
          onRecord={(interested) => onRecordInterest(marker, interested)}
          onWithdraw={() => onWithdrawInterest(marker)}
          waiting={
            ownMemberId !== null &&
            waitingFor({ kind: 'interest', markerId: marker.id, memberId: ownMemberId })
          }
        />
      </View>

      <View style={styles.field}>
        <Text style={[styles.fieldLabel, { color: theme.colour.inkMuted }]}>
          {say(message('placeField.visited'))}
        </Text>
        <VisitedToggle
          visited={marker.visited}
          onChange={(visited) => onSetVisited(marker, visited)}
          waiting={waitingFor({ kind: 'visited', markerId: marker.id })}
        />
      </View>

      {/*
        The city, above the day, as on the laptop.

        `absent` is unreachable here and that is the point: a place filed under
        nothing is not missing a value, it has `Unassigned` — which is the word
        the place form and the city sheet already use for that group. The other
        fields say `No … yet` because they are waiting to be filled in.
      */}
      <Field
        label={say(message('placeField.city'))}
        value={cityNameOf(marker) ?? say(UNFILED_CITY_WORDING)}
        absent={say(UNFILED_CITY_WORDING)}
      />

      {/* The day, where the laptop's card carries it: after what was decided
          about the place and before what was written about it. A place planned
          for a run reads as the stretch it covers, from the same shared wording
          the laptop uses. */}
      <Field
        label={say(message('placeField.day'))}
        value={
          marker.plannedOn === null
            ? null
            : stretch === null
              ? formatDay(language, marker.plannedOn)
              : say(stretch)
        }
        absent={say(EMPTY_FIELD_WORDING.day)}
      />

      <View style={styles.field}>
        <Text style={[styles.fieldLabel, { color: theme.colour.inkMuted }]}>
          {say(message('placeField.hours'))}
        </Text>
        {marker.hours === null ? (
          <Text style={[styles.absent, { color: theme.colour.inkMuted }]}>
            {say(EMPTY_FIELD_WORDING.hours)}
          </Text>
        ) : (
          <HoursLines hours={marker.hours} />
        )}
      </View>

      <Field
        label={say(message('placeField.note'))}
        value={marker.note}
        absent={say(EMPTY_FIELD_WORDING.note)}
      />
      <Field
        label={say(message('placeField.link'))}
        value={marker.link}
        absent={say(EMPTY_FIELD_WORDING.link)}
        isLink
      />

      {/*
        Editing and removing, at the bottom rather than in the header.

        The header holds the place's identity and the way out; putting a
        destructive control up there would sit it beside a dismiss button, where
        a mis-tap costs a marker instead of a glance. Down here they follow what
        was recorded, which is the order somebody reads in — see it, then decide
        it is wrong.
      */}
      {/*
        The question replaces this footer and nothing above it, because the
        sheet *is* the place being removed — seeing it is how somebody knows
        which record they are answering about.
      */}
      {asking ? (
        <Question
          question={say(message('placeCard.removeQuestion', { name: marker.name }))}
          // "Cannot be undone" rather than a softer word, because it cannot:
          // there is no archive, no trash, and nothing that would let a member
          // get a marker back.
          consequence={say(message('placeCard.cannotBeUndone'))}
          confirm={say(message('common.remove'))}
          waiting={removing}
          onConfirm={() => onDelete(marker)}
          onDecline={() => setAsking(false)}
        />
      ) : (
        <>
          <View style={styles.rowActions}>
            <Pressable
              onPress={() => onEdit(marker)}
              disabled={!online}
              accessibilityState={{ disabled: !online }}
              accessibilityRole="button"
              accessibilityLabel={say(message('common.editNamed', { name: marker.name }))}
              style={[
                styles.action,
                { borderColor: theme.colour.lineStrong, opacity: online ? 1 : 0.5 },
              ]}
            >
              <Text style={[styles.actionText, { color: theme.colour.ink }]}>
                {say(message('common.edit'))}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setAsking(true)}
              disabled={!online}
              accessibilityState={{ disabled: !online }}
              accessibilityRole="button"
              accessibilityLabel={say(message('common.removeNamed', { name: marker.name }))}
              style={[
                styles.action,
                { backgroundColor: theme.colour.dangerSurface, opacity: online ? 1 : 0.5 },
              ]}
            >
              <Text style={[styles.actionText, { color: theme.colour.danger }]}>
                {say(message('common.remove'))}
              </Text>
            </Pressable>
          </View>
          {/*
            Disabled rather than hidden, with the reason under them: a control
            that disappears reads as a feature that has gone (`offline-use`).
          */}
          {online ? null : (
            <NeedsConnection>{say(message('offline.editingNeedsConnection'))}</NeedsConnection>
          )}
        </>
      )}

      {extraAction ? (
        <Pressable
          onPress={extraAction.onPress}
          style={[styles.back, { borderColor: theme.colour.lineStrong }]}
          accessibilityRole="button"
        >
          <Text style={[styles.backText, { color: theme.colour.ink }]}>
            {extraAction.label}
          </Text>
        </Pressable>
      ) : group.count > 1 ? (
        <Pressable
          onPress={onBack}
          style={[styles.back, { borderColor: theme.colour.lineStrong }]}
          accessibilityRole="button"
        >
          <Text style={[styles.backText, { color: theme.colour.ink }]}>
            {say(message('placeCard.othersHere'))}
          </Text>
        </Pressable>
      ) : null}
    </>
  )

  return (
    <SheetSurface onScrimPress={dimBehind ? onDismiss : undefined}>
      <View
        // One definite height whatever the place holds (`sheetHeight`), so the
        // scroller below always has room to draw in.
        style={[sheet, { height: cap }]}
      >
        <View style={styles.headerRow}>
          <TypeChip view={view} />
          <Text style={[styles.title, { color: theme.colour.ink }]}>{marker.name}</Text>
          <Dismiss onDismiss={onDismiss} />
        </View>

        <View style={styles.tags}>
          <View
            style={[styles.tag, { backgroundColor: theme.markerType[view.type] }]}
          >
            <Text style={[styles.tagText, { color: theme.markerForeground }]}>
              {say(markerTypeMessage(view.type))}
            </Text>
          </View>
          {prices === null ? null : (
            <View style={[styles.tag, { backgroundColor: theme.colour.surfaceMuted }]}>
              {/* `USD 25 · JPY 3,800`, either alone, or `Free`. Formatted by the
                  shared helper so the phone and the laptop cannot disagree. */}
              <Text style={[styles.tagText, { color: theme.colour.inkMuted }]}>
                {say(prices)}
              </Text>
            </View>
          )}
        </View>

        {route ? <Route offer={route} name={marker.name} /> : null}

        {hidden ? <HiddenNote /> : null}

        {/*
          A ScrollView has no intrinsic content height in React Native, so it
          is only given one inside the definite height above: `flex: 1` here
          resolves to the space left under the header — see `AGENTS.md`.
        */}
        <ScrollView
          style={styles.scroller}
          contentContainerStyle={styles.scrollerContent}
          showsVerticalScrollIndicator
        >
          {fields}
        </ScrollView>
      </View>
    </SheetSurface>
  )
}
