import { message } from '@pinpoint/wording'

import { redirectIfAuthenticated } from '@/lib/auth/guards'
import { serverSay } from '@/lib/language'

import styles from '../auth.module.css'
import { LoginForm } from './login-form'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ reset?: string }>
}) {
  await redirectIfAuthenticated()
  const say = await serverSay()
  // Set by the end of a reset, which signs the person out and sends them here
  // to use the new password once.
  const { reset } = await searchParams

  return (
    <main className={styles.screen}>
      <div className={styles.card}>
        <span className={styles.wordmark}>
          <span className={styles.dot} aria-hidden />
          {say(message('app.name'))}
        </span>
        <h1 className={styles.title}>{say(message('auth.signIn'))}</h1>
        {reset === 'done' ? (
          <p role="status" className={styles.notice}>
            {say(message('auth.passwordUpdated'))}
          </p>
        ) : null}
        <LoginForm />
      </div>
    </main>
  )
}
