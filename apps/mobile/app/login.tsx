import { signIn } from '@pinpoint/auth'
import { RADIUS, SPACE, TYPE } from '@pinpoint/tokens'
import { Redirect } from 'expo-router'
import { useState } from 'react'
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'

import { useSession } from '@/lib/session'
import { supabase } from '@/lib/supabase'
import { useTheme } from '@/lib/theme'
import { role } from '@/lib/type'

/**
 * Sign in. There is deliberately no sign-up here.
 *
 * Accounts are created once, on a laptop, before the trip. The mobile app is
 * for during it.
 *
 * Everything below the input handling is `@pinpoint/auth`: the same validation
 * and the same failure vocabulary the web app uses. A password rejected here is
 * rejected there, without either app owning the rule.
 */
export default function LoginScreen() {
  const { session, loading } = useSession()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const theme = useTheme()

  if (loading) return <Centered><ActivityIndicator /></Centered>
  // `!submitting` holds the redirect until `signIn` has fully resolved, claim
  // included. The auth listener sets the session the moment the credentials are
  // accepted, so without this the next screen mounts and queries trips while the
  // claim is still in flight — and a first sign-in would land on "you are not on
  // any trips yet".
  if (session && !submitting) return <Redirect href="/" />

  async function submit() {
    setSubmitting(true)
    setFieldErrors({})
    setFormError(null)

    const outcome = await signIn(supabase, { email, password })

    if (!outcome.ok) {
      if (outcome.kind === 'invalid-input') {
        setFieldErrors(outcome.fieldErrors)
      } else {
        setFormError(outcome.message)
      }
    }
    // On success the auth state listener swaps the tree; no navigation here.
    // `signIn` has already claimed any membership waiting for this address.

    setSubmitting(false)
  }

  const field = [
    styles.input,
    { backgroundColor: theme.colour.surfaceMuted, color: theme.colour.ink },
  ]

  return (
    <View style={[styles.screen, { backgroundColor: theme.colour.ground }]}>
      <View
        style={[
          styles.card,
          { backgroundColor: theme.colour.surface, borderColor: theme.colour.line },
        ]}
      >
        <View style={styles.wordmark}>
          <View style={[styles.dot, { backgroundColor: theme.colour.accent }]} />
          <Text style={[styles.brand, { color: theme.colour.ink }]}>pinpoint</Text>
        </View>

        <Text style={[styles.title, { color: theme.colour.ink }]}>Sign in</Text>

        {formError ? (
          <Text
            style={[
              styles.formError,
              {
                backgroundColor: theme.colour.dangerSurface,
                borderColor: theme.colour.danger,
                color: theme.colour.danger,
              },
            ]}
          >
            {formError}
          </Text>
        ) : null}

        <View style={styles.field}>
          <Text style={[styles.label, { color: theme.colour.inkMuted }]}>Email</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            placeholderTextColor={theme.colour.inkMuted}
            style={field}
          />
          {fieldErrors.email ? (
            <Text style={[styles.fieldError, { color: theme.colour.danger }]}>
              {fieldErrors.email}
            </Text>
          ) : null}
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: theme.colour.inkMuted }]}>
            Password
          </Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="current-password"
            placeholderTextColor={theme.colour.inkMuted}
            style={field}
          />
          {fieldErrors.password ? (
            <Text style={[styles.fieldError, { color: theme.colour.danger }]}>
              {fieldErrors.password}
            </Text>
          ) : null}
        </View>

        <Pressable
          onPress={submit}
          disabled={submitting}
          accessibilityRole="button"
          style={[
            styles.submit,
            { backgroundColor: theme.colour.accent, opacity: submitting ? 0.55 : 1 },
          ]}
        >
          {/* Not white on amber: that clears about 1.7:1. `inkOnAccent` is the
              pair chosen against the accent on each ground. */}
          <Text style={[styles.submitText, { color: theme.colour.inkOnAccent }]}>
            {submitting ? 'Signing in…' : 'Sign in'}
          </Text>
        </Pressable>

        <Text style={[styles.footnote, { color: theme.colour.inkMuted }]}>
          Accounts are created on the web app.
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACE.lg },
  card: {
    width: '100%',
    maxWidth: 380,
    gap: SPACE.md,
    padding: SPACE.lg,
    borderWidth: 1,
    borderRadius: RADIUS.lg,
  },
  wordmark: { flexDirection: 'row', alignItems: 'center', gap: SPACE.sm },
  dot: { width: 10, height: 10, borderRadius: 5 },
  brand: { ...role(TYPE.title), fontWeight: '800', letterSpacing: -0.6 },
  title: { ...role(TYPE.display), fontSize: 28, lineHeight: 32 },
  field: { gap: 5 },
  label: { ...role(TYPE.label) },
  input: {
    ...role(TYPE.body),
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  fieldError: { ...role(TYPE.note), fontWeight: '600' },
  formError: {
    ...role(TYPE.note),
    borderWidth: 1,
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  submit: {
    borderRadius: RADIUS.pill,
    paddingVertical: 13,
    alignItems: 'center',
  },
  submitText: { ...role(TYPE.control), fontWeight: '600' },
  footnote: { ...role(TYPE.note), textAlign: 'center' },
})

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      {children}
    </View>
  )
}
