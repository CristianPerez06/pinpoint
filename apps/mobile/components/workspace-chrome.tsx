import { RADIUS, SPACE, TYPE } from '@pinpoint/tokens'
import { message } from '@pinpoint/wording'
// Deep imports, not the package root — see marker-icon.tsx. One value import of
// the barrel pulls all 1767 icons and crashes Hermes.
import ChevronDown from 'lucide-react-native/icons/chevron-down'
import MapPinPlus from 'lucide-react-native/icons/map-pin-plus'
import Search from 'lucide-react-native/icons/search'
import SlidersHorizontal from 'lucide-react-native/icons/sliders-horizontal'
import type { LucideIcon } from 'lucide-react-native'
import type { ReactNode } from 'react'
import { type LayoutChangeEvent, Pressable, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { LoadingState } from '@/components/states'
import { NamePlaceholder } from '@/components/ui'
import { useSay } from '@/lib/language'
import { useTheme } from '@/lib/theme'
import { role } from '@/lib/type'

/**
 * The map screen's chrome, drawn from what it has been given — or from nothing yet.
 *
 * One definition for both moments, which is what `waiting-screens` and
 * `workspace-chrome` ask for and what the laptop's `WorkspaceChrome` already is.
 * The map route draws it with nothing while the session and the trips are read;
 * `TripWorkspace` draws it with the trip once there is one. The header, the body
 * and the bar of tools stand where they will stand either way, and what arrives
 * replaces a bar where it stands.
 *
 * Before this the route drew a plain loading screen on whatever the navigator
 * painted behind it — a light grey on a phone set to dark, which was the flicker
 * in #169 — and then the header arrived, and then the tools.
 *
 * Markup only. Everything that holds state or talks to the database stays in
 * `TripWorkspace`, which hands in names and callbacks.
 */

export type ChromeBindings = {
  tripName: string
  onOpenTrips: () => void
  onOpenMenu: () => void
  /** What the header calls the selection: a city, `Unassigned`, or `All places`. */
  cityName: string
  /** The whole trip rather than a narrowing of it, drawn quieter than a city. */
  wholeTrip: boolean
  /** What a screen reader is told the city control does. */
  cityHint: string
  onOpenCities: () => void
}

export function WorkspaceChrome({
  live,
  children,
  overlays,
}: {
  live: ChromeBindings | null
  /** What stands under the header: the map, or the wait for it. */
  children: ReactNode
  /** The sheets that open over the whole screen. */
  overlays?: ReactNode
}) {
  const theme = useTheme()
  const say = useSay()
  const insets = useSafeAreaInsets()

  return (
    <View style={[styles.screen, { backgroundColor: theme.colour.surface }]}>
      <View
        style={[
          styles.header,
          { borderColor: theme.colour.line, paddingTop: HEADER_PAD + insets.top },
        ]}
      >
        <View style={styles.headerLine}>
          {/*
            What is rare, and one thing that is not a control.

            The wordmark is gone: inside the pinpoint application it says nothing
            the reader does not know, and the point beside it already stands for it —
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

            While waiting it is inert — present, announced as unavailable, doing
            nothing — and the name is a drawn bar. The bar is what tells it apart
            from the live control, which is more than colour.
          */}
          <Pressable
            onPress={live?.onOpenTrips}
            accessibilityRole="button"
            accessibilityLabel={say(
              live
                ? message('calendar.tripButton', { name: live.tripName })
                : message('calendar.tripButtonWaiting'),
            )}
            accessibilityState={live ? undefined : { disabled: true }}
            hitSlop={6}
            style={styles.tripButton}
          >
            {live ? (
              <Text style={[styles.tripName, { color: theme.colour.ink }]} numberOfLines={1}>
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

          {/*
            The menu names nobody, so it has no bar to stand in for anything.
            While waiting it takes the chrome's inert fill instead — the sunk
            tile — so it differs from the live glyph by more than its colour. The
            tile's padding is taken back by an equal negative margin, so the
            glyph stands in the same place in both states.
          */}
          <Pressable
            onPress={live?.onOpenMenu}
            accessibilityRole="button"
            accessibilityLabel={say(message('calendar.menu'))}
            accessibilityState={live ? undefined : { disabled: true }}
            hitSlop={8}
            style={[
              styles.menuButton,
              live ? null : { backgroundColor: theme.colour.surfaceSunk },
            ]}
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
          The city being worked in, on its own line under the trip it narrows.

          Under rather than beside, and that is the whole finding of the mock in
          an earlier change's `mock/` folder. The laptop puts `Trip / City` on one
          row and it cannot come here: at 320pt two names that both want the row
          leave each other about eleven characters, so `Tokyo & Kyoto Honeymoon`
          and `Hiroshima & Miyajima` both become stubs and neither answers its
          question. Neither name has a length anybody promised — both are typed
          by a person — so the arrangement fails exactly where it matters.

          Still in the header rather than in the bar at the bottom. A city is a
          narrowing of the trip and reads as one only when it stands where the
          trip does; the bar holds the controls that act on the map, and this
          acts on what is being worked on.
        */}
        <View style={styles.cityLine}>
          <Pressable
            onPress={live?.onOpenCities}
            accessibilityRole="button"
            accessibilityLabel={live ? live.cityHint : say(message('city.menuName'))}
            accessibilityState={live ? undefined : { disabled: true }}
            hitSlop={6}
            style={styles.cityButton}
          >
            {live ? (
              <Text
                style={[
                  styles.cityName,
                  {
                    // Naming the whole trip rather than standing empty, and drawn
                    // quieter than a city so the two states are told apart
                    // without reading the word.
                    color: live.wholeTrip ? theme.colour.inkMuted : theme.colour.ink,
                  },
                ]}
                numberOfLines={1}
              >
                {live.cityName}
              </Text>
            ) : (
              <NamePlaceholder
                width={72}
                lineHeight={TYPE.rowName.size * TYPE.rowName.lineHeight}
              />
            )}
            <ChevronDown size={14} color={theme.colour.inkMuted} strokeWidth={2.4} />
          </Pressable>
        </View>
      </View>

      <View style={styles.body}>{children}</View>

      {overlays}
    </View>
  )
}

/**
 * The map's area before there is a map: one message, and the tools standing on
 * the bottom edge, inert.
 *
 * The same thing for every wait before the map — the session, the trips, and the
 * trip's places — so the area changes once, when the map replaces it, rather
 * than once per read. The words are `LoadingState`'s own default, "Loading the
 * map…", which is what the phone already said while the places were read.
 *
 * The message is the one accessible element here, marked busy. The tools are not
 * folded into it: they are controls, and an inert control stays reachable and
 * says it is unavailable rather than disappearing into a label.
 */
export function WaitingMap() {
  const say = useSay()
  const insets = useSafeAreaInsets()

  return (
    <View style={styles.fill}>
      <View
        accessible
        accessibilityLabel={say(message('map.loading'))}
        accessibilityState={{ busy: true }}
        // Centred on the part of the area the bar does not cover, so the words
        // sit in the middle of what can be seen.
        style={[styles.fill, { paddingBottom: BAR_HEIGHT + insets.bottom }]}
      >
        <LoadingState />
      </View>
      <ToolBar>
        <SessionTools tools={null} />
      </ToolBar>
    </View>
  )
}

/**
 * The bar the tools stand on, flush to the bottom edge.
 *
 * Its own component so the wait and the map draw the same bar. `TripMap` still
 * decides when it stands and what stands in it — the drop confirmation swaps in
 * for the tools, sheets take the edge from it, and its measured height lifts the
 * map's credit — and wraps whatever that is in this.
 */
export function ToolBar({
  children,
  onLayout,
}: {
  children: ReactNode
  onLayout?: (event: LayoutChangeEvent) => void
}) {
  const theme = useTheme()
  const insets = useSafeAreaInsets()

  return (
    <View
      onLayout={onLayout}
      style={[
        styles.bar,
        {
          backgroundColor: theme.colour.surface,
          borderColor: theme.colour.line,
          // Flush to the bottom of the screen, carrying the inset in its own
          // padding so its contents clear the home indicator.
          paddingBottom: insets.bottom,
        },
      ]}
    >
      {children}
    </View>
  )
}

export type ToolBindings = {
  onSearch: () => void
  onDrop: () => void
  onFilter: () => void
  /** Whether a filter is hiding some of the trip's places. */
  narrowed: boolean
}

/**
 * The row a thumb reaches: search, drop and filter.
 *
 * `null` is the waiting form. All three are inert until the map is there: two
 * need nothing fetched to be drawn and still cannot act — search moves a camera
 * that does not exist yet, and drop arms one — which is exactly the case
 * `waiting-screens` warns about.
 */
export function SessionTools({ tools }: { tools: ToolBindings | null }) {
  const say = useSay()
  return (
    <View style={styles.row}>
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
        rejected on sight, and the reason given at the time was local to
        this row: it sits over a map whose pins are the only saturated
        colour in the system, and a fourth amber thing at the bottom
        competes with what it is meant to be serving.

        That reason was true and too small. Being true only of a row
        over a map is why the web's laptop bar — a surface strip above
        the map, not over it — kept a filled amber control long after
        this one lost its, without contradicting anything anybody had
        written. The rule that replaces it is **The Chrome Fill Rule**
        in DESIGN.md: the accent fills a control that *commits* an act
        inside a form or a panel, and never fills a control standing in
        the chrome at rest. `Drop` arms the map and waits; it commits
        nothing.

        So this row is no longer the exception that got it right. It is
        the shape both applications now hold, and nothing here changed
        to reach that — the web came to meet it.
      */}
      <Tool
        label={say(message('map.searchTool'))}
        hint={say(message('search.label'))}
        icon={Search}
        onPress={tools?.onSearch ?? null}
      />
      <Tool
        label={say(message('map.dropPinShort'))}
        hint={say(message('map.dropPinHint'))}
        icon={MapPinPlus}
        onPress={tools?.onDrop ?? null}
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
        label={say(message('filter.name'))}
        hint={say(message(tools?.narrowed ? 'filter.hintNarrowed' : 'filter.hint'))}
        icon={SlidersHorizontal}
        marked={tools?.narrowed ?? false}
        onPress={tools?.onFilter ?? null}
      />
    </View>
  )
}

/** The header's own breathing room, above and below its content. */
const HEADER_PAD = 11

/** A tool's glyph, and the room above and below the pair it makes with its label. */
const TOOL_GLYPH = 24
const TOOL_PAD_TOP = 9
const TOOL_PAD_BOTTOM = 7

/**
 * The height of whatever stands on the bottom edge.
 *
 * One number rather than two, because the toolbar and the sight's confirm row
 * swap places in the same slot: a shorter confirm row made the bar shrink under
 * the thumb at the moment the map was asking for a decision, which read as the
 * chrome flinching.
 *
 * Derived rather than chosen, because it has to be the height a tool already
 * comes to on its own. A tool is laid out from its parts, and a minimum below
 * their sum changes nothing — which is how a round 56 that read as
 * authoritative still left the confirm row two points short of the toolbar it
 * replaces. Both rows take this as a minimum, so a larger system text size
 * grows whichever one is standing there rather than clipping it.
 */
export const BAR_HEIGHT =
  TOOL_PAD_TOP +
  TOOL_GLYPH +
  SPACE.xs +
  TYPE.label.size * TYPE.label.lineHeight +
  TOOL_PAD_BOTTOM

/** How far the inert tile stands in from the edges of its third of the row. */
const TILE_INSET = 4

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
 *
 * `onPress: null` is the inert form: a sunk tile behind the glyph and label, so
 * it differs from the live tool by more than colour; announced as unavailable;
 * doing nothing. The tile is drawn inside the tool's own box rather than by
 * changing it, so the bar is `BAR_HEIGHT` tall either way.
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
  onPress: (() => void) | null
}) {
  const theme = useTheme()
  const inert = onPress === null
  const ink = marked ? theme.colour.accentInk : theme.colour.inkMuted

  return (
    <Pressable
      onPress={onPress ?? undefined}
      accessibilityRole="button"
      accessibilityLabel={hint}
      accessibilityState={inert ? { disabled: true } : undefined}
      style={styles.tool}
    >
      {inert ? (
        <View
          style={[styles.tile, { backgroundColor: theme.colour.surfaceSunk }]}
          pointerEvents="none"
        />
      ) : null}
      <View>
        <Glyph size={TOOL_GLYPH} color={ink} strokeWidth={2} />
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
  fill: { flex: 1 },
  header: {
    paddingHorizontal: SPACE.md,
    // `paddingTop` is applied inline instead, because it has to carry the
    // device's top inset as well as this.
    paddingBottom: HEADER_PAD,
    borderBottomWidth: 1,
  },
  /** The trip, the point, and the way out. What used to be the whole header. */
  headerLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.sm,
  },
  /*
   * Indented to clear the point, so the city hangs off the trip's name rather
   * than starting a second column. `flexDirection` so the control shrinks to
   * its label instead of spanning the width, which would read as a field.
   */
  cityLine: { flexDirection: 'row', paddingLeft: 9 + SPACE.sm, marginTop: 1 },
  /*
   * The trip's name one step down, and deliberately not a pill.
   *
   * This was a filled, outlined pill and it was wrong twice over. It was an
   * *off-spec* pill — `DESIGN.md` gives a selector pill a transparent border
   * held in reserve for hover, 7×11 padding and `control` type, and this had a
   * border drawn at rest, its own padding and `rowName` — so it read as a third
   * thing nobody had designed. And a pill does not belong here at all: DESIGN.md
   * scopes them to "the toolbar and the bottom bar", and this header's own idiom
   * is already a name with a caret.
   *
   * There is also a miscue to avoid. An outlined chip is what a filter chip
   * looks like everywhere else, and it would sit two inches above `Filter` while
   * naming a control that deliberately hides nothing.
   *
   * So it mirrors `tripButton` exactly — same padding, no fill, no border — and
   * the hierarchy is carried by size and weight alone: `rowName` under the
   * title, which is the nearest role below it. The laptop reaches the same
   * arrangement from the other direction: both its trip and city triggers are
   * `tone="quiet"`, so this is the one shape where the two platforms agree about
   * the *relationship* between the two controls rather than only about each.
   */
  cityButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.xs,
    flexShrink: 1,
    paddingVertical: SPACE.xs,
    paddingRight: SPACE.xs,
  },
  cityName: { ...role(TYPE.rowName), flexShrink: 1 },
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
  // Padding for the inert tile, taken back by the margin so the glyph does not
  // move between the two states.
  menuButton: {
    marginLeft: 'auto',
    paddingHorizontal: 6,
    paddingVertical: 3,
    marginRight: -6,
    marginVertical: -3,
    borderRadius: RADIUS.sm,
  },
  menuGlyph: { fontSize: 19, lineHeight: 22 },

  /*
   * A surface, not floating controls.
   *
   * Two pills over open map read as debris rather than as chrome — visible on
   * a phone in a way no amount of reasoning about it predicted. A bar guarantees
   * legibility over whatever the map happens to be drawing underneath, frames
   * the map with the same edge the header gives it at the top, and is the
   * surface search and a drop control land on rather than inventing a container
   * for themselves.
   */
  bar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopWidth: 1,
  },
  /* The contents of the row a thumb reaches. */
  row: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  /*
   * A third of the row each, and `BAR_HEIGHT` tall — which is derived from
   * exactly these parts, so the minimum is the height a tool reaches anyway and
   * binds only on the row that replaces this one. Vertical padding rather than
   * a height, so a larger system text size grows the button instead of clipping
   * the word inside it — the same reason the text fields take padding.
   */
  tool: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACE.xs,
    minHeight: BAR_HEIGHT,
    paddingTop: TOOL_PAD_TOP,
    paddingBottom: TOOL_PAD_BOTTOM,
    paddingHorizontal: SPACE.xs,
  },
  tile: {
    position: 'absolute',
    top: TILE_INSET,
    bottom: TILE_INSET,
    left: TILE_INSET,
    right: TILE_INSET,
    borderRadius: RADIUS.md,
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
  body: { flex: 1 },
})
