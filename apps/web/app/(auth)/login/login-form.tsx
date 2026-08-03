'use client'

import Link from 'next/link'
import { useActionState } from 'react'

import { type AuthFormState, signInAction } from '@/app/_actions/auth'

const INITIAL: AuthFormState = {}

export function LoginForm() {
  const [state, action, pending] = useActionState(signInAction, INITIAL)

  return (
    <form action={action}>
      {state.formError ? <p role="alert">{state.formError}</p> : null}

      <p>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          aria-describedby={state.fieldErrors?.email ? 'email-error' : undefined}
        />
        {state.fieldErrors?.email ? (
          <span id="email-error">{state.fieldErrors.email}</span>
        ) : null}
      </p>

      <p>
        <label htmlFor="password">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          aria-describedby={
            state.fieldErrors?.password ? 'password-error' : undefined
          }
        />
        {state.fieldErrors?.password ? (
          <span id="password-error">{state.fieldErrors.password}</span>
        ) : null}
      </p>

      <button type="submit" disabled={pending}>
        {pending ? 'Signing in…' : 'Sign in'}
      </button>

      <p>
        No account yet? <Link href="/signup">Create one</Link>
      </p>
    </form>
  )
}
