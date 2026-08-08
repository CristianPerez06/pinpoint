import { COLOUR, RADIUS, SPACE } from '@pinpoint/tokens'
import type { ReactNode } from 'react'
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native'

/**
 * Loading, broken, and correctly empty — in React Native's idiom.
 *
 * These are the same three states the web app renders and deliberately not the
 * same components. The `styling` spec is explicit that platforms share token
 * values and not styling code, class-name vocabulary, or component markup; a
 * component has to render something, and `<div>` and `<View>` are not the same
 * something. A shared spinner is the rule's subject, not a way around it.
 *
 * Every colour and measurement below comes from `@pinpoint/tokens`, which is
 * what keeps this looking like the same product as the web app without either
 * one importing the other's markup.
 */

const styles = StyleSheet.create({
  panel: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACE.sm,
    padding: SPACE.xl,
  },
  muted: {
    color: COLOUR.textMuted,
    textAlign: 'center',
  },
  failed: {
    backgroundColor: COLOUR.dangerSurface,
    borderColor: COLOUR.danger,
    borderWidth: 1,
    borderRadius: RADIUS.md,
    margin: SPACE.md,
  },
  failedText: {
    color: COLOUR.danger,
    fontWeight: '600',
    textAlign: 'center',
  },
})

export function LoadingState({ what = 'the map' }: { what?: string }) {
  return (
    <View style={styles.panel}>
      <ActivityIndicator />
      {/* Words as well as motion: an animation on its own is indistinguishable
          from a stalled one, and this is the state most often mistaken for
          emptiness. */}
      <Text style={styles.muted}>Loading {what}…</Text>
    </View>
  )
}

export function FailedState({
  message,
  children,
}: {
  message: string
  children?: ReactNode
}) {
  return (
    <View style={[styles.panel, styles.failed]}>
      <Text style={styles.failedText}>{message}</Text>
      {children}
    </View>
  )
}

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <View style={styles.panel}>
      <Text style={styles.muted}>{children}</Text>
    </View>
  )
}
