import { requestPasswordReset, verifyResetCode } from '@pinpoint/auth'
import { RESEND_CODE_AFTER_SECONDS, RESET_CODE_LENGTH, type FieldErrors } from '@pinpoint/core'
import { authFailureMessage } from '@pinpoint/supabase'
import { message, type Message } from '@pinpoint/wording'
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router'
import { useEffect, useState } from 'react'

import { AuthButton, AuthField, AuthLink, AuthScreen } from '@/components/auth-screen'
import { useSession } from '@/lib/session'
import { supabase } from '@/lib/supabase'

/**
 * Enter the emailed code, or have another sent.
 *
 * A right code signs the person in, which is the one thing every other screen
 * here reacts to by leaving for the app. `verifying` is what holds this one:
 * it goes on at the press and stays on through success, so the session arriving
 * mid-check never redirects, and the only way out is the replace to the
 * new-password screen. The same hold sign-in uses, for a different reason.
 */
export default function ResetCodeScreen() {
  const { session, loading } = useSession()
  const router = useRouter()
  const { email = '' } = useLocalSearchParams<{ email?: string }>()
  const [code, setCode] = useState('')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState<Message | null>(null)
  const [notice, setNotice] = useState<Message | null>(null)
  const [verifying, setVerifying] = useState(false)
  const [resending, setResending] = useState(false)
  const [sentAt, setSentAt] = useState(() => Date.now())
  const wait = useWait(sentAt)

  if (!verifying && !loading && session) return <Redirect href="/" />
  // Nothing to check a code against: go back a step rather than draw a form
  // that cannot succeed.
  if (!email) return <Redirect href="/forgot-password" />

  async function submit() {
    setVerifying(true)
    setFieldErrors({})
    setFormError(null)
    setNotice(null)

    const outcome = await verifyResetCode(supabase, { email, code })

    if (!outcome.ok) {
      if (outcome.kind === 'invalid-input') setFieldErrors(outcome.fieldErrors)
      else setFormError(authFailureMessage(outcome.failure))
      setVerifying(false)
      return
    }

    router.replace('/new-password')
  }

  async function resend() {
    setResending(true)
    setFormError(null)
    setNotice(null)

    const outcome = await requestPasswordReset(supabase, { email })

    if (outcome.ok) {
      setNotice(message('reset.sentAgain'))
      setSentAt(Date.now())
    } else {
      setFormError(
        outcome.kind === 'rejected'
          ? authFailureMessage(outcome.failure)
          : message('auth.generic'),
      )
    }
    setResending(false)
  }

  return (
    <AuthScreen
      title={message('reset.codeTitle')}
      subtitle={message('reset.codeSent', { email })}
      formError={formError}
      notice={notice}
    >
      <AuthField
        label={message('reset.code')}
        value={code}
        onChangeText={setCode}
        keyboardType="number-pad"
        autoComplete="one-time-code"
        textContentType="oneTimeCode"
        maxLength={RESET_CODE_LENGTH}
        error={fieldErrors.code}
      />
      <AuthButton
        label={message('reset.checkCode')}
        busyLabel={message('reset.checkingCode')}
        busy={verifying}
        onPress={submit}
      />
      <AuthButton
        quiet
        label={
          wait > 0
            ? message('reset.sendAgainIn', { seconds: wait })
            : message('reset.sendAgain')
        }
        busyLabel={message('reset.sendingCode')}
        busy={resending}
        disabled={wait > 0 || verifying}
        onPress={resend}
      />
      <AuthLink label={message('reset.backToSignIn')} onPress={() => router.replace('/login')} />
    </AuthScreen>
  )
}

/**
 * Seconds left before another code may be asked for, counted from `sentAt`.
 *
 * Starts full when the screen opens, since arriving here means a code was just
 * sent.
 */
function useWait(sentAt: number): number {
  const [now, setNow] = useState(sentAt)

  useEffect(() => {
    const timer = setInterval(() => {
      const at = Date.now()
      setNow(at)
      if (secondsLeft(sentAt, at) <= 0) clearInterval(timer)
    }, 1000)
    return () => clearInterval(timer)
  }, [sentAt])

  return secondsLeft(sentAt, Math.max(now, sentAt))
}

function secondsLeft(sentAt: number, now: number): number {
  return Math.max(0, RESEND_CODE_AFTER_SECONDS - Math.floor((now - sentAt) / 1000))
}
