import { requestPasswordReset } from '@pinpoint/auth'
import type { FieldErrors } from '@pinpoint/core'
import { authFailureMessage } from '@pinpoint/supabase'
import { message, type Message } from '@pinpoint/wording'
import { Redirect, useRouter } from 'expo-router'
import { useState } from 'react'

import { AuthButton, AuthField, AuthLink, AuthScreen } from '@/components/auth-screen'
import { useSession } from '@/lib/session'
import { supabase } from '@/lib/supabase'

/**
 * Ask for a reset code.
 *
 * Every step of the reset replaces the one before rather than pushing onto it —
 * see the link on `login.tsx` for why that is not a matter of taste.
 */
export default function ForgotPasswordScreen() {
  const { session, loading } = useSession()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState<Message | null>(null)
  const [sending, setSending] = useState(false)

  if (!loading && session) return <Redirect href="/" />

  async function submit() {
    setSending(true)
    setFieldErrors({})
    setFormError(null)

    const outcome = await requestPasswordReset(supabase, { email })

    if (!outcome.ok) {
      if (outcome.kind === 'invalid-input') setFieldErrors(outcome.fieldErrors)
      else setFormError(authFailureMessage(outcome.failure))
      setSending(false)
      return
    }

    // The same next screen for every address, registered or not.
    router.replace({ pathname: '/reset-code', params: { email } })
  }

  return (
    <AuthScreen
      title={message('reset.title')}
      subtitle={message('reset.intro')}
      formError={formError}
    >
      <AuthField
        label={message('auth.email')}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        error={fieldErrors.email}
      />
      <AuthButton
        label={message('reset.sendCode')}
        busyLabel={message('reset.sendingCode')}
        busy={sending}
        onPress={submit}
      />
      <AuthLink label={message('reset.backToSignIn')} onPress={() => router.replace('/login')} />
    </AuthScreen>
  )
}
