import { COLOUR, RADIUS, SPACE } from '@pinpoint/tokens'
import type { ReactNode } from 'react'
import { StyleSheet, Text, View } from 'react-native'

/**
 * A note laid over the map without replacing it.
 *
 * Used for the two cases where the map itself is fine and only the markers are
 * in question: a trip with nothing on it, and a trip whose markers would not
 * load. Both keep the map, because the map is still true — the tiles arrived,
 * the camera is real, and hiding it would throw away the part that worked.
 *
 * `tone` is the entire difference between them, and it has to be a difference
 * a person notices without reading: muted grey for "nothing here yet", red for
 * "this is broken".
 *
 * The web app renders the same two states from the same token values and
 * shares none of this markup, which is what the `styling` spec requires.
 */
export function MarkersOverlayNote({
  tone = 'muted',
  children,
}: {
  tone?: 'muted' | 'danger'
  children: ReactNode
}) {
  const danger = tone === 'danger'

  return (
    <View
      style={[styles.note, danger ? styles.danger : styles.muted]}
      pointerEvents="none"
      accessibilityRole="alert"
    >
      <Text style={[styles.text, danger ? styles.dangerText : styles.mutedText]}>
        {children}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  note: {
    position: 'absolute',
    top: SPACE.md,
    left: SPACE.md,
    right: SPACE.md,
    borderWidth: 1,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACE.md,
    paddingVertical: SPACE.sm,
  },
  muted: {
    backgroundColor: COLOUR.surface,
    borderColor: COLOUR.border,
  },
  danger: {
    backgroundColor: COLOUR.dangerSurface,
    borderColor: COLOUR.danger,
  },
  text: { textAlign: 'center' },
  mutedText: { color: COLOUR.textMuted },
  dangerText: { color: COLOUR.danger, fontWeight: '600' },
})
