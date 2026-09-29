import {
  changePasswordSchema,
  fieldErrorsOf,
  newPasswordSchema,
  resetCodeSchema,
  resetRequestSchema,
  signInSchema,
  signUpSchema,
} from '@pinpoint/core'
import {
  authFailureOf,
  type PinpointClient,
} from '@pinpoint/supabase'
import { message } from '@pinpoint/wording'
import {
  type AuthOutcome,
  invalidInput,
  rejected,
  succeeded,
} from './outcome'

/**
 * The authentication operations, shared by web and mobile.
 *
 * Each takes an already-constructed client. That is the whole portability
 * trick: the web app passes its cookie-backed server client, the mobile app
 * passes its secure-storage-backed one, and nothing here has to know which is
 * which. Choosing where a session lives stays with the app that has to live
 * with the answer.
 */

/**
 * What this package needs from a schema, described structurally.
 *
 * Zod satisfies it, but it is not imported: keeping the dependency list to the
 * two workspace packages means a validation-library change is confined to
 * `@pinpoint/core`.
 */
interface Validatable<T> {
  safeParse(input: unknown):
    | { success: true; data: T }
    | { success: false; error: { issues: { path: PropertyKey[]; message: string }[] } }
}

function validate<T>(
  schema: Validatable<T>,
  input: unknown,
): { ok: true; data: T } | { ok: false; outcome: AuthOutcome } {
  const result = schema.safeParse(input)
  if (result.success) return { ok: true, data: result.data }
  return { ok: false, outcome: invalidInput(fieldErrorsOf(result.error.issues)) }
}

export async function signIn(
  client: PinpointClient,
  input: unknown,
): Promise<AuthOutcome> {
  const validated = validate(signInSchema, input)
  if (!validated.ok) return validated.outcome

  const { error } = await client.auth.signInWithPassword({
    email: validated.data.email,
    password: validated.data.password,
  })

  if (error) {
    const failure = authFailureOf(error)
    return rejected(failure)
  }

  // Claiming lives here rather than in each application, so that every
  // successful authentication claims because no path through authentication
  // skips it — not because two call sites remembered. Two call sites remembering
  // is the arrangement that produced the original defect.
  await claimTripMemberships(client)

  return succeeded
}

export async function signUp(
  client: PinpointClient,
  input: unknown,
): Promise<AuthOutcome> {
  const validated = validate(signUpSchema, input)
  if (!validated.ok) return validated.outcome

  const { data, error } = await client.auth.signUp({
    email: validated.data.email,
    password: validated.data.password,
  })

  if (error) {
    const failure = authFailureOf(error)
    return rejected(failure)
  }

  // With email confirmation enabled Supabase does not report a duplicate as an
  // error — that would confirm the address is registered to anyone who asked.
  // It returns a user with no identities instead. Confirmation is currently off,
  // so the error path above is the one that fires, but turning it on is a
  // dashboard toggle and this check is what stops that toggle from silently
  // turning a duplicate sign-up into an apparent success.
  if (data.user && data.user.identities?.length === 0) {
    return rejected('email-taken')
  }

  // Same reasoning as `signIn`. Email confirmation is off, so sign-up leaves the
  // person signed in and there is a session to claim under; if it is ever turned
  // on there will not be, and their first sign-in is what claims instead —
  // which is exactly why claiming cannot live only here.
  await claimTripMemberships(client)

  return succeeded
}

export async function signOut(client: PinpointClient): Promise<AuthOutcome> {
  const { error } = await client.auth.signOut()

  if (error) {
    const failure = authFailureOf(error)
    return rejected(failure)
  }

  return succeeded
}

/**
 * Send a reset code to an address.
 *
 * Succeeds for any well-formed address, registered or not: the service answers
 * the same for both, which is what lets the screens after this read the same for
 * both. An error that does come back — a rate limit, a mail failure — is about
 * the sending, never about the account, so it is surfaced like any other.
 *
 * No `redirectTo`. The email carries a code to type, not a link to open, so
 * there is nowhere to send anyone back to.
 */
export async function requestPasswordReset(
  client: PinpointClient,
  input: unknown,
): Promise<AuthOutcome> {
  const validated = validate(resetRequestSchema, input)
  if (!validated.ok) return validated.outcome

  const { error } = await client.auth.resetPasswordForEmail(validated.data.email)
  if (error) return rejected(authFailureOf(error))

  return succeeded
}

/**
 * Check a reset code, which signs the person in.
 *
 * A verified code establishes an ordinary session, so this is an authentication
 * like `signIn` and claims like one. Somebody invited while they were locked out
 * would otherwise see an empty trip list until their next password sign-in.
 */
export async function verifyResetCode(
  client: PinpointClient,
  input: unknown,
): Promise<AuthOutcome> {
  const validated = validate(resetCodeSchema, input)
  if (!validated.ok) return validated.outcome

  const { error } = await client.auth.verifyOtp({
    email: validated.data.email,
    token: validated.data.code,
    type: 'recovery',
  })
  if (error) return rejected(authFailureOf(error))

  await claimTripMemberships(client)

  return succeeded
}

