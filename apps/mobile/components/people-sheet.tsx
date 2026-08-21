import type { TripMember } from '@pinpoint/core'
import { SPACE, TYPE } from '@pinpoint/tokens'
import { useState } from 'react'
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { Button, FormNote, TextField } from '@/components/ui'
import { useTheme } from '@/lib/theme'
import { role } from '@/lib/type'

/**
 * Who is on the trip, and adding somebody.
 *
 * The list is not decoration. An invitation is matched on an email address and
 * delivered by whoever sent it — nothing is emailed — so a mistyped address
 * produces a member row nobody can ever claim, and two screens that both look
 * correct: the inviter sees the name they typed, and the invited person sees an
 * empty trip list they cannot explain. Neither can diagnose it and only the
 * inviter can fix it.
 *
 * Marking who has not joined, and at what address, is the whole of the feedback
 * loop. `userId` has been fetched since the interest change and shown nowhere
 * until now.
 *
 * In the header menu rather than the bar at the bottom, by the same rule that
 * put Cities there: what is touched rarely goes where a thumb does not land by
 * accident.
 */

/** Fraction of the screen the sheet may grow to before it scrolls instead. */
const SHEET_CAP = 0.85

export function PeopleSheet({
  open,
  onClose,
  members,
  ownMemberId,
  busy,
  onInvite,
}: {
  open: boolean
  onClose: () => void
  members: readonly TripMember[]
  /** So the reader is named the way the rest of the trip names them. */
  ownMemberId: string | null
  busy: boolean
  /** Resolves to the offending field when refused, or null on success. */
  onInvite: (
    displayName: string,
    email: string,
  ) => Promise<{ field: string; message: string } | null>
}) {
  const theme = useTheme()
  const insets = useSafeAreaInsets()
  const cap = Math.round(useWindowDimensions().height * SHEET_CAP)

  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [message, setMessage] = useState<string | null>(null)

  async function invite() {
    setErrors({})
    setMessage(null)

    const problem = await onInvite(displayName.trim(), email.trim())
    if (problem) {
      if (problem.field === '_') setMessage(problem.message)
      else setErrors({ [problem.field]: problem.message })
      return
    }

    setDisplayName('')
    setEmail('')
  }

  function close() {
    setErrors({})
    setMessage(null)
    onClose()
  }

  return (
    <Modal visible={open} animationType="slide" transparent onRequestClose={close}>
      <Pressable style={styles.backdrop} onPress={close} accessibilityLabel="Close">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          // The sheet swallows presses so that touching a field does not dismiss
          // through the backdrop underneath it.
          onStartShouldSetResponder={() => true}
          style={[
            styles.sheet,
            {
              backgroundColor: theme.colour.surface,
              borderColor: theme.colour.line,
              // A definite ceiling, so the `ScrollView` inside has something to
              // resolve against — see `AGENTS.md` on content-sized containers.
              maxHeight: cap,
              paddingBottom: SPACE.md + insets.bottom,
            },
          ]}
        >
          <View style={styles.headerRow}>
            <Text style={[styles.title, { color: theme.colour.ink }]}>People</Text>
            <Pressable onPress={close} accessibilityRole="button" style={styles.done}>
              <Text style={[styles.doneText, { color: theme.colour.accentInk }]}>
                Done
              </Text>
            </Pressable>
          </View>

          <ScrollView keyboardShouldPersistTaps="handled">
            {members.map((member) => (
              <View
                key={member.id}
                style={[styles.person, { borderColor: theme.colour.line }]}
              >
                <Text style={[styles.personName, { color: theme.colour.ink }]}>
                  {member.id === ownMemberId ? 'You' : member.displayName}
                </Text>
                {member.userId === null ? (
                  <Text style={[styles.pending, { color: theme.colour.inkMuted }]}>
                    not joined yet · {member.email}
                  </Text>
                ) : null}
              </View>
            ))}

            <Text style={[styles.hint, { color: theme.colour.inkMuted }]}>
              Adding somebody puts them on the trip straight away. Nothing is sent
              — tell them yourself, and the trip appears when they sign in with
              this address.
            </Text>

            <View style={styles.form}>
              <TextField
                label="Name"
                value={displayName}
                onChange={setDisplayName}
                error={errors.displayName}
                placeholder="What to call them on this trip"
              />
              <TextField
                label="Email"
                value={email}
                onChange={setEmail}
                error={errors.email}
                placeholder="The address they will sign in with"
                keyboardType="email-address"
                autoCapitalize="none"
              />

              {message ? <FormNote tone="danger">{message}</FormNote> : null}

              <Button
                label="Add to trip"
                tone="primary"
                disabled={
                  busy || displayName.trim() === '' || email.trim() === ''
                }
                onPress={() => void invite()}
              />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
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
    padding: SPACE.md,
    gap: SPACE.xs,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: SPACE.xs,
  },
  title: { ...role(TYPE.title), flex: 1 },
  done: { paddingVertical: SPACE.xs, paddingHorizontal: SPACE.sm },
  doneText: { ...role(TYPE.control), fontWeight: '700' },
  person: { paddingVertical: 11, borderBottomWidth: 1, gap: 1 },
  personName: { ...role(TYPE.rowName) },
  // Muted rather than alarming: an invitation not yet acted on is the ordinary
  // state of one. What it must do is show the address, because a mistyped one is
  // indistinguishable from a correct one until it is read.
  pending: { ...role(TYPE.note) },
  hint: { ...role(TYPE.note), paddingTop: SPACE.md },
  form: { gap: SPACE.sm, paddingTop: SPACE.sm },
})
