import { signInSchema, signUpSchema } from '@pinpoint/core'
import {
  authFailureMessage,
  authFailureOf,
  type PinpointClient,
} from '@pinpoint/supabase'
import {
  type AuthOutcome,
  type FieldErrors,
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

function fieldErrorsOf(issues: { path: PropertyKey[]; message: string }[]): FieldErrors {
  const errors: FieldErrors = {}
  for (const issue of issues) {
    const field = issue.path.length > 0 ? String(issue.path[0]) : '_'
    // First message per field wins: a field with three broken rules should say
    // one thing, not stack three.
    errors[field] ??= issue.message
  }
  return errors
}

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
    return rejected(failure, authFailureMessage(failure))
  }

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
    return rejected(failure, authFailureMessage(failure))
  }

  // With email confirmation enabled Supabase does not report a duplicate as an
  // error — that would confirm the address is registered to anyone who asked.
  // It returns a user with no identities instead. Confirmation is currently off,
  // so the error path above is the one that fires, but turning it on is a
  // dashboard toggle and this check is what stops that toggle from silently
  // turning a duplicate sign-up into an apparent success.
  if (data.user && data.user.identities?.length === 0) {
    return rejected('email-taken', authFailureMessage('email-taken'))
  }

  return succeeded
}

export async function signOut(client: PinpointClient): Promise<AuthOutcome> {
  const { error } = await client.auth.signOut()

  if (error) {
    const failure = authFailureOf(error)
    return rejected(failure, authFailureMessage(failure))
  }

  return succeeded
}

/**
 * Link the signed-in account to the member rows seeded for its email address.
 *
 * Called once after sign-up. The work happens in the database, because a
 * brand-new account is not yet a member of anything and so no membership policy
 * can reach the row it needs to claim.
 *
 * Returns how many memberships were claimed — zero is a legitimate answer,
 * meaning nobody has been invited at that address.
 */
export async function claimTripMemberships(
  client: PinpointClient,
): Promise<number> {
  const { data, error } = await client.rpc('claim_trip_memberships')
  if (error) return 0
  return typeof data === 'number' ? data : 0
}
