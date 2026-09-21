import {
  TAKE_BACK_CONFIRM,
  TAKE_BACK_LABEL,
  takeBackConsequence,
  takeBackQuestion,
  type TripMember,
} from '@pinpoint/core'
import { RADIUS, SPACE, TYPE } from '@pinpoint/tokens'
import { useState } from 'react'
import {
  KeyboardAvoidingView,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { Button, FormNote, Question, TextField } from '@/components/ui'
import { useTheme } from '@/lib/theme'
import { usePending } from '@/lib/use-pending'
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
  onInvite,
  onRemove,
}: {
  open: boolean
  onClose: () => void
  members: readonly TripMember[]
  /** So the reader is named the way the rest of the trip names them. */
  ownMemberId: string | null
  /** Resolves to the offending field when refused, or null on success. */
  onInvite: (
    displayName: string,
    email: string,
  ) => Promise<{ field: string; message: string } | null>
  /**
   * Take back an invitation nobody has claimed. Resolves to a refusal in words,
   * or null. Only ever called with a row whose `userId` is null.
   */
  onRemove: (member: TripMember) => Promise<string | null>
}) {
  const theme = useTheme()
  const insets = useSafeAreaInsets()
  const cap = Math.round(useWindowDimensions().height * SHEET_CAP)

  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [message, setMessage] = useState<string | null>(null)
  /**
   * This sheet's own wait.
   *
   * It used to read the workspace's `busy`, which was only ever true while a
   * *place* was being saved — so this control went dead during an operation it
   * had nothing to do with, and stayed live during its own. Two presses then
   * sent two invitations, and the second came back saying the person was
   * already on the trip, which is a true sentence and a baffling one.
   */
  const [adding, startInvite] = usePending()
  /** Which invitation is being asked about, or null. The row rather than its id,
   *  so the question can name the person and the address without a second look. */
  const [asking, setAsking] = useState<TripMember | null>(null)
  const [removing, startRemove] = usePending()

  function invite() {
    setErrors({})
    setMessage(null)

    startInvite(async () => {
      const problem = await onInvite(displayName.trim(), email.trim())
      if (problem) {
        if (problem.field === '_') setMessage(problem.message)
        else setErrors({ [problem.field]: problem.message })
        return
      }

      setDisplayName('')
      setEmail('')
    })
  }

  function close() {
    setErrors({})
    setMessage(null)
    onClose()
  }

  return (
    <Modal visible={open} animationType="slide" transparent onRequestClose={close}>
      <Pressable style={styles.backdrop} onPress={close} accessibilityLabel="Close">
        {/*
          A positioner, and nothing else. The surface is the `View` inside it.

          `KeyboardAvoidingView` with `behavior="padding"` renders
          `StyleSheet.compose(style, { paddingBottom: bottomHeight })`, and
          `bottomHeight` is 0 whenever the keyboard is down — so a `paddingBottom`
          handed to it is overwritten on every render where the keyboard is
          closed. The sheets that kept theirs are the ones whose surface is a
          plain `View`; this is now one of them. `TripSheet` carries the longer
          account of how it was found.
        */}
        {/*
          Padding on both platforms. Android used to get `undefined` here, on
          the premise that `adjustResize` shrinks the window and a second
          correction in JavaScript would double it. Measured on an emulator it
          does not: Expo enforces edge-to-edge from SDK 54, the window keeps its
          full height, and the sheet did not move at all — the keyboard covered
          the fields and the save button. `padding` is what reserves the space.
        */}
        <KeyboardAvoidingView behavior="padding">
          <View
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
                  <View style={styles.who}>
                    <Text style={[styles.personName, { color: theme.colour.ink }]}>
                      {member.id === ownMemberId ? 'You' : member.displayName}
                    </Text>
                    {member.userId === null ? (
                      <Text style={[styles.pending, { color: theme.colour.inkMuted }]}>
                        not joined yet · {member.email}
                      </Text>
                    ) : null}
                  </View>
                  {/*
                    Only on a row nobody has claimed, and only while nothing is
                    being asked. The second condition is the rule rather than
                    tidiness: no control offering to destroy another record may
                    stand beside a standing question.

                    Always drawn rather than revealed, unlike the laptop's — a
                    phone has no hover to reveal it with.
                  */}
                  {member.userId === null && asking === null ? (
                    <Pressable
                      onPress={() => {
                        setMessage(null)
                        setAsking(member)
                      }}
                      accessibilityRole="button"
                      accessibilityLabel={`${TAKE_BACK_LABEL} ${member.displayName}'s invitation`}
                      hitSlop={6}
                      style={[
                        styles.takeBack,
                        { borderColor: theme.colour.lineStrong },
                      ]}
                    >
                      <Text
                        style={[styles.takeBackText, { color: theme.colour.danger }]}
                      >
                        {TAKE_BACK_LABEL}
                      </Text>
                    </Pressable>
                  ) : null}
                </View>
              ))}

              {asking !== null ? (
                <Question
                  question={takeBackQuestion(asking.displayName)}
                  consequence={takeBackConsequence(asking.email)}
                  confirm={TAKE_BACK_CONFIRM}
                  waiting={removing}
                  onConfirm={() => {
                    const member = asking
                    startRemove(async () => {
                      const problem = await onRemove(member)
                      setAsking(null)
                      if (problem) setMessage(problem)
                    })
                  }}
                  onDecline={() => setAsking(null)}
                />
              ) : null}

              {/*
                While a question stands the sheet is about that one act.

                Nothing requires hiding an invite form — it destroys nothing —
                but the city sheet already settled the shape, and for the same
                reason: fields left live beside a question invite somebody to
                start a different write in a surface waiting on an answer.
              */}
              {asking === null ? (
              <Text style={[styles.hint, { color: theme.colour.inkMuted }]}>
                Adding somebody puts them on the trip straight away. Nothing is sent
                — tell them yourself, and the trip appears when they sign in with
                this address.
              </Text>
              ) : null}

              {asking === null ? (
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
                  label={adding ? 'Adding…' : 'Add to trip'}
                  tone="primary"
                  disabled={
                    adding || displayName.trim() === '' || email.trim() === ''
                  }
                  onPress={invite}
                />
              </View>
              ) : null}
            </ScrollView>
          </View>
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
  // A row now, with the name and address stacked beside whatever it offers.
  person: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.sm,
    paddingVertical: 11,
    borderBottomWidth: 1,
  },
  // `minWidth: 0` so a long address is cut rather than pushing the control off
  // the sheet. `flex: 1` so it takes what is left after the control.
  who: { flex: 1, minWidth: 0, gap: 1 },
  personName: { ...role(TYPE.rowName) },
  // Always drawn, because a phone has no hover to reveal it with. Outlined
  // rather than filled: it is the quieter of the two danger tones, and the
  // confirming control in the question is the louder one.
  takeBack: {
    flexShrink: 0,
    borderWidth: 1,
    borderRadius: RADIUS.md,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  takeBackText: { ...role(TYPE.note), fontWeight: '700' },
  // Muted rather than alarming: an invitation not yet acted on is the ordinary
  // state of one. What it must do is show the address, because a mistyped one is
  // indistinguishable from a correct one until it is read.
  pending: { ...role(TYPE.note) },
  hint: { ...role(TYPE.note), paddingTop: SPACE.md },
  form: { gap: SPACE.sm, paddingTop: SPACE.sm },
})
