'use client'

import { ENGLISH_LANGUAGE, say, type Message } from '@pinpoint/wording'
import Link from 'next/link'
import { useActionState } from 'react'

import { type AuthFormState, signUpAction } from '@/app/_actions/auth'

import styles from '../auth.module.css'

const INITIAL: AuthFormState = {}

/** The action reports names; this is the screen, so this is where they become words. */
const words = (refusal: Message) => say(ENGLISH_LANGUAGE, refusal)

export function SignupForm() {
  const [state, action, pending] = useActionState(signUpAction, INITIAL)

  return (
    <form action={action} className={styles.form}>
      {state.formError ? (
        <p role="alert" className={styles.formError}>
          {words(state.formError)}
        </p>
      ) : null}

      <p className={styles.field}>
        <label className={styles.label} htmlFor="email">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          className={styles.input}
          required
          aria-describedby={state.fieldErrors?.email ? 'email-error' : undefined}
        />
        {state.fieldErrors?.email ? (
          <span id="email-error" className={styles.fieldError}>{words(state.fieldErrors.email)}</span>
        ) : null}
      </p>

      <p className={styles.field}>
        <label className={styles.label} htmlFor="password">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          className={styles.input}
          required
          aria-describedby={
            state.fieldErrors?.password ? 'password-error' : undefined
          }
        />
        {state.fieldErrors?.password ? (
          <span id="password-error" className={styles.fieldError}>{words(state.fieldErrors.password)}</span>
        ) : null}
      </p>

      <p className={styles.field}>
        <label className={styles.label} htmlFor="confirmPassword">Repeat password</label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          className={styles.input}
          required
          aria-describedby={
            state.fieldErrors?.confirmPassword ? 'confirm-error' : undefined
          }
        />
        {state.fieldErrors?.confirmPassword ? (
          <span id="confirm-error" className={styles.fieldError}>{words(state.fieldErrors.confirmPassword)}</span>
        ) : null}
      </p>

      <button type="submit" disabled={pending} className={styles.submit}>
        {pending ? 'Creating account…' : 'Create account'}
      </button>

      <p className={styles.alternative}>
        Already have an account? <Link href="/login">Sign in</Link>
      </p>
    </form>
  )
}
