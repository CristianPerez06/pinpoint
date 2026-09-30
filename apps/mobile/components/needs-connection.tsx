import { SPACE, TYPE } from '@pinpoint/tokens'
// Deep import, not the package root — see marker-icon.tsx.
import CloudOff from 'lucide-react-native/icons/cloud-off'
import type { ReactNode } from 'react'
import { StyleSheet, Text, View } from 'react-native'

import { useTheme } from '@/lib/theme'
import { role } from '@/lib/type'

/**
 * Why the controls beside it are greyed out: there is no connection
 * (`offline-use`).
 *
 * One line under the controls it explains, rather than a label on each: two
 * disabled buttons side by side have one reason, and saying it twice would
 * read as two problems.
 */
export function NeedsConnection({ children }: { children: ReactNode }) {
  const theme = useTheme()

  return (
    <View style={styles.line}>
      <CloudOff size={14} color={theme.colour.inkMuted} strokeWidth={2} />
      <Text style={[styles.text, { color: theme.colour.inkMuted }]}>{children}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  line: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACE.xs,
    paddingTop: SPACE.sm,
  },
  text: { ...role(TYPE.note), flexShrink: 1 },
})
