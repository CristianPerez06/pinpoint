'use client'

import { message } from '@pinpoint/wording'
import Link from 'next/link'
import { useActionState } from 'react'

import { type AuthFormState, signUpAction } from '@/app/_actions/auth'
import { useSay } from '@/app/_components/language'

import styles from '../auth.module.css'

const INITIAL: AuthFormState = {}

export function SignupForm() {
  const [state, action, pending] = useActionState(signUpAction, INITIAL)
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
        <label className={styles.label} htmlFor="email">{words(message('auth.email'))}</label>
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
        <label className={styles.label} htmlFor="password">{words(message('auth.password'))}</label>
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
        <label className={styles.label} htmlFor="confirmPassword">{words(message('auth.repeatPassword'))}</label>
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
        {pending ? words(message('auth.creatingAccount')) : words(message('auth.createAccount'))}
      </button>

      <p className={styles.alternative}>
        {words(message('auth.haveAccount'))}{' '}
        <Link href="/login">{words(message('auth.signIn'))}</Link>
      </p>
    </form>
  )
}
