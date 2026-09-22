import type { FieldErrors } from '@pinpoint/core'
import type { AuthFailure } from '@pinpoint/supabase'

/**
 * What an authentication attempt produced.
 *
 * Three cases, kept apart because each is rendered differently: input the form
 * should mark up per field, a refusal from the service that belongs above the
 * form, and success.
 *
 * Returned rather than thrown. A wrong password is an ordinary outcome of
 * signing in, not an exceptional one, and modelling it as a throw pushes every
 * caller into a try/catch that has to re-derive which kind of failure it caught.
 */
export type AuthOutcome =
  | { ok: true }
  | { ok: false; kind: 'invalid-input'; fieldErrors: FieldErrors }
  | { ok: false; kind: 'rejected'; failure: AuthFailure }

/**
 * Re-exported rather than defined here. It moved into `@pinpoint/core` when
 * writing a marker turned out to reject input for the same reason signing in
 * does; keeping the name on this package's surface means no caller had to learn
 * that it moved.
 */
export type { FieldErrors }

export function invalidInput(fieldErrors: FieldErrors): AuthOutcome {
  return { ok: false, kind: 'invalid-input', fieldErrors }
}

/**
 * A refusal, carried as the failure and nothing else.
 *
 * It used to carry the sentence beside the code, so a caller could use either.
 * The sentence is gone: `authFailureMessage` turns the failure into a name
 * wherever somebody is about to draw it, and carrying a second representation
 * of the same fact is how the two come to disagree.
 */
export function rejected(failure: AuthFailure): AuthOutcome {
  return { ok: false, kind: 'rejected', failure }
}

export const succeeded: AuthOutcome = { ok: true }
