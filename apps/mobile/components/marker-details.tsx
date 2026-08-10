import type { Marker } from '@pinpoint/core'
import type { MarkerGroup, MarkerView } from '@pinpoint/map'
import { COLOUR, MARKER_SIZE, RADIUS, SPACE } from '@pinpoint/tokens'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'

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
 */

const styles = StyleSheet.create({
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    maxHeight: '55%',
    backgroundColor: COLOUR.surface,
    borderTopLeftRadius: RADIUS.md * 2,
    borderTopRightRadius: RADIUS.md * 2,
    borderTopWidth: 1,
    borderColor: COLOUR.border,
    padding: SPACE.md,
    gap: SPACE.sm,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: SPACE.sm },
  title: { fontSize: 17, fontWeight: '600', color: COLOUR.text, flexShrink: 1 },
  dismiss: { marginLeft: 'auto', padding: SPACE.xs },
  dismissText: { fontSize: 20, color: COLOUR.textMuted, lineHeight: 20 },
  fieldRow: { flexDirection: 'row', gap: SPACE.sm, paddingVertical: SPACE.xs },
  fieldLabel: { width: 64, color: COLOUR.textMuted, fontSize: 13 },
  fieldValue: { color: COLOUR.text, flex: 1 },
  absent: { color: COLOUR.textMuted, fontStyle: 'italic', flex: 1 },
  hint: { color: COLOUR.textMuted, fontSize: 13 },
  choice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.sm,
    paddingVertical: SPACE.sm,
  },
  choiceType: { marginLeft: 'auto', color: COLOUR.textMuted, fontSize: 13 },
  back: {
    marginTop: SPACE.sm,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: COLOUR.border,
    borderRadius: RADIUS.sm,
    paddingVertical: SPACE.xs,
    paddingHorizontal: SPACE.sm,
  },
  backText: { color: COLOUR.text },
})

function Pin({ view, size = MARKER_SIZE }: { view: MarkerView; size?: number }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: RADIUS.pill,
        backgroundColor: view.colour,
        borderWidth: 2,
        borderColor: view.foreground,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ fontSize: Math.round(size * 0.5) }}>{view.icon}</Text>
    </View>
  )
}

/** A field that holds nothing is shown as holding nothing, never as blank text. */
function Field({ label, value }: { label: string; value: string | null }) {
  return (
    <View style={styles.fieldRow}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {value === null ? (
        <Text style={styles.absent}>Not recorded</Text>
      ) : (
        <Text style={styles.fieldValue}>{value}</Text>
      )}
    </View>
  )
}

function Dismiss({ onDismiss }: { onDismiss: () => void }) {
  return (
    <Pressable
      onPress={onDismiss}
      accessibilityRole="button"
      accessibilityLabel="Close"
      style={styles.dismiss}
    >
      <Text style={styles.dismissText}>×</Text>
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
  onChoose,
  onBack,
  onDismiss,
}: {
  selection: Selection
  onChoose: (index: number) => void
  onBack: () => void
  onDismiss: () => void
}) {
  const { group, index } = selection

  if (index === null) {
    return (
      <View style={styles.sheet}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>{group.count} places here</Text>
          <Dismiss onDismiss={onDismiss} />
        </View>
        <Text style={styles.hint}>
          They share the same coordinates, so zooming will not separate them.
        </Text>
        <ScrollView>
          {group.markers.map((marker, i) => (
            <Pressable
              key={marker.id}
              onPress={() => onChoose(i)}
              style={styles.choice}
              accessibilityRole="button"
            >
              <Pin view={group.views[i]!} size={24} />
              <Text style={styles.fieldValue}>{marker.name}</Text>
              <Text style={styles.choiceType}>{group.views[i]!.typeLabel}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>
    )
  }

  const marker = group.markers[index]!
  const view = group.views[index]!

  return (
    <View style={styles.sheet}>
      <View style={styles.headerRow}>
        <Pin view={view} />
        <Text style={styles.title}>{marker.name}</Text>
        <Dismiss onDismiss={onDismiss} />
      </View>

      <ScrollView>
        <Field label="Type" value={view.typeLabel} />
        <Field label="Note" value={marker.note} />
        <Field label="Link" value={marker.link} />
        {/* No currency is stored yet, so none is invented here. */}
        <Field label="Price" value={marker.price === null ? null : String(marker.price)} />

        {group.count > 1 ? (
          <Pressable onPress={onBack} style={styles.back} accessibilityRole="button">
            <Text style={styles.backText}>← Others at this point</Text>
          </Pressable>
        ) : null}
      </ScrollView>
    </View>
  )
}
