import { RADIUS, SPACE, TYPE } from '@pinpoint/tokens'
import type { ReactNode } from 'react'
import { StyleSheet, Text, View } from 'react-native'

import { useTheme } from '@/lib/theme'
import { role } from '@/lib/type'

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
  const theme = useTheme()
  const danger = tone === 'danger'

  return (
    <View
      style={[
        styles.note,
        danger
          ? {
              backgroundColor: theme.colour.dangerSurface,
              borderColor: theme.colour.danger,
            }
          : {
              backgroundColor: theme.colour.surface,
              borderColor: theme.colour.line,
            },
      ]}
      pointerEvents="none"
      accessibilityRole="alert"
    >
      <Text
        style={[
          styles.text,
          danger
            ? { color: theme.colour.danger, fontWeight: '600' }
            : { color: theme.colour.inkMuted },
        ]}
      >
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
    borderRadius: RADIUS.pill,
    paddingHorizontal: SPACE.md,
    paddingVertical: SPACE.sm,
  },
  text: { ...role(TYPE.note), textAlign: 'center' },
})
