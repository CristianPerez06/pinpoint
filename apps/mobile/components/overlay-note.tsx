import { RADIUS, SPACE, TYPE } from '@pinpoint/tokens'
import type { ReactNode } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'

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
 *
 * `onPress` makes the note itself the thing that is pressed, and it has to be
 * this component rather than a `Pressable` wrapped around it at the call site.
 * That was how the first tappable note was written and it put the note off the
 * bottom of the screen: the surface below is `position: absolute`, which
 * positions against its **parent**, and a wrapper whose only child is taken out
 * of flow has no size and is laid out after the map has filled the column. So
 * `top: 16` meant sixteen points below the bottom edge. **Learn the shape of
 * this one**: the condition is true, the component renders, every value in it is
 * correct, and nothing is on screen — it reads as a state that never fires and
 * never is. The note that is not pressable was a direct child of the body and
 * was always fine, which is what made the two look interchangeable.
 */
export function MarkersOverlayNote({
  tone = 'muted',
  onPress,
  children,
}: {
  tone?: 'muted' | 'danger'
  /** What pressing the note does, where it offers something. */
  onPress?: () => void
  children: ReactNode
}) {
  const theme = useTheme()
  const danger = tone === 'danger'

  if (onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        onPress={onPress}
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
      </Pressable>
    )
  }

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
