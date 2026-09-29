'use client'

import { message } from '@pinpoint/wording'
import { useActionState } from 'react'

import type { AuthFormState } from '@/app/_actions/auth'
import { useSay } from '@/app/_components/language'

import styles from '../auth.module.css'

const INITIAL: AuthFormState = {}

type NewPasswordAction = (
  previous: AuthFormState,
  formData: FormData,
) => Promise<AuthFormState>

/**
 * A new password, typed twice.
 *
 * Takes its action rather than importing one, because it is going to be drawn
 * in two places: here, at the end of a reset, and in settings, where a person
 * who is signed in changes theirs (#49). The fields and their errors are the
 * same both times; what happens on submit is not.
 */
export function NewPasswordForm({ action: submit }: { action: NewPasswordAction }) {
  const [state, action, pending] = useActionState(submit, INITIAL)
  const words = useSay()

  return (
    <form action={action} className={styles.form}>
      {state.formError ? (
        <p role="alert" className={styles.formError}>
          {words(state.formError)}
        </p>
      ) : null}

      <p className={styles.field}>
        <label className={styles.label} htmlFor="password">
          {words(message('reset.newPassword'))}
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          className={styles.input}
          required
          aria-invalid={state.fieldErrors?.password !== undefined}
          aria-describedby={state.fieldErrors?.password ? 'password-error' : undefined}
        />
        {state.fieldErrors?.password ? (
          <span id="password-error" className={styles.fieldError}>
            {words(state.fieldErrors.password)}
          </span>
        ) : null}
      </p>

      <p className={styles.field}>
        <label className={styles.label} htmlFor="confirmPassword">
          {words(message('auth.repeatPassword'))}
        </label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          className={styles.input}
          required
          aria-invalid={state.fieldErrors?.confirmPassword !== undefined}
          aria-describedby={
            state.fieldErrors?.confirmPassword ? 'confirm-error' : undefined
          }
        />
        {state.fieldErrors?.confirmPassword ? (
          <span id="confirm-error" className={styles.fieldError}>
            {words(state.fieldErrors.confirmPassword)}
          </span>
        ) : null}
      </p>

      <button type="submit" disabled={pending} className={styles.submit}>
        {pending ? words(message('reset.saving')) : words(message('reset.save'))}
      </button>
    </form>
  )
}
