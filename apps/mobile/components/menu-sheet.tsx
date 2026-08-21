import { SPACE, TYPE } from '@pinpoint/tokens'
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { useTheme } from '@/lib/theme'
import { role } from '@/lib/type'

/**
 * Where the account and the trip live, rather than the trip's controls.
 *
 * Two items now. It was left near-empty on the expectation that trip-scoped rare
 * things would land here, and Cities is the first of them — arriving without
 * having to relocate Sign out, which is what the expectation was for. Trip
 * switching and inviting land here too when those exist.
 *
 * What makes something belong here rather than in the bar at the bottom is how
 * often it is touched, not what it is about. A city is named once and corrected
 * almost never; the filter is touched constantly.
 *
 * A modal in the shape `filter-sheet.tsx` uses, for the same reason that one is:
 * a decision made and dismissed, with the map dimmed behind it to say it is
 * waiting. The marker sheet is the odd one out, and correctly so — it describes
 * a pin somebody is looking at, so it must not cover the map.
 */

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 1,
    padding: SPACE.md,
    gap: SPACE.xs,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: SPACE.xs,
  },
  title: { ...role(TYPE.title), flex: 1 },
  done: { paddingVertical: SPACE.xs, paddingHorizontal: SPACE.sm },
  doneText: { ...role(TYPE.control), fontWeight: '700' },
  item: { paddingVertical: 13 },
  itemText: { ...role(TYPE.body) },
  divide: { height: 1 },
})

export function MenuSheet({
  open,
  onClose,
  onSignOut,
  onOpenCities,
  tripName,
}: {
  open: boolean
  onClose: () => void
  onSignOut: () => void
  /** Opens the sheet where a trip's cities are corrected. */
  onOpenCities: () => void
  /** Named here as well as in the header, because a sheet that covers the
      header should still say which trip it belongs to. */
  tripName: string
}) {
  const theme = useTheme()
  const insets = useSafeAreaInsets()

  return (
    <Modal visible={open} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close">
        {/* The sheet swallows presses so that touching a row does not dismiss
            through the backdrop underneath it. */}
        <Pressable
          onPress={(event) => event.stopPropagation()}
          style={[
            styles.sheet,
            {
              backgroundColor: theme.colour.surface,
              borderColor: theme.colour.line,
              paddingBottom: SPACE.md + insets.bottom,
            },
          ]}
        >
          <View style={styles.headerRow}>
            <Text style={[styles.title, { color: theme.colour.ink }]}>{tripName}</Text>
            <Pressable onPress={onClose} accessibilityRole="button" style={styles.done}>
              <Text style={[styles.doneText, { color: theme.colour.accentInk }]}>
                Done
              </Text>
            </Pressable>
          </View>

          {/* The first of the trip-scoped things this sheet was left empty for.
              Rare enough to belong up here rather than in the row a thumb
              reaches: a city is named once and corrected almost never. */}
          <Pressable
            onPress={onOpenCities}
            accessibilityRole="button"
            style={styles.item}
          >
            <Text style={[styles.itemText, { color: theme.colour.ink }]}>Cities</Text>
          </Pressable>

          <View style={[styles.divide, { backgroundColor: theme.colour.line }]} />

          <Pressable
            onPress={onSignOut}
            accessibilityRole="button"
            style={styles.item}
          >
            <Text style={[styles.itemText, { color: theme.colour.ink }]}>Sign out</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  )
}
