'use client'

import Link from 'next/link'
import { useActionState } from 'react'

import { type AuthFormState, signUpAction } from '@/app/_actions/auth'

const INITIAL: AuthFormState = {}

export function SignupForm() {
  const [state, action, pending] = useActionState(signUpAction, INITIAL)

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
          autoComplete="new-password"
          required
          aria-describedby={
            state.fieldErrors?.password ? 'password-error' : undefined
          }
        />
        {state.fieldErrors?.password ? (
          <span id="password-error">{state.fieldErrors.password}</span>
        ) : null}
      </p>

      <p>
        <label htmlFor="confirmPassword">Repeat password</label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          aria-describedby={
            state.fieldErrors?.confirmPassword ? 'confirm-error' : undefined
          }
        />
        {state.fieldErrors?.confirmPassword ? (
          <span id="confirm-error">{state.fieldErrors.confirmPassword}</span>
        ) : null}
      </p>

      <button type="submit" disabled={pending}>
        {pending ? 'Creating account…' : 'Create account'}
      </button>

      <p>
        Already have an account? <Link href="/login">Sign in</Link>
      </p>
    </form>
  )
}
