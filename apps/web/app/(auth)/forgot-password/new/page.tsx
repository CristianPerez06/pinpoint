import { isResetSession } from '@pinpoint/auth'
import { message } from '@pinpoint/wording'
import Link from 'next/link'

import { setNewPasswordAction } from '@/app/_actions/auth'
import { serverSay } from '@/lib/language'
import { createClient } from '@/lib/supabase/server'

import styles from '../../auth.module.css'
import { AuthCard } from '../../_components/auth-card'
import { NewPasswordForm } from '../../_components/new-password-form'

/**
 * Choose the new password — only straight after entering a code.
 *
 * Checked here, on the server, before any form is sent: this screen changes a
 * password without asking for the current one, so a session from an ordinary
 * sign-in must not open it, and neither may no session at all. Both are told
 * the reset has to start again.
 */
export default async function NewPasswordPage() {
  const supabase = await createClient()
  const allowed = await isResetSession(supabase)
  const say = await serverSay()

  if (!allowed) {
    return (
      <AuthCard
        brand={say(message('app.name'))}
        title={say(message('reset.startAgainTitle'))}
        subtitle={say(message('reset.startAgainBody'))}
      >
        <Link href="/forgot-password" className={styles.submit}>
          {say(message('reset.startAgain'))}
        </Link>
      </AuthCard>
    )
  }

  return (
    <AuthCard brand={say(message('app.name'))} title={say(message('reset.newTitle'))}>
      <NewPasswordForm action={setNewPasswordAction} />
    </AuthCard>
  )
}
