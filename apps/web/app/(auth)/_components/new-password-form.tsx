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
 * A new password, typed twice — and, when changing one, the current one first.
 *
 * Takes its action rather than importing one, because it is drawn in two
 * places: at the end of a reset, and in settings, where a person who is signed
 * in changes theirs. The fields and their errors are the same both times; what
 * happens on submit is not, and only the change asks for the current password.
 */
export function NewPasswordForm({
  action: submit,
  askCurrent = false,
}: {
  action: NewPasswordAction
  askCurrent?: boolean
}) {
  const [state, action, pending] = useActionState(submit, INITIAL)
  const words = useSay()

  return (
    <form action={action} className={styles.form}>
      {state.formError ? (
        <p role="alert" className={styles.formError}>
          {words(state.formError)}
        </p>
      ) : null}

      {askCurrent ? (
        <p className={styles.field}>
          <label className={styles.label} htmlFor="currentPassword">
            {words(message('changePassword.current'))}
          </label>
          <input
            id="currentPassword"
            name="currentPassword"
            type="password"
            autoComplete="current-password"
            className={styles.input}
            required
            aria-invalid={state.fieldErrors?.currentPassword !== undefined}
            aria-describedby={
              state.fieldErrors?.currentPassword ? 'current-error' : undefined
            }
          />
          {state.fieldErrors?.currentPassword ? (
            <span id="current-error" className={styles.fieldError}>
              {words(state.fieldErrors.currentPassword)}
            </span>
          ) : null}
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
