import { signIn } from '@pinpoint/auth'
import { RADIUS, SPACE, TYPE } from '@pinpoint/tokens'
import { Link, Redirect } from 'expo-router'
import { useState } from 'react'
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { useSession } from '@/lib/session'
import { supabase } from '@/lib/supabase'
import { useTheme } from '@/lib/theme'
import { fieldRole, role } from '@/lib/type'

/**
 * Sign in, with the way to create an account beside it.
 *
 * This screen used to end by saying accounts were made on the web app, and the
 * specification used to agree with it. Both were written on the premise that
 * planning happens at a laptop before a trip — which said nothing about the
 * person who installs this app without an account, and left them here reading
 * an instruction to go and find a computer. `signup.tsx` is the answer and the
 * link at the foot is how it is reached.
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
  const insets = useSafeAreaInsets()

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
    <KeyboardAvoidingView
      // Padding on both platforms, which is not what the sheets do — they pass
      // `undefined` on Android on the premise that `adjustResize` shrinks the
      // window and a second correction in JavaScript would double it. Measured
      // on an emulator, it does not: Expo enforces edge-to-edge from SDK 54, the
      // window keeps its full height, and with `undefined` this screen sat
      // centred in all 914dp of it with the submit button behind the keyboard.
      // `padding` is what actually reserves the space.
      behavior="padding"
      // Nothing but `flex: 1`. With `behavior="padding"` this view overwrites
      // any `paddingBottom` handed to it with 0 whenever the keyboard is down
      // (`AGENTS.md`), so the screen's own padding lives on the scrolled
      // content below and not here.
      style={[styles.screen, { backgroundColor: theme.colour.ground }]}
    >
      <ScrollView
        // `flexGrow: 1` with `justifyContent: 'center'` is what keeps the card
        // centred while it fits and lets it scroll when it does not. The card
        // is 380pt on sign-in and 530pt on sign-up; a keyboard leaves about
        // 400pt on a short phone, so sign-up cannot fit above one at any size
        // and centring alone would bury its submit button.
        contentContainerStyle={[
          styles.body,
          { paddingBottom: SPACE.lg + insets.bottom },
        ]}
        // Without this the first tap on the submit button only dismisses the
        // keyboard and the second one presses it.
        keyboardShouldPersistTaps="handled"
      >
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

          {/* The padding is the tap target, not decoration: a line of `note` text
              is about 17pt tall on its own, and there is no hover on this platform
              to reveal that the words are a control. The accent is what says so. */}
          <Link href="/signup" style={styles.alternative}>
            <Text style={{ color: theme.colour.inkMuted }}>No account yet? </Text>
            <Text style={[styles.alternativeAction, { color: theme.colour.accent }]}>
              Create one
            </Text>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  // The centring moved here from `screen` when the keyboard handling went in.
  // It has to sit on the scrolled content: a `ScrollView` centres what it holds
  // through its content container, and `flexGrow` is what makes that container
  // fill the screen when the card is short enough to be centred in it.
  body: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACE.lg,
  },
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
    ...fieldRole(TYPE.body),
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
  alternative: { ...role(TYPE.note), textAlign: 'center', paddingVertical: 14 },
  alternativeAction: { fontWeight: '600' },
})

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      {children}
    </View>
  )
}
