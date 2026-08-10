import { signIn } from '@pinpoint/auth'
import { Redirect } from 'expo-router'
import { useState } from 'react'
import {
  ActivityIndicator,
  Button,
  Text,
  TextInput,
  View,
} from 'react-native'

import { useSession } from '@/lib/session'
import { supabase } from '@/lib/supabase'

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

  return (
    <View style={{ padding: 20, gap: 12 }}>
      <Text style={{ fontSize: 22, fontWeight: '600' }}>Sign in</Text>

      {formError ? <Text>{formError}</Text> : null}

      <View>
        <Text>Email</Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          style={{ borderWidth: 1, padding: 8 }}
        />
        {fieldErrors.email ? <Text>{fieldErrors.email}</Text> : null}
      </View>

      <View>
        <Text>Password</Text>
        <TextInput
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="current-password"
          style={{ borderWidth: 1, padding: 8 }}
        />
        {fieldErrors.password ? <Text>{fieldErrors.password}</Text> : null}
      </View>

      <Button
        title={submitting ? 'Signing in…' : 'Sign in'}
        onPress={submit}
        disabled={submitting}
      />

      <Text style={{ fontSize: 12, opacity: 0.6 }}>
        Accounts are created on the web app.
      </Text>
    </View>
  )
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      {children}
    </View>
  )
}
