'use client'

import Link from 'next/link'
import { useActionState } from 'react'

import { type AuthFormState, signInAction } from '@/app/_actions/auth'

import styles from '../auth.module.css'

const INITIAL: AuthFormState = {}

export function LoginForm() {
  const [state, action, pending] = useActionState(signInAction, INITIAL)

  return (
    <form action={action} className={styles.form}>
      {state.formError ? (
        <p role="alert" className={styles.formError}>
          {state.formError}
        </p>
      ) : null}

      <p className={styles.field}>
        <label htmlFor="email" className={styles.label}>
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className={styles.input}
          aria-invalid={state.fieldErrors?.email !== undefined}
          aria-describedby={state.fieldErrors?.email ? 'email-error' : undefined}
        />
        {state.fieldErrors?.email ? (
          <span id="email-error" className={styles.fieldError}>
            {state.fieldErrors.email}
          </span>
        ) : null}
      </p>

      <p className={styles.field}>
        <label htmlFor="password" className={styles.label}>
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className={styles.input}
          aria-invalid={state.fieldErrors?.password !== undefined}
          aria-describedby={
            state.fieldErrors?.password ? 'password-error' : undefined
          }
        />
        {state.fieldErrors?.password ? (
          <span id="password-error" className={styles.fieldError}>
            {state.fieldErrors.password}
          </span>
        ) : null}
      </p>

      <button type="submit" disabled={pending} className={styles.submit}>
        {pending ? 'Signing in…' : 'Sign in'}
      </button>

      <p className={styles.alternative}>
        No account yet? <Link href="/signup">Create one</Link>
      </p>
    </form>
  )
}
