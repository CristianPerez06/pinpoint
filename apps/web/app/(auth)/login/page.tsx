import { redirectIfAuthenticated } from '@/lib/auth/guards'

import { LoginForm } from './login-form'

export default async function LoginPage() {
  await redirectIfAuthenticated()

  return (
    <main>
      <h1>Sign in</h1>
      <LoginForm />
    </main>
  )
}
