import { redirectIfAuthenticated } from '@/lib/auth/guards'

import styles from '../auth.module.css'
import { SignupForm } from './signup-form'

/**
 * One of the two places an account can be created.
 *
 * This used to be the only one, on the reasoning that planning happens at a
 * laptop and the phone is for during the trip. That reasoning never covered the
 * person who installs the phone app without an account, so `apps/mobile` now has
 * this screen's counterpart.
 *
 * Neither of them owns anything. Both call `signUp` from `@pinpoint/auth`, which
 * validates against the shared schema, reports failures in one vocabulary, and
 * claims whatever membership was waiting for the address. What differs between
 * the two files is markup, which is the only thing the styling spec permits them
 * to differ in.
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
        {/* The same sentence the phone's sign-up screen shows, word for word.
            It has to work for both people who reach it: somebody invited must
            use the invited address or the trip will not be there, and somebody
            signing up cold should not be left hunting for an invitation they
            never got. */}
        <p className={styles.subtitle}>
          If you were invited, use the address the invitation went to — it is what
          links you to your trip.
        </p>
        <SignupForm />
      </div>
    </main>
  )
}
