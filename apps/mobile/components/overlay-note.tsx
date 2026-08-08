import { COLOUR, RADIUS, SPACE } from '@pinpoint/tokens'
import type { ReactNode } from 'react'
import { StyleSheet, Text, View } from 'react-native'

/**
 * A note laid over the map without covering it.
 *
 * Used for the case the map cannot express on its own: it is rendering
 * correctly, at its default position, and there is genuinely nothing on it.
 * Without the note that is indistinguishable from a map that has not finished
 * loading.
 */
export function MarkersOverlayNote({ children }: { children: ReactNode }) {
  return (
    <View style={styles.note} pointerEvents="none">
      <Text style={styles.text}>{children}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  note: {
    position: 'absolute',
    top: SPACE.md,
    left: SPACE.md,
    right: SPACE.md,
    backgroundColor: COLOUR.surface,
    borderWidth: 1,
    borderColor: COLOUR.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACE.md,
    paddingVertical: SPACE.sm,
  },
  text: { color: COLOUR.textMuted, textAlign: 'center' },
})
