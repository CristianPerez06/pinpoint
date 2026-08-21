import { SPACE, TYPE } from '@pinpoint/tokens'
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { useTheme } from '@/lib/theme'
import { role } from '@/lib/type'

/**
 * Where the account and the trip live, rather than the trip's controls.
 *
 * Deliberately near-empty. One item is honest about how little belongs here
 * today, and the point of the sheet is not what it holds — it is that Sign out
 * has somewhere to be that is not the row a thumb reaches. Trip switching and
 * inviting land here when those exist, and neither has to relocate Sign out a
 * second time to do it.
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
})

export function MenuSheet({
  open,
  onClose,
  onSignOut,
  tripName,
}: {
  open: boolean
  onClose: () => void
  onSignOut: () => void
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
