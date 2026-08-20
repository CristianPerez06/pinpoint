import {
  formatPrice,
  type Marker,
  type MarkerInterest,
  type TripMember,
} from '@pinpoint/core'
import type { MarkerGroup, MarkerView } from '@pinpoint/map'
import { RADIUS, SPACE, TYPE } from '@pinpoint/tokens'
// Deep import, not the package root — see marker-icon.tsx. One value
// import of the barrel pulls all 1767 icons and crashes Hermes.
import X from 'lucide-react-native/icons/x'
import { Pressable, StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { InterestRows, VisitedToggle } from '@/components/interest'
import { MarkerGlyph } from '@/components/marker-icon'
import { useTheme } from '@/lib/theme'
import { role } from '@/lib/type'

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

const styles = StyleSheet.create({
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    maxHeight: '55%',
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
  absent: { ...role(TYPE.body), fontStyle: 'italic' },
  hint: { ...role(TYPE.note) },
  choice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.sm,
    paddingVertical: SPACE.sm,
  },
  choiceName: { ...role(TYPE.rowName), flex: 1 },
  choiceType: { ...role(TYPE.note) },
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

/** A place's icon, without the teardrop — a point would mean nothing here. */
function TypeChip({ view, size = 34 }: { view: MarkerView; size?: number }) {
  const theme = useTheme()

  return (
    <View
      style={[
        styles.chip,
        {
          width: size,
          height: size,
          backgroundColor: theme.markerFamily[view.family],
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
function Field({ label, value }: { label: string; value: string | null }) {
  const theme = useTheme()

  return (
    <View style={styles.field}>
      <Text style={[styles.fieldLabel, { color: theme.colour.inkFaint }]}>
        {label}
      </Text>
      {value === null ? (
        <Text style={[styles.absent, { color: theme.colour.inkFaint }]}>
          Not recorded
        </Text>
      ) : (
        <Text style={[styles.fieldValue, { color: theme.colour.ink }]}>{value}</Text>
      )}
    </View>
  )
}

function Dismiss({ onDismiss }: { onDismiss: () => void }) {
  const theme = useTheme()

  return (
    <Pressable
      onPress={onDismiss}
      accessibilityRole="button"
      accessibilityLabel="Close"
      style={styles.dismiss}
      hitSlop={8}
    >
      <X size={18} color={theme.colour.inkFaint} strokeWidth={2.2} />
    </Pressable>
  )
}

export interface Selection {
  group: MarkerGroup<Marker>
  /** Null while a group of several is still being chosen between. */
  index: number | null
}

/**
 * One marker resolves straight to its details; several insert a chooser in
 * front of the same view — the same two steps as web, because the mechanism is
 * shared even though none of the markup is.
 */
export function MarkerDetails({
  selection,
  currencyOf,
  members,
  interestFor,
  ownMemberId,
  onRecordInterest,
  onWithdrawInterest,
  onSetVisited,
  onChoose,
  onBack,
  onDismiss,
  onHeight,
}: {
  selection: Selection
  /** The currency of the city a marker is filed under, or null when there is none. */
  currencyOf: (marker: Marker) => string | null
  members: readonly TripMember[]
  /** One marker's records, so this component never sees the whole trip's. */
  interestFor: (marker: Marker) => readonly MarkerInterest[]
  ownMemberId: string | null
  onRecordInterest: (marker: Marker, interested: boolean) => void
  onWithdrawInterest: (marker: Marker) => void
  onSetVisited: (marker: Marker, visited: boolean) => void
  onChoose: (index: number) => void
  onBack: () => void
  onDismiss: () => void
  /**
   * How tall this sheet ended up, so the map can lift its licence credit clear
   * of it. Reported rather than assumed: the sheet grows with its content up to
   * a cap, so there is no height for the map to hard-code.
   */
  onHeight?: (height: number) => void
}) {
  const theme = useTheme()
  const { group, index } = selection
  // The sheet is pinned to the very bottom of the screen, so its last field —
  // or its "Others at this point" button — would otherwise sit under the home
  // indicator, which is exactly where a thumb reaches for it.
  const insets = useSafeAreaInsets()

  const sheet = [
    styles.sheet,
    {
      backgroundColor: theme.colour.surface,
      borderColor: theme.colour.line,
      shadowColor: theme.elevation.lg.colour,
      paddingBottom: SPACE.md + insets.bottom,
    },
  ]

  const measure = (event: LayoutChangeEvent) =>
    onHeight?.(event.nativeEvent.layout.height)

  if (index === null) {
    return (
      <View style={sheet} onLayout={measure}>
        <View style={styles.headerRow}>
          <Text style={[styles.title, { color: theme.colour.ink }]}>
            {group.count} places here
          </Text>
          <Dismiss onDismiss={onDismiss} />
        </View>
        <Text style={[styles.hint, { color: theme.colour.inkMuted }]}>
          They share the same coordinates, so zooming will not separate them.
          Nothing has been moved — pick one.
        </Text>
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
                {group.views[i]!.typeLabel}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
    )
  }

  const marker = group.markers[index]!
  const view = group.views[index]!
  const currency = currencyOf(marker)

  return (
    <View style={sheet} onLayout={measure}>
      <View style={styles.headerRow}>
        <TypeChip view={view} />
        <Text style={[styles.title, { color: theme.colour.ink }]}>{marker.name}</Text>
        <Dismiss onDismiss={onDismiss} />
      </View>

      <View style={styles.tags}>
        <View
          style={[styles.tag, { backgroundColor: theme.markerFamily[view.family] }]}
        >
          <Text style={[styles.tagText, { color: theme.markerForeground }]}>
            {view.typeLabel}
          </Text>
        </View>
        {marker.price === null ? null : (
          <View style={[styles.tag, { backgroundColor: theme.colour.surfaceMuted }]}>
            {/* The currency of the city this is filed under, or none — never a
                guess. Formatted by the shared helper so the phone and the laptop
                cannot disagree about the same amount. */}
            <Text style={[styles.tagText, { color: theme.colour.inkMuted }]}>
              {formatPrice(marker.price, currency)}
            </Text>
          </View>
        )}
      </View>

      {/*
        A plain view, not a ScrollView.

        The sheet has no fixed height — it is pinned to the bottom and grows
        with its content up to a cap — and a ScrollView has no intrinsic
        content height in React Native. Nested inside a parent that is asking
        its children how tall they are, it answers with almost nothing, so the
        sheet closed up around the header and every field below the first was
        clipped away. The fields were rendering the whole time; there was just
        no room allotted to draw them in.

        The trade is that a very long note is cut off at the cap rather than
        scrolled. Showing four fields reliably beats scrolling one that nobody
        can see. The fix is a sheet with real detents, which is its own change.
      */}
      <View>
        <View style={styles.field}>
          <Text style={[styles.fieldLabel, { color: theme.colour.inkFaint }]}>
            Who wants to go
          </Text>
          <InterestRows
            members={members}
            interest={interestFor(marker)}
            ownMemberId={ownMemberId}
            onRecord={(interested) => onRecordInterest(marker, interested)}
            onWithdraw={() => onWithdrawInterest(marker)}
          />
        </View>

        <View style={styles.field}>
          <Text style={[styles.fieldLabel, { color: theme.colour.inkFaint }]}>
            Visited
          </Text>
          <VisitedToggle
            visited={marker.visited}
            onChange={(visited) => onSetVisited(marker, visited)}
          />
        </View>

        <Field label="Note" value={marker.note} />
        <Field label="Link" value={marker.link} />

        {group.count > 1 ? (
          <Pressable
            onPress={onBack}
            style={[styles.back, { borderColor: theme.colour.lineStrong }]}
            accessibilityRole="button"
          >
            <Text style={[styles.backText, { color: theme.colour.ink }]}>
              ← Others at this point
            </Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  )
}
