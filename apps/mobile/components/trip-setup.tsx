import type { FieldErrors } from '@pinpoint/core'
import { createTrip } from '@pinpoint/data'
import { SPACE, TYPE } from '@pinpoint/tokens'
import { useState } from 'react'
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { Button, FormNote, TextField } from '@/components/ui'
import { supabase } from '@/lib/supabase'
import { useTheme } from '@/lib/theme'
import { role } from '@/lib/type'

/**
 * What somebody on no trips sees, which until now was a full stop.
 *
 * Both applications rendered "You are not on any trips yet." and offered
 * nothing. That was honest while a trip could only arrive by migration; it is a
 * dead end now that one can be made.
 *
 * Two people land here wanting different things. Somebody starting out needs to
 * make a trip. Somebody who was told they had been added to one needs to know
 * why they cannot see it — and the answer is almost always that the address they
 * signed up with is not the address they were added at.
 *
 * What this deliberately does not do is check. Telling an arbitrary account
 * whether an invitation exists for some address would let anyone learn who is on
 * what trip by typing addresses in.
 */
export function TripSetup({ onCreated }: { onCreated: (tripId: string) => void }) {
  const theme = useTheme()
  const insets = useSafeAreaInsets()

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.screen, { backgroundColor: theme.colour.ground }]}
    >
      <ScrollView
        contentContainerStyle={[
          styles.body,
          {
            paddingTop: SPACE.xl + insets.top,
            paddingBottom: SPACE.xl + insets.bottom,
          },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.brand}>
          <View style={[styles.dot, { backgroundColor: theme.colour.accent }]} />
          <Text style={[styles.title, { color: theme.colour.ink }]}>Start a trip</Text>
        </View>

        <Text style={[styles.lead, { color: theme.colour.inkMuted }]}>
          A trip is one shared map. Everyone you add to it sees the same places.
        </Text>

        <CreateTripForm onCreated={onCreated} />

        {/*
          Addressed to the other person who lands here: somebody who does not
          want to create anything and is trying to work out why what they were
          promised is not here. Separated by a rule, because it is not part of
          the flow above it.
        */}
        <View style={[styles.note, { borderColor: theme.colour.line }]}>
          <Text style={[styles.noteText, { color: theme.colour.inkMuted }]}>
            <Text style={styles.noteStrong}>
              Expecting to be on someone else’s trip?{' '}
            </Text>
            You are added by email address, and the trip appears when you sign in
            with the same one. If it has not appeared, check that the address you
            signed up with is the address they added — and ask them to look at the
            trip’s people, where anyone who has not joined yet is shown with the
            address they were added at.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

/**
 * The two questions, and nothing around them.
 *
 * Split out because there are two ways in and they are not the same screen. The
 * first trip is made from an empty state that also has to explain why somebody
 * might be seeing it; every trip after it is made from the menu, beside the trip
 * you are already on, where that explanation would be noise.
 *
 * Building only the first was an oversight caught by using it: the requirement
 * says any signed-in person may create a trip, and only its *scenario* was about
 * having none.
 */
export function CreateTripForm({
  onCreated,
}: {
  onCreated: (tripId: string) => void
}) {
  const [name, setName] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [busy, setBusy] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [message, setMessage] = useState<string | null>(null)

  async function create() {
    setBusy(true)
    setFieldErrors({})
    setMessage(null)

    const outcome = await createTrip(supabase, {
      name: name.trim(),
      displayName: displayName.trim(),
    })

    setBusy(false)

    if (!outcome.ok) {
      if (outcome.kind === 'invalid-input') setFieldErrors(outcome.fieldErrors)
      else setMessage(outcome.message)
      return
    }

    onCreated(outcome.data.id)
  }

  return (
    <>
      <TextField
        label="What is the trip called?"
        value={name}
        onChange={setName}
        error={fieldErrors.name}
        placeholder="Japan 2026"
      />

      {/*
        Asked here rather than derived, because there is no later moment that
        asks. The database could take the local part of the email address and
        nobody would have chosen it — a member list reading `cristian.ap84` is
        the result, permanently.
      */}
      <TextField
        label="What should we call you on it?"
        value={displayName}
        onChange={setDisplayName}
        error={fieldErrors.displayName}
        placeholder="Your name, as the others would say it"
      />

      {message ? <FormNote tone="danger">{message}</FormNote> : null}

      <Button
        label={busy ? 'Creating…' : 'Create trip'}
        tone="primary"
        disabled={busy || name.trim() === '' || displayName.trim() === ''}
        onPress={() => void create()}
      />
    </>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  body: { paddingHorizontal: SPACE.lg, gap: SPACE.md },
  brand: { flexDirection: 'row', alignItems: 'center', gap: SPACE.sm },
  dot: { width: 9, height: 9, borderRadius: 5 },
  title: { ...role(TYPE.display) },
  lead: { ...role(TYPE.body) },
  note: { paddingTop: SPACE.md, borderTopWidth: 1 },
  noteText: { ...role(TYPE.note) },
  noteStrong: { fontWeight: '700' },
})
