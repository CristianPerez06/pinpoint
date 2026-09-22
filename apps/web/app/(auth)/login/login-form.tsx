'use client'

import { message } from '@pinpoint/wording'
import Link from 'next/link'
import { useActionState } from 'react'

import { type AuthFormState, signInAction } from '@/app/_actions/auth'
import { useSay } from '@/app/_components/language'

import styles from '../auth.module.css'

const INITIAL: AuthFormState = {}

export function LoginForm() {
  const [state, action, pending] = useActionState(signInAction, INITIAL)
  // The action reports names; this is the screen, so this is where they become
  // words — in the language in force now, not the one the action ran in.
  const words = useSay()

  return (
    <form action={action} className={styles.form}>
      {state.formError ? (
        <p role="alert" className={styles.formError}>
          {words(state.formError)}
        </p>
      ) : null}

      <p className={styles.field}>
        <label htmlFor="email" className={styles.label}>
          {words(message('auth.email'))}
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
            {words(state.fieldErrors.email)}
          </span>
        ) : null}
      </p>

      <p className={styles.field}>
        <label htmlFor="password" className={styles.label}>
          {words(message('auth.password'))}
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
            {words(state.fieldErrors.password)}
          </span>
        ) : null}
      </p>

      <button type="submit" disabled={pending} className={styles.submit}>
        {pending ? words(message('auth.signingIn')) : words(message('auth.signIn'))}
      </button>

      <p className={styles.alternative}>
        {words(message('auth.noAccountYet'))}{' '}
        <Link href="/signup">{words(message('auth.createOne'))}</Link>
      </p>
    </form>
  )
}
