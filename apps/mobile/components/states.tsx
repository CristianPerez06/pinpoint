import { RADIUS, SPACE, TYPE } from '@pinpoint/tokens'
import type { ReactNode } from 'react'
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native'

import { useTheme } from '@/lib/theme'
import { role } from '@/lib/type'

/**
 * Loading, broken, and correctly empty — in React Native's idiom.
 *
 * These are the same three states the web app renders and deliberately not the
 * same components. The `styling` spec is explicit that platforms share token
 * values and not styling code, class-name vocabulary, or component markup; a
 * component has to render something, and `<div>` and `<View>` are not the same
 * something. A shared spinner is the rule's subject, not a way around it.
 *
 * Every measurement below comes from `@pinpoint/tokens` and every colour from
 * the theme it resolves, which is what keeps this looking like the same product
 * as the web app without either one importing the other's markup.
 */

const styles = StyleSheet.create({
  panel: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACE.sm,
    padding: SPACE.xl,
  },
  muted: { ...role(TYPE.body), textAlign: 'center' },
  failed: {
    borderWidth: 1,
    borderRadius: RADIUS.md,
    margin: SPACE.md,
  },
  failedText: { ...role(TYPE.body), fontWeight: '600', textAlign: 'center' },
})

export function LoadingState({ what = 'the map' }: { what?: string }) {
  const theme = useTheme()

  return (
    <View style={styles.panel}>
      <ActivityIndicator color={theme.colour.accent} />
      {/* Words as well as motion: an animation on its own is indistinguishable
          from a stalled one, and this is the state most often mistaken for
          emptiness. */}
      <Text style={[styles.muted, { color: theme.colour.inkMuted }]}>
        Loading {what}…
      </Text>
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
  const theme = useTheme()

  return (
    <View
      style={[
        styles.panel,
        styles.failed,
        {
          backgroundColor: theme.colour.dangerSurface,
          borderColor: theme.colour.danger,
        },
      ]}
    >
      <Text style={[styles.failedText, { color: theme.colour.danger }]}>
        {message}
      </Text>
      {children}
    </View>
  )
}

export function EmptyState({ children }: { children: ReactNode }) {
  const theme = useTheme()

  return (
    <View style={styles.panel}>
      <Text style={[styles.muted, { color: theme.colour.inkMuted }]}>{children}</Text>
    </View>
  )
}
