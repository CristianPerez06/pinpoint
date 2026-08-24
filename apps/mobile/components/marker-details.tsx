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
import { useState } from 'react'
import {
  type LayoutChangeEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native'
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

/**
 * How much of the screen the sheet may take before its contents start scrolling.
 *
 * A fraction of the *window* rather than of the sheet's parent, and definite
 * pixels rather than a percentage, because both matter to the fix below: the
 * sheet has to be able to compare its own measured height against a number it
 * already knows, and a percentage resolved against a parent nobody measured
 * cannot be compared to anything.
 *
 * Half rather than the 55% this used to be. The comparison only works while the
 * cap is reached before the parent's own bounds are, and the map area is the
 * window minus a header.
 */
const SHEET_CAP = 0.5

const styles = StyleSheet.create({
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
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
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
      <Text style={[styles.fieldLabel, { color: theme.colour.inkMuted }]}>
        {label}
      </Text>
      {value === null ? (
        <Text style={[styles.absent, { color: theme.colour.inkMuted }]}>
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
      <X size={18} color={theme.colour.inkMuted} strokeWidth={2.2} />
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
  onEdit,
  onDelete,
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

  const cap = Math.round(useWindowDimensions().height * SHEET_CAP)

  /**
   * Which marker's contents were found not to fit.
   *
   * Held as an id rather than a boolean so that moving to another place resets
   * it without an effect — a different marker is simply not the one that
   * overflowed, and the sheet goes back to sizing itself to its content.
   */
  const [overflowed, setOverflowed] = useState<string | null>(null)

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

  /**
   * Whether this marker's contents were too tall to show at once.
   *
   * Decided by measurement rather than by guessing at the content: a note can be
   * any length, the interest rows grow with the trip's members, and no rule
   * about characters or lines survives a second member joining.
   */
  const scrolls = overflowed === marker.id

  const fields = (
    <>
      <View style={styles.field}>
        <Text style={[styles.fieldLabel, { color: theme.colour.inkMuted }]}>
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
        <Text style={[styles.fieldLabel, { color: theme.colour.inkMuted }]}>
          Visited
        </Text>
        <VisitedToggle
          visited={marker.visited}
          onChange={(visited) => onSetVisited(marker, visited)}
        />
      </View>

      <Field label="Note" value={marker.note} />
      <Field label="Link" value={marker.link} />

      {/*
        Editing and removing, at the bottom rather than in the header.

        The header holds the place's identity and the way out; putting a
        destructive control up there would sit it beside a dismiss button, where
        a mis-tap costs a marker instead of a glance. Down here they follow what
        was recorded, which is the order somebody reads in — see it, then decide
        it is wrong.
      */}
      <View style={styles.rowActions}>
        <Pressable
          onPress={() => onEdit(marker)}
          accessibilityRole="button"
          accessibilityLabel={`Edit ${marker.name}`}
          style={[styles.action, { borderColor: theme.colour.lineStrong }]}
        >
          <Text style={[styles.actionText, { color: theme.colour.ink }]}>Edit</Text>
        </Pressable>
        <Pressable
          onPress={() => onDelete(marker)}
          accessibilityRole="button"
          accessibilityLabel={`Remove ${marker.name}`}
          style={[styles.action, { backgroundColor: theme.colour.dangerSurface }]}
        >
          <Text style={[styles.actionText, { color: theme.colour.danger }]}>
            Remove
          </Text>
        </Pressable>
      </View>

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
    </>
  )

  return (
    <View
      // A definite height once the contents are known not to fit, and content-
      // sized until then. A marker with a one-line note gets a small sheet; only
      // one that would be cut off gets a tall one.
      style={[sheet, scrolls ? { height: cap } : null]}
      onLayout={(event) => {
        const height = event.nativeEvent.layout.height
        measure(event)

        // Reaching the cap is the measurement. The sheet grows to its content,
        // so a height equal to the ceiling means the content wanted more —
        // there is no other way for it to end up exactly there.
        if (!scrolls && height >= cap - 1) setOverflowed(marker.id)
      }}
    >
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
        A ScrollView only once the sheet has a height to give it.

        This is the whole shape of the fix. A ScrollView has no intrinsic
        content height in React Native, so inside a parent that is asking its
        children how tall they are it answers with almost nothing — which is how
        an earlier attempt at this collapsed the sheet around its header and
        clipped every field below the first. Nothing was failing to render;
        there was simply no room allotted to draw it in.

        So the sheet measures itself first. While the content fits, this is a
        plain view and the sheet is exactly as tall as it needs to be. When the
        content does not fit, the sheet takes a definite height and `flex: 1`
        here finally resolves to the space left over, which is what a ScrollView
        needs to scroll.
      */}
      {scrolls ? (
        <ScrollView
          style={styles.scroller}
          contentContainerStyle={styles.scrollerContent}
          showsVerticalScrollIndicator
        >
          {fields}
        </ScrollView>
      ) : (
        <View>{fields}</View>
      )}
    </View>
  )
}
