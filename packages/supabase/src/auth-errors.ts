import { message, type Message, type MessageKey } from '@pinpoint/wording'

/**
 * Authentication failures, named by us rather than by the service.
 *
 * Two rules hold this together:
 *
 *   - Control flow branches on the service's error *code*, never on its message
 *     text. Message text is not a contract and changes without warning.
 *   - Displayed text comes from the identifier below, never from the service.
 *     A raw message can leak whether an email address is registered, and reads
 *     like an internal error even when the cause is ordinary.
 *
 * An unrecognised code maps to `generic`. That is deliberate: a failure we have
 * not classified should say less, not more.
 */

/**
 * Every failure this maps to, as a list so it can be walked.
 *
 * A list rather than a bare union because `auth-errors.test.ts` checks that
 * each one resolves to something, and a union cannot be iterated. The type is
 * derived from it, so the two cannot come apart.
 */
export const AUTH_FAILURES = [
  'invalid-credentials',
  'email-taken',
  'weak-password',
  'email-not-confirmed',
  'rate-limited',
  'signup-disabled',
  'generic',
] as const

export type AuthFailure = (typeof AUTH_FAILURES)[number]

/** Supabase error code to our identifier. Unlisted codes fall through. */
const BY_CODE: Record<string, AuthFailure> = {
  invalid_credentials: 'invalid-credentials',
  user_already_exists: 'email-taken',
  email_exists: 'email-taken',
  weak_password: 'weak-password',
  email_not_confirmed: 'email-not-confirmed',
  over_request_rate_limit: 'rate-limited',
  over_email_send_rate_limit: 'rate-limited',
  signup_disabled: 'signup-disabled',
  email_provider_disabled: 'signup-disabled',
}

export const GENERIC_AUTH_FAILURE: AuthFailure = 'generic'

export interface CodedError {
  code?: string | null
}

export function authFailureOf(error: CodedError | null | undefined): AuthFailure {
  const code = error?.code
  return (code ? BY_CODE[code] : undefined) ?? GENERIC_AUTH_FAILURE
}

/**
 * What each failure is called, so an application can say it.
 *
 * This was already the right shape with one language in it: a record from a
 * code to the thing shown. What changes is that the value is a **name** now,
 * and the sentence sits in `@pinpoint/wording` beside every other sentence.
 *
 * `invalid-credentials` deliberately does not distinguish a wrong password from
 * an unregistered address — saying which would confirm to anyone asking that an
 * account exists. That is a property of the sentence behind the name, and the
 * comment lives here because this is where somebody would think to change it.
 */
const BY_FAILURE: Record<AuthFailure, MessageKey> = {
  'invalid-credentials': 'auth.invalidCredentials',
  'email-taken': 'auth.emailTaken',
  'weak-password': 'auth.weakPassword',
  'email-not-confirmed': 'auth.emailNotConfirmed',
  'rate-limited': 'auth.rateLimited',
  'signup-disabled': 'auth.signupDisabled',
  generic: 'auth.generic',
}

/** The failure, named as something to say. Resolved by whoever draws it. */
export function authFailureMessage(failure: AuthFailure): Message {
  return message(BY_FAILURE[failure])
}
