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
  | { ok: false; kind: 'rejected'; failure: AuthFailure; message: string }

/** One message per offending field, keyed by field name. */
export type FieldErrors = Record<string, string>

export function invalidInput(fieldErrors: FieldErrors): AuthOutcome {
  return { ok: false, kind: 'invalid-input', fieldErrors }
}

export function rejected(failure: AuthFailure, message: string): AuthOutcome {
  return { ok: false, kind: 'rejected', failure, message }
}

export const succeeded: AuthOutcome = { ok: true }
