import { redirectIfAuthenticated } from '@/lib/auth/guards'

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
    <main>
      <h1>Create an account</h1>
      <p>
        Use the address you were invited at — it is what links you to your trip.
      </p>
      <SignupForm />
    </main>
  )
}
