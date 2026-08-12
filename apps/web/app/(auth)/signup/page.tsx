import { redirectIfAuthenticated } from '@/lib/auth/guards'

import styles from '../auth.module.css'
import { SignupForm } from './signup-form'

/**
 * Account creation lives on web only.
 *
 * Planning happens at a laptop and the mobile app is for during the trip, so an
 * account is made once, here. The mobile app offers sign-in and nothing else.
 */
export default async function SignupPage() {
  await redirectIfAuthenticated()

  return (
    <main className={styles.screen}>
      <div className={styles.card}>
        <span className={styles.wordmark}>
          <span className={styles.dot} aria-hidden />
          pinpoint
        </span>
        <h1 className={styles.title}>Create an account</h1>
        <p className={styles.subtitle}>
          Use the address you were invited at — it is what links you to your trip.
        </p>
        <SignupForm />
      </div>
    </main>
  )
}
