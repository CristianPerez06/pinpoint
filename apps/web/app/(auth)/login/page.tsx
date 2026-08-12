import { redirectIfAuthenticated } from '@/lib/auth/guards'

import styles from '../auth.module.css'
import { LoginForm } from './login-form'

export default async function LoginPage() {
  await redirectIfAuthenticated()

  return (
    <main className={styles.screen}>
      <div className={styles.card}>
        <span className={styles.wordmark}>
          <span className={styles.dot} aria-hidden />
          pinpoint
        </span>
        <h1 className={styles.title}>Sign in</h1>
        <LoginForm />
      </div>
    </main>
  )
}
