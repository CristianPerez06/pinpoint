import { message } from '@pinpoint/wording'

import { redirectIfAuthenticated } from '@/lib/auth/guards'
import { serverSay } from '@/lib/language'

import styles from '../auth.module.css'
import { LoginForm } from './login-form'

export default async function LoginPage() {
  await redirectIfAuthenticated()
  const say = await serverSay()

  return (
    <main className={styles.screen}>
      <div className={styles.card}>
        <span className={styles.wordmark}>
          <span className={styles.dot} aria-hidden />
          {say(message('app.name'))}
        </span>
        <h1 className={styles.title}>{say(message('auth.signIn'))}</h1>
        <LoginForm />
      </div>
    </main>
  )
}
