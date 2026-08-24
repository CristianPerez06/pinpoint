import type { TripMember } from '@pinpoint/core'
import { SPACE, TYPE } from '@pinpoint/tokens'
import LogOut from 'lucide-react-native/icons/log-out'
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { useTheme } from '@/lib/theme'
import { role } from '@/lib/type'

/**
 * The account, and the way out. Nothing else.
 *
 * It held six things before this — choosing between trips, renaming one,
 * making one, People, Cities and Sign out — and every one of them was here
 * because it had nowhere else to go rather than because this was where it
 * belonged. They are all trip-scoped, and trips now open from the trip's own
 * name in the header, so what is left is the one thing that is about the
 * person rather than the trip.
 *
 * Still deliberately out of a thumb's reach. Nobody wants Sign out under their
 * thumb, and that has not stopped being true now that it is the only thing up
 * here — if anything it is more true, since it no longer has neighbours to hide
 * among.
 *
 * There is no first and last name to show. A member has one `displayName`, up
 * to sixty characters, that they chose or that whoever invited them typed.
 */

export function MenuSheet({
  open,
  onClose,
  onSignOut,
  member,
}: {
  open: boolean
  onClose: () => void
  onSignOut: () => void
  /**
   * Who this account is on this trip, or null before the membership is known.
   *
   * Null is a real state rather than a defensive one: members load with the
   * trip, and the sheet can be opened in the moment before they arrive.
   */
  member: TripMember | null
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
          <View style={[styles.account, { borderBottomColor: theme.colour.line }]}>
            <View
              style={[
                styles.avatar,
                {
                  backgroundColor: theme.colour.accentWash,
                  borderColor: theme.colour.accentRing,
                },
              ]}
            >
              <Text style={[styles.initials, { color: theme.colour.accentInk }]}>
                {initialsOf(member?.displayName ?? null)}
              </Text>
            </View>
            <View style={styles.who}>
              <Text
                style={[styles.name, { color: theme.colour.ink }]}
                numberOfLines={1}
              >
                {member?.displayName ?? 'Signed in'}
              </Text>
              {member !== null ? (
                <Text style={[styles.email, { color: theme.colour.inkMuted }]}>
                  {member.email}
                </Text>
              ) : null}
            </View>
          </View>

          <Pressable
            onPress={onSignOut}
            accessibilityRole="button"
            style={styles.signOut}
          >
            <LogOut size={18} color={theme.colour.danger} strokeWidth={2} />
            <Text style={[styles.signOutText, { color: theme.colour.danger }]}>
              Sign out
            </Text>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  )
}

/**
 * Up to two initials from whatever the person is called.
 *
 * Deliberately naive, and correct for that: it takes the first character of the
 * first and last whitespace-separated parts. A name in a script this does not
 * anticipate still yields its first character, which is a mark rather than a
 * mistake. `Array.from` rather than indexing, so a name beginning with an emoji
 * or an astral character is not cut in half.
 */
function initialsOf(name: string | null): string {
  if (name === null) return '·'
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '·'
  const first = Array.from(parts[0]!)[0] ?? ''
  const last = parts.length > 1 ? (Array.from(parts.at(-1)!)[0] ?? '') : ''
  return (first + last).toUpperCase()
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 1,
    paddingTop: SPACE.sm,
  },
  account: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    padding: SPACE.md,
    borderBottomWidth: 1,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: { ...role(TYPE.title), letterSpacing: -0.02 },
  who: { flex: 1, minWidth: 0 },
  name: { ...role(TYPE.title) },
  email: { ...role(TYPE.note) },
  signOut: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.sm + 2,
    paddingVertical: 15,
    paddingHorizontal: SPACE.md,
  },
  signOutText: { ...role(TYPE.rowName) },
})
