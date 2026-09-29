'use client'

import { message } from '@pinpoint/wording'
import Link from 'next/link'
import { useActionState, useState } from 'react'

import { type AuthFormState, requestPasswordResetAction } from '@/app/_actions/auth'
import { useSay } from '@/app/_components/language'

import styles from '../auth.module.css'

const INITIAL: AuthFormState = {}

export function RequestForm() {
  const [state, action, pending] = useActionState(requestPasswordResetAction, INITIAL)
  const words = useSay()
  // Held here for the reason the code screen gives: a finished action resets
  // its form, which would empty the address the refusal is about.
  const [email, setEmail] = useState('')

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
          value={email}
          onChange={(event) => setEmail(event.target.value)}
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

      <button type="submit" disabled={pending} className={styles.submit}>
        {pending ? words(message('reset.sendingCode')) : words(message('reset.sendCode'))}
      </button>

      <p className={styles.alternative}>
        <Link href="/login">{words(message('reset.backToSignIn'))}</Link>
      </p>
    </form>
  )
}
