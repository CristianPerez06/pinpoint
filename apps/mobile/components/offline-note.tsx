import { dayOfDate, formatClock, formatDayShort } from '@pinpoint/core'
import { SPACE, TYPE } from '@pinpoint/tokens'
import { message } from '@pinpoint/wording'
// Deep import, not the package root — see marker-icon.tsx.
import CloudOff from 'lucide-react-native/icons/cloud-off'
import { StyleSheet, Text, View } from 'react-native'

import { useLanguage, useSay } from '@/lib/language'
import { useTheme } from '@/lib/theme'
import { role } from '@/lib/type'

/**
 * The phone is offline, and this is how old the trip on screen is.
 *
 * A line of its own under the header rather than a note floating on the map.
 * The map's top edge already holds the notes about what the filter shows, and
 * two things positioned against the same edge are one condition away from
 * sitting on each other; standing in the flow, this one pushes the map down
 * by a line instead, and only while the phone is offline.
 *
 * The day is named only when the read was not today. "As of 14:20" on the
 * morning after reads as a trip read a few minutes ago.
 */
export function OfflineNote({
  asOf,
  unavailable,
}: {
  asOf: number
  /** What on this screen cannot be used without a connection, if anything. */
  unavailable?: string
}) {
  const theme = useTheme()
  const say = useSay()
  const language = useLanguage()

  const moment = new Date(asOf)
  const time = formatClock(moment)
  const day = dayOfDate(moment)
  const text =
    day === dayOfDate(new Date())
      ? say(message('offline.asOf', { time }))
      : say(message('offline.asOfDay', { day: formatDayShort(language, day), time }))

  return (
    <View
      style={[
        styles.line,
        { backgroundColor: theme.colour.surfaceMuted, borderColor: theme.colour.line },
      ]}
      accessible
      accessibilityRole="text"
      accessibilityLiveRegion="polite"
    >
      <CloudOff size={16} color={theme.colour.inkMuted} strokeWidth={2} />
      <View style={styles.words}>
        <Text style={[styles.text, { color: theme.colour.ink }]} numberOfLines={2}>
          {text}
        </Text>
        {unavailable ? (
          <Text style={[styles.text, { color: theme.colour.inkMuted }]} numberOfLines={2}>
            {unavailable}
          </Text>
        ) : null}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  line: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.sm,
    paddingHorizontal: SPACE.md,
    paddingVertical: SPACE.sm,
    borderBottomWidth: 1,
  },
  words: { flexShrink: 1 },
  text: { ...role(TYPE.note) },
})
