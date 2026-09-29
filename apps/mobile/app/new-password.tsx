import { isResetSession, setNewPassword } from '@pinpoint/auth'
import { message, type Message } from '@pinpoint/wording'
import { useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import { ActivityIndicator, View } from 'react-native'

import { AuthButton, AuthScreen } from '@/components/auth-screen'
import { NewPasswordForm } from '@/components/new-password-form'
import { useSession } from '@/lib/session'
import { supabase } from '@/lib/supabase'
import { useTheme } from '@/lib/theme'

/**
 * Choose the new password — only straight after entering a code.
 *
 * This screen changes a password without asking for the current one, so a
 * session from an ordinary sign-in must not open it, and neither may no session
 * at all. Both are told the reset has to start again.
 *
 * Deliberately no redirect on the session, either way: the session is what the
 * code produced, and saving ends it.
 */
export default function NewPasswordScreen() {
  const { session, loading } = useSession()
  const router = useRouter()
  const theme = useTheme()
  const [allowed, setAllowed] = useState<boolean | null>(null)
  const [formError, setFormError] = useState<Message | null>(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (loading || saved) return
    let live = true
    isResetSession(supabase).then((answer) => {
      if (live) setAllowed(answer)
    })
    return () => {
      live = false
    }
  }, [loading, session, saved])

  // Leave for sign-in only once the session is gone. Sign-in sends anybody with
  // a session into the app, and arriving while the provider still held the old
  // one would do exactly that.
  useEffect(() => {
    if (saved && !session) {
      router.replace({ pathname: '/login', params: { reset: 'done' } })
    }
  }, [saved, session, router])

  if (allowed === null) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: theme.colour.ground,
        }}
      >
        <ActivityIndicator />
      </View>
    )
  }

  if (!allowed) {
    return (
      <AuthScreen
        title={message('reset.startAgainTitle')}
        subtitle={message('reset.startAgainBody')}
      >
        <AuthButton
          label={message('reset.startAgain')}
          onPress={() => router.replace('/forgot-password')}
        />
      </AuthScreen>
    )
  }

  return (
    <AuthScreen title={message('reset.newTitle')} formError={formError}>
      <NewPasswordForm
        onRefused={setFormError}
        onSubmit={async (values) => {
          const outcome = await setNewPassword(supabase, values)
          if (outcome.ok) setSaved(true)
          return outcome
        }}
      />
    </AuthScreen>
  )
}
