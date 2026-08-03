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

export type AuthFailure =
  | 'invalid-credentials'
  | 'email-taken'
  | 'weak-password'
  | 'email-not-confirmed'
  | 'rate-limited'
  | 'signup-disabled'
  | 'generic'

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
 * The text shown for each failure.
 *
 * `invalid-credentials` deliberately does not distinguish a wrong password from
 * an unregistered address — saying which would confirm to anyone asking that an
 * account exists.
 */
export const AUTH_FAILURE_MESSAGES: Record<AuthFailure, string> = {
  'invalid-credentials': 'That email and password do not match an account.',
  'email-taken': 'There is already an account with that email address.',
  'weak-password': 'That password is too weak. Try a longer one.',
  'email-not-confirmed': 'That account has not been confirmed yet.',
  'rate-limited': 'Too many attempts. Wait a moment and try again.',
  'signup-disabled': 'New accounts are not being accepted right now.',
  generic: 'Something went wrong. Try again.',
}

export function authFailureMessage(failure: AuthFailure): string {
  return AUTH_FAILURE_MESSAGES[failure]
}
