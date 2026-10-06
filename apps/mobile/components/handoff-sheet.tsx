import type { LngLat, TravelMode } from '@pinpoint/map'
import { handoffUrl, type HandoffApp } from '@pinpoint/routing'
import { SPACE, TYPE } from '@pinpoint/tokens'
import { message, type Message } from '@pinpoint/wording'
import { Linking, Platform, Pressable, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { Sheet } from '@/components/sheet'
import { useSay } from '@/lib/language'
import { useTheme } from '@/lib/theme'
import { role } from '@/lib/type'

/**
 * The phone's choice of maps app to continue a route in (`place-route`, *The
 * route can be continued in another maps app*).
 *
 * Drawn here rather than with the system's action sheet: Android has none, and
 * the words have to be the product's named sentences on both.
 *
 * Google Maps on both platforms, because its address opens the app when it is
 * installed and the website when it is not. Then Apple Maps on an iPhone, and on
 * Android a `geo:` address, which the device hands to its default maps app or
 * asks about.
 */
const APPS: Readonly<Record<'ios' | 'android', readonly HandoffApp[]>> = {
  ios: ['google', 'apple'],
  android: ['google', 'geo'],
}

const NAMES: Readonly<Record<HandoffApp, Message>> = {
  google: message('handoff.google'),
  apple: message('handoff.apple'),
  geo: message('handoff.other'),
}

export function HandoffSheet({
  open,
  onClose,
  to,
  mode,
  name,
}: {
  open: boolean
  onClose: () => void
  to: LngLat
  mode: TravelMode
  name: string
}) {
  const theme = useTheme()
  const say = useSay()
  const insets = useSafeAreaInsets()
  const apps = APPS[Platform.OS === 'ios' ? 'ios' : 'android']

  function choose(app: HandoffApp) {
    onClose()
    void Linking.openURL(handoffUrl(app, to, mode, name)).catch(() => {
      // Nothing answers a `geo:` address on a device with no maps app at all.
      // Google's address always has the browser, so fall back to it.
      if (app !== 'google') void Linking.openURL(handoffUrl('google', to, mode))
    })
  }

  return (
    <Sheet open={open} onRequestClose={onClose}>
      <Pressable
        style={styles.backdrop}
        onPress={onClose}
        accessibilityLabel={say(message('common.close'))}
      >
        <View
          // Swallows presses, so touching a row does not close through the
          // backdrop underneath it.
          onStartShouldSetResponder={() => true}
          style={[
            styles.sheet,
            {
              backgroundColor: theme.colour.surface,
              borderColor: theme.colour.line,
              paddingBottom: SPACE.md + insets.bottom,
            },
          ]}
        >
          <Text
            style={[styles.title, { color: theme.colour.inkMuted, borderBottomColor: theme.colour.line }]}
            accessibilityRole="header"
          >
            {say(message('handoff.title', { name }))}
          </Text>
          {apps.map((app) => (
            <Pressable
              key={app}
              onPress={() => choose(app)}
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.row,
                {
                  borderBottomColor: theme.colour.line,
                  backgroundColor: pressed ? theme.colour.surfaceMuted : 'transparent',
                },
              ]}
            >
              <Text style={[styles.rowText, { color: theme.colour.ink }]}>{say(NAMES[app])}</Text>
            </Pressable>
          ))}
          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.row,
              styles.last,
              { backgroundColor: pressed ? theme.colour.surfaceMuted : 'transparent' },
            ]}
          >
            <Text style={[styles.rowText, styles.cancel, { color: theme.colour.ink }]}>
              {say(message('common.cancel'))}
            </Text>
          </Pressable>
        </View>
      </Pressable>
    </Sheet>
  )
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 1,
    paddingTop: SPACE.sm,
  },
  title: {
    ...role(TYPE.note),
    textAlign: 'center',
    paddingHorizontal: SPACE.md,
    paddingTop: SPACE.sm,
    paddingBottom: SPACE.md,
    borderBottomWidth: 1,
  },
  row: {
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: SPACE.md,
    borderBottomWidth: 1,
  },
  last: { borderBottomWidth: 0 },
  rowText: { ...role(TYPE.rowName) },
  cancel: { fontWeight: '700' },
})
