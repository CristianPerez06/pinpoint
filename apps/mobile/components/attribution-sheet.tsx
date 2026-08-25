import { MAP_CREDITS } from '@pinpoint/map'
import { SPACE, TYPE } from '@pinpoint/tokens'
import ExternalLink from 'lucide-react-native/icons/external-link'
import { Linking, Modal, Pressable, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { useTheme } from '@/lib/theme'
import { role } from '@/lib/type'

/**
 * Who made the map, reached by pressing the credit that names them.
 *
 * Ours rather than the renderer's. MapLibre has a notice of its own behind
 * `showAttribution()`, and it was what this opened first: on iOS that is a
 * `UIAlertController` whose popover anchors to the attribution button's frame —
 * a button this application hides, whose frame therefore lands wherever the
 * renderer last put it. It drew an arrow pointing at the `Filter` tool. The
 * anchor is not reachable from here, and steering it by positioning an
 * invisible view is not a mechanism worth depending on.
 *
 * A sheet also says the same thing on both platforms, which the native notice
 * does not — Android answers the same call with a centred dialog. And it is the
 * sentence this application already speaks: everything else that expands from a
 * press expands into a sheet from this edge.
 */
export function AttributionSheet({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const theme = useTheme()
  const insets = useSafeAreaInsets()

  return (
    <Modal visible={open} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close">
        <View
          // The sheet swallows presses so that touching a row does not dismiss
          // through the backdrop underneath it.
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
          <View style={[styles.head, { borderBottomColor: theme.colour.line }]}>
            <Text style={[styles.title, { color: theme.colour.ink }]}>
              About this map
            </Text>
            <Text style={[styles.blurb, { color: theme.colour.inkMuted }]}>
              Four projects, none of them ours.
            </Text>
          </View>

          {MAP_CREDITS.map((credit) => (
            <Pressable
              key={credit.url}
              /*
                Opening a browser is the whole point of a credit — a name with no
                way to reach the project behind it is a worse answer than the one
                the licence asks for. A refusal is swallowed rather than surfaced:
                the sheet has already said the names, which is the part that
                matters, and a device with no browser is not a state this has
                anything useful to say about.
              */
              onPress={() => void Linking.openURL(credit.url).catch(() => {})}
              accessibilityRole="link"
              accessibilityLabel={`${credit.name}. ${credit.role}`}
              accessibilityHint="Opens in your browser"
              style={styles.row}
            >
              <View style={styles.what}>
                <Text style={[styles.name, { color: theme.colour.ink }]}>
                  {credit.name}
                </Text>
                <Text style={[styles.role, { color: theme.colour.inkMuted }]}>
                  {credit.role}
                </Text>
              </View>
              <ExternalLink
                size={16}
                color={theme.colour.inkMuted}
                strokeWidth={2}
              />
            </Pressable>
          ))}
        </View>
      </Pressable>
    </Modal>
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
  head: {
    gap: 2,
    padding: SPACE.md,
    borderBottomWidth: 1,
  },
  title: { ...role(TYPE.title) },
  blurb: { ...role(TYPE.note) },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.md,
    paddingVertical: 13,
    paddingHorizontal: SPACE.md,
  },
  // The only element that yields, so a long line wraps instead of pushing the
  // glyph that says "this leaves the application" off the edge.
  what: { flex: 1, minWidth: 0, gap: 1 },
  name: { ...role(TYPE.rowName) },
  role: { ...role(TYPE.note) },
})
