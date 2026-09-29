import { changePassword } from '@pinpoint/auth'
import { RADIUS, SPACE, TYPE } from '@pinpoint/tokens'
import { message, type Message } from '@pinpoint/wording'
import KeyRound from 'lucide-react-native/icons/key-round'
import { useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'

import { AuthButton } from '@/components/auth-screen'
import { NewPasswordForm } from '@/components/new-password-form'
import { config } from '@/lib/config'
import { useSay } from '@/lib/language'
import { supabase } from '@/lib/supabase'
import { useTheme } from '@/lib/theme'
import { role } from '@/lib/type'

/**
 * "Change password", under the address in Account.
 *
 * Closed, it is one row saying what it does and what it costs: the other
 * devices are signed out. Open, it is the reset's new-password form with the
 * current password asked for first. A change that works closes the form and
 * leaves the confirmation in its place.
 *
 * Not drawn at all where a forgotten password cannot be reset — see
 * `config.passwordChanges`.
 */
export function ChangePassword() {
  const theme = useTheme()
  const say = useSay()
  const [open, setOpen] = useState(false)
  const [refusal, setRefusal] = useState<Message | null>(null)
  const [done, setDone] = useState(false)

  if (!config.passwordChanges) return null

  const card = [
    styles.card,
    { backgroundColor: theme.colour.surface, borderColor: theme.colour.line },
  ]

  if (!open) {
    return (
      <>
        {done ? (
          <Text
            accessibilityLiveRegion="polite"
            style={[
              styles.box,
              {
                backgroundColor: theme.colour.accentWash,
                borderColor: theme.colour.accent,
                color: theme.colour.ink,
              },
            ]}
          >
            {say(message('changePassword.done'))}
          </Text>
        ) : null}
        <Pressable
          onPress={() => {
            setDone(false)
            setRefusal(null)
            setOpen(true)
          }}
          accessibilityRole="button"
          style={[card, styles.row]}
        >
          <KeyRound size={18} color={theme.colour.ink} strokeWidth={2} />
          <View style={styles.rowText}>
            <Text style={[styles.label, { color: theme.colour.ink }]}>
              {say(message('changePassword.open'))}
            </Text>
            <Text style={[styles.note, { color: theme.colour.inkMuted }]}>
              {say(message('changePassword.note'))}
            </Text>
          </View>
        </Pressable>
      </>
    )
  }

  return (
    <View style={card}>
      {refusal ? (
        <Text
          accessibilityRole="alert"
          style={[
            styles.box,
            {
              backgroundColor: theme.colour.dangerSurface,
              borderColor: theme.colour.danger,
              color: theme.colour.danger,
            },
          ]}
        >
          {say(refusal)}
        </Text>
      ) : null}
      <NewPasswordForm
        askCurrent
        onRefused={setRefusal}
        onSubmit={async (values) => {
          const outcome = await changePassword(supabase, values)
          if (outcome.ok) {
            setOpen(false)
            setDone(true)
          }
          return outcome
        }}
      />
      <AuthButton quiet label={message('common.cancel')} onPress={() => setOpen(false)} />
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    gap: SPACE.md,
    padding: SPACE.md,
    borderWidth: 1,
    borderRadius: RADIUS.md,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: SPACE.sm },
  rowText: { flex: 1, gap: 1 },
  label: { ...role(TYPE.body), fontWeight: '600' },
  note: { ...role(TYPE.note) },
  box: {
    ...role(TYPE.note),
    borderWidth: 1,
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
})
