import { signUp } from '@pinpoint/auth'
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
 * Create an account, from the phone.
 *
 * Deliberately the same card as `login.tsx`, copied rather than abstracted. The
 * two screens are meant to be recognisably one pair, and the shared part is a
 * card and three colours — extracting it would buy a component and cost the
 * ability to change either screen without reading the other.
 *
 * The fields are written out here rather than taken from `components/ui.tsx`,
 * which is not the same decision. `TextField` there takes no `secureTextEntry`
 * and no `autoComplete`, so two of these three could not use it, and teaching it
 * those props changes a component four other forms already render.
 *
 * Everything below the input handling is `@pinpoint/auth`: `signUp` validates
 * against the schema web validates against, reports failures in the same
 * vocabulary, and claims any membership already waiting for this address. None
 * of that is restated here, which is what makes this a second caller rather than
 * a second implementation.
 */
export default function SignupScreen() {
  const { session, loading } = useSession()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const theme = useTheme()
  const insets = useSafeAreaInsets()

  if (loading) return <Centered><ActivityIndicator /></Centered>
  // `!submitting` holds the redirect until `signUp` has fully resolved, claim
  // included — the same hold, for the same reason, as on the sign-in screen. The
  // auth listener sets the session the moment the account exists, so without this
  // the next screen mounts and queries trips while the claim is still in flight,
  // and somebody who was invited lands on "you are not on any trips yet" on the
  // one screen that was supposed to prove the invitation worked.
  if (session && !submitting) return <Redirect href="/" />

  async function submit() {
    setSubmitting(true)
    setFieldErrors({})
    setFormError(null)

    const outcome = await signUp(supabase, { email, password, confirmPassword })

    if (!outcome.ok) {
      if (outcome.kind === 'invalid-input') {
        setFieldErrors(outcome.fieldErrors)
      } else {
        setFormError(outcome.message)
      }
    }
    // On success the auth state listener swaps the tree; no navigation here.
    // An address that already has an account arrives as a form-level message
    // rather than a field error, and needs no branch of its own.

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

          <Text style={[styles.title, { color: theme.colour.ink }]}>
            Create an account
          </Text>

          {/* Written for both people who reach this screen. Somebody invited has
              to use the invited address or the trip will not be there; somebody
              signing up cold reads the conditional and moves on rather than
              hunting for an invitation they never got. */}
          <Text style={[styles.subtitle, { color: theme.colour.inkMuted }]}>
            If you were invited, use the address the invitation went to — it is what
            links you to your trip.
          </Text>

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
              autoComplete="new-password"
              placeholderTextColor={theme.colour.inkMuted}
              style={field}
            />
            {fieldErrors.password ? (
              <Text style={[styles.fieldError, { color: theme.colour.danger }]}>
                {fieldErrors.password}
              </Text>
            ) : null}
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: theme.colour.inkMuted }]}>
              Repeat password
            </Text>
            <TextInput
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              autoComplete="new-password"
              placeholderTextColor={theme.colour.inkMuted}
              style={field}
            />
            {fieldErrors.confirmPassword ? (
              <Text style={[styles.fieldError, { color: theme.colour.danger }]}>
                {fieldErrors.confirmPassword}
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
              {submitting ? 'Creating account…' : 'Create account'}
            </Text>
          </Pressable>

          {/* The only way back. `_layout.tsx` sets `headerShown: false`, so this
              screen has no system back control and dropping this line would strand
              anybody who reached it and changed their mind. The padding is the tap
              target: a line of `note` text is about 17pt tall on its own. */}
          <Link href="/login" style={styles.alternative}>
            <Text style={{ color: theme.colour.inkMuted }}>
              Already have an account?{' '}
            </Text>
            <Text style={[styles.alternativeAction, { color: theme.colour.accent }]}>
              Sign in
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
  // Left-aligned, unlike the link below it: this is an instruction being read,
  // not a closing note being glanced at.
  subtitle: { ...role(TYPE.body) },
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
