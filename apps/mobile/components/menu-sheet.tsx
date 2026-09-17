import type { TripMember } from '@pinpoint/core'
import { SPACE, TYPE } from '@pinpoint/tokens'
import { useRouter } from 'expo-router'
import LogOut from 'lucide-react-native/icons/log-out'
import SettingsIcon from 'lucide-react-native/icons/settings'
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { useTheme } from '@/lib/theme'
import { role } from '@/lib/type'

/**
 * The account, and the way out.
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
 *
 * `Refresh` **used to be here, and its absence is now the point.** It was put
 * up here because it is rare, and being rare is exactly what made it wrong: a
 * control buried in the account menu reads as something you do to your account,
 * and this one is about the screen being read. It is now a button on the map,
 * where `workspace-chrome` puts it — beside the other instrument of looking and
 * clear of it, rather than among the things that belong to the person.
 *
 * Nothing about *why* it exists changed. It is still the way back from a read
 * that failed while the device was offline, still the only such way on a phone,
 * and still forced past the freshness floor because somebody pressed it.
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
  const router = useRouter()

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

          {/*
            The account's own screen, and the only row here that leaves.

            First, now that `Refresh` has gone to the map — and still above
            `Sign out`, which is where web's menu carries it too. The two menus
            hold the same items in the same order on purpose, so somebody who
            has used one recognises the other, and they match again: web's lost
            its `Refresh` row in #153 and this one has just lost its. `Sign out`
            stays last and out of a thumb's reach; that is a rule rather than a
            layout preference.

            The sheet is dismissed before navigating. A modal left standing over
            a route change is still there when the person comes back, covering
            the screen they returned to.
          */}
          <Pressable
            onPress={() => {
              onClose()
              router.push('/settings')
            }}
            accessibilityRole="button"
            style={[styles.row, { borderBottomColor: theme.colour.line }]}
          >
            <SettingsIcon size={18} color={theme.colour.inkMuted} strokeWidth={2} />
            <Text style={[styles.rowText, { color: theme.colour.ink }]}>Settings</Text>
          </Pressable>

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
  /**
   * The same metrics as `signOut` below, with a rule under it.
   *
   * Two rows in a column need a boundary between them or they read as one
   * block of text with two icons; Sign out keeps none under it because there is
   * nothing after it to be separated from.
   */
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.sm + 2,
    paddingVertical: 15,
    paddingHorizontal: SPACE.md,
    borderBottomWidth: 1,
  },
  rowText: { ...role(TYPE.rowName) },
  signOut: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.sm + 2,
    paddingVertical: 15,
    paddingHorizontal: SPACE.md,
  },
  signOutText: { ...role(TYPE.rowName) },
})
