'use client'

import { message, type Message } from '@pinpoint/wording'
import { KeyRound } from 'lucide-react'
import { useState } from 'react'

import { NewPasswordForm } from '@/app/(auth)/_components/new-password-form'
import { type AuthFormState, changePasswordAction } from '@/app/_actions/auth'
import authStyles from '@/app/(auth)/auth.module.css'
import { useSay } from '@/app/_components/language'
import { config } from '@/lib/config'

import styles from './settings.module.css'

/**
 * "Change password", under the address in Account.
 *
 * Closed, it is one row saying what it does and what it costs: the other
 * devices are signed out. Open, it is the new-password form from the reset with
 * the current password asked for first. A change that works closes the form
 * and leaves the confirmation in its place.
 *
 * Not drawn at all where a forgotten password cannot be reset — see
 * `config.passwordChanges`.
 */
export function ChangePassword() {
  const say = useSay()
  const [open, setOpen] = useState(false)
  const [done, setDone] = useState<Message | null>(null)

  if (!config.passwordChanges) return null

  async function change(previous: AuthFormState, formData: FormData) {
    const state = await changePasswordAction(previous, formData)
    if (state.notice) {
      setDone(state.notice)
      setOpen(false)
    }
    return state
  }

  return (
    <>
      {done && !open ? (
        <p role="status" className={authStyles.notice}>
          {say(done)}
        </p>
      ) : null}

      {open ? (
        <div className={styles.row}>
          <NewPasswordForm action={change} askCurrent />
          <button
            type="button"
            className={authStyles.secondary}
            onClick={() => setOpen(false)}
          >
            {say(message('common.cancel'))}
          </button>
        </div>
      ) : (
        <button
          type="button"
          className={styles.option}
          onClick={() => {
            setDone(null)
            setOpen(true)
          }}
        >
          <KeyRound className={styles.optionGlyph} aria-hidden />
          <span className={styles.optionText}>
            <span className={styles.optionLabel}>{say(message('changePassword.open'))}</span>
            <span className={styles.optionNote}>{say(message('changePassword.note'))}</span>
          </span>
        </button>
      )}
    </>
  )
}