/**
 * Save the new password, then end the session.
 *
 * Signing out afterwards is the product's choice, not the service's: the person
 * lands on sign-in and uses the new password once, which is the proof it was
 * saved. `signOut`'s default scope ends every session on the account, so a
 * device still signed in with the old password is signed out too.
 */
export async function setNewPassword(
  client: PinpointClient,
  input: unknown,
): Promise<AuthOutcome> {
  const validated = validate(newPasswordSchema, input)
  if (!validated.ok) return validated.outcome

  const { error } = await client.auth.updateUser({
    password: validated.data.password,
  })
  if (error) return rejected(authFailureOf(error))

  return signOut(client)
}

/**
 * Change the password of the signed-in account.
 *
 * The service would change it for any session without asking for the old one,
 * so the old one is checked first, by signing in with it: somebody holding an
 * unlocked phone must not be able to lock its owner out. A wrong one is a field
 * error on `currentPassword` rather than a form error, so the form says which of
 * its three fields was the problem.
 *
 * That check replaces this device's session with a fresh one, and the last step
 * ends every session *except* the current one — the old session here included,
 * which is exactly right. A failure of that last step is swallowed: the
 * password has changed by then, and saying it had not would be the bigger lie.
 *
 * Not `updateUser`'s own `current_password`: that only works behind a
 * project-wide setting, and a reset has no current password to give it.
 */
export async function changePassword(
  client: PinpointClient,
  input: unknown,
): Promise<AuthOutcome> {
  const validated = validate(changePasswordSchema, input)
  if (!validated.ok) return validated.outcome

  const { data: current, error: userError } = await client.auth.getUser()
  const email = current.user?.email
  if (userError || !email) return rejected(authFailureOf(userError))

  const { error: checkError } = await client.auth.signInWithPassword({
    email,
    password: validated.data.currentPassword,
  })
  if (checkError) {
    const failure = authFailureOf(checkError)
    return failure === 'invalid-credentials'
      ? invalidInput({ currentPassword: message('password.currentWrong') })
      : rejected(failure)
  }

  const { error } = await client.auth.updateUser({ password: validated.data.password })
  if (error) return rejected(authFailureOf(error))

  await client.auth.signOut({ scope: 'others' })

  return succeeded
}

/**
 * Whether the current session came from entering a reset code.
 *
 * The new-password screen changes a password without asking for the current
 * one, so a session from an ordinary sign-in must not open it. A verified code
 * records `otp` among the token's authentication methods; a password sign-in
 * records `password`. Nothing else in this product authenticates with `otp`.
 *
 * `getClaims` verifies the token rather than decoding whatever is stored, which
 * matters on the web, where the stored token arrived in a cookie.
 */
export async function isResetSession(client: PinpointClient): Promise<boolean> {
  const { data, error } = await client.auth.getClaims()
  if (error || !data) return false
  // An entry is an object on Supabase's tokens and a bare method name in the
  // plain JWT form (RFC 8176); the type allows both, so this reads both.
  return (data.claims.amr ?? []).some(
    (entry) => (typeof entry === 'string' ? entry : entry.method) === 'otp',
  )
}

/**
 * Link the signed-in account to the member rows seeded for its email address.
 *
 * Called after every successful authentication, not once after sign-up. That
 * was the original design and it left a hole with no way out: sign up on Monday,
 * get invited on Tuesday, and the invitation can never be claimed, because the
 * only code that claims runs at a moment that has already passed. The account
 * then sees an empty trip list forever and nothing in the product explains why.
 *
 * It happened. Both seeded members sat with `user_id` null while the map they
 * were members of rendered nothing.
 *
 * Running it on sign-in costs one round trip and is idempotent — the statement
 * only touches rows where `user_id` is null and the address matches the
 * verified one on the token, so a claimed membership is never re-claimed and
 * never stolen.
 *
 * The work happens in the database because an unclaimed account is not yet a
 * member of anything, so no membership policy can reach the row it needs. The
 * function is SECURITY DEFINER and matches on `auth.jwt() ->> 'email'` — the
 * address the identity provider verified, never one passed in. That is the whole
 * authorization, and it is why this takes no email argument.
 *
 * Called by `signIn` and `signUp` above, so no application has to call it to be
 * correct. Still exported, because claiming on demand remains a reasonable thing
 * to want.
 *
 * Returns how many memberships were claimed — zero is the ordinary answer,
 * meaning nothing was waiting. A failure is deliberately swallowed rather than
 * surfaced: a claim that could not run must not fail somebody's sign-in.
 */
export async function claimTripMemberships(
  client: PinpointClient,
): Promise<number> {
  const { data, error } = await client.rpc('claim_trip_memberships')
  if (error) return 0
  return typeof data === 'number' ? data : 0
}
