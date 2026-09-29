'use client'

import { RESEND_CODE_AFTER_SECONDS, RESET_CODE_LENGTH } from '@pinpoint/core'
import { message } from '@pinpoint/wording'
import Link from 'next/link'
import { useActionState, useEffect, useState } from 'react'

import {
  type AuthFormState,
  resendResetCodeAction,
  verifyResetCodeAction,
} from '@/app/_actions/auth'
import { useSay } from '@/app/_components/language'

import styles from '../../auth.module.css'

const INITIAL: AuthFormState = {}

/**
 * The code, and a way to have another sent.
 *
 * Two forms rather than one with two buttons, so each has its own pending
 * state: checking a code and sending a new one are different things to be
 * waiting for, and each button says which.
 */
export function CodeForm({ email }: { email: string }) {
  const [state, action, pending] = useActionState(verifyResetCodeAction, INITIAL)
  const [resent, resend, resending] = useActionState(resendResetCodeAction, INITIAL)
  const words = useSay()
  const wait = useWait(resent.sentAt)
  // Held here rather than left to the input, because a form action resets its
  // form when it finishes: a refused code would come back as an empty field,
  // and somebody who mistyped one digit would have to type all six again.
  const [code, setCode] = useState('')

  return (
    <>
      <form action={action} className={styles.form}>
        {state.formError ? (
          <p role="alert" className={styles.formError}>
            {words(state.formError)}
          </p>
        ) : null}

        <input type="hidden" name="email" value={email} />

        <p className={styles.field}>
          <label htmlFor="code" className={styles.label}>
            {words(message('reset.code'))}
          </label>
          <input
            id="code"
            name="code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={RESET_CODE_LENGTH}
            value={code}
            onChange={(event) => setCode(event.target.value)}
            required
            className={styles.input}
            aria-invalid={state.fieldErrors?.code !== undefined}
            aria-describedby={state.fieldErrors?.code ? 'code-error' : undefined}
          />
          {state.fieldErrors?.code ? (
            <span id="code-error" className={styles.fieldError}>
              {words(state.fieldErrors.code)}
            </span>
          ) : null}
        </p>

        <button type="submit" disabled={pending} className={styles.submit}>
          {pending ? words(message('reset.checkingCode')) : words(message('reset.checkCode'))}
        </button>
      </form>

      <form action={resend} className={styles.form}>
        {resent.formError ? (
          <p role="alert" className={styles.formError}>
            {words(resent.formError)}
          </p>
        ) : resent.notice ? (
          <p role="status" className={styles.notice}>
            {words(resent.notice)}
          </p>
        ) : null}
        <input type="hidden" name="email" value={email} />
        <button
          type="submit"
          disabled={resending || wait > 0}
          className={styles.secondary}
        >
          {resending
            ? words(message('reset.sendingCode'))
            : wait > 0
              ? words(message('reset.sendAgainIn', { seconds: wait }))
              : words(message('reset.sendAgain'))}
        </button>
      </form>

      <p className={styles.alternative}>
        <Link href="/login">{words(message('reset.backToSignIn'))}</Link>
      </p>
    </>
  )
}

/**
 * Seconds left before another code may be asked for.
 *
 * Counted from when the screen opened, since arriving here means a code was
 * just sent, and from `sentAt` once one has been sent again.
 */
function useWait(sentAt: number | undefined): number {
  const [openedAt] = useState(() => Date.now())
  const start = sentAt ?? openedAt
  const [now, setNow] = useState(start)

  useEffect(() => {
    const timer = setInterval(() => {
      const at = Date.now()
      setNow(at)
      if (secondsLeft(start, at) <= 0) clearInterval(timer)
    }, 1000)
    return () => clearInterval(timer)
  }, [start])

  return secondsLeft(start, Math.max(now, start))
}

function secondsLeft(start: number, now: number): number {
  return Math.max(0, RESEND_CODE_AFTER_SECONDS - Math.floor((now - start) / 1000))
}
