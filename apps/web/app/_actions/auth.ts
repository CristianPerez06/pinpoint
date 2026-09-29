'use server'

import {
  changePassword,
  requestPasswordReset,
  setNewPassword,
  signIn,
  signOut,
  signUp,
  verifyResetCode,
} from '@pinpoint/auth'
import { authFailureMessage } from '@pinpoint/supabase'
import { message, type Message } from '@pinpoint/wording'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'

/**
 * Server actions for the auth forms.
 *
 * Each one collects input and hands it to `@pinpoint/auth`. No validation, no
 * error interpretation, and no knowledge of what Supabase returns lives here —
 * that is all in the shared package, so mobile gets the same behaviour without
 * any of this being duplicated.
 *
 * Claiming trip memberships is not called here either. It happens inside
 * `signIn` and `signUp`, so that no application can authenticate without it.
 */

/**
 * What the form gets back, carried as names rather than sentences.
 *
 * These cross the server/client boundary, and a `Message` is a plain
 * `{ key, values? }` object, so it serialises like any other action result.
 * Resolving here would work too, and would be wrong: this runs on the server,
 * which is the one place that has no idea who is reading. The form resolves it
 * where it draws it, which is also where a language will be known.
 */
export interface AuthFormState {
  fieldErrors?: Record<string, Message>
  formError?: Message
  /** Something that worked and is worth saying, such as a code sent again. */
  notice?: Message
  /** Bumped each time a code is sent again, so the form can restart its wait. */
  sentAt?: number
}

const EMPTY: AuthFormState = {}

function stateFrom(outcome: Awaited<ReturnType<typeof signIn>>): AuthFormState {
  if (outcome.ok) return EMPTY
  return outcome.kind === 'invalid-input'
    ? { fieldErrors: outcome.fieldErrors }
    : { formError: authFailureMessage(outcome.failure) }
}

export async function signInAction(
  _previous: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const supabase = await createClient()
  const outcome = await signIn(supabase, {
    email: formData.get('email'),
    password: formData.get('password'),
  })

  if (!outcome.ok) return stateFrom(outcome)

  revalidatePath('/', 'layout')
  redirect('/')
}

export async function signUpAction(
  _previous: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const supabase = await createClient()
  const outcome = await signUp(supabase, {
    email: formData.get('email'),
    password: formData.get('password'),
    confirmPassword: formData.get('confirmPassword'),
  })

  if (!outcome.ok) return stateFrom(outcome)

  revalidatePath('/', 'layout')
  redirect('/')
}

export async function signOutAction(): Promise<void> {
  const supabase = await createClient()
  await signOut(supabase)

  revalidatePath('/', 'layout')
  redirect('/login')
}

/**
 * Resetting a forgotten password.
 *
 * Three steps, three actions, each ending in a redirect to the next screen. The
 * redirect is what moves the person on, rather than the form reacting to a
 * result: a verified code signs them in, and a screen that noticed a session
 * and sent them into the app would take them away from the one they need.
 */

export async function requestPasswordResetAction(
  _previous: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = formData.get('email')
  const supabase = await createClient()
  const outcome = await requestPasswordReset(supabase, { email })

  if (!outcome.ok) return stateFrom(outcome)

  // The same destination for every address, registered or not. The email
  // rides in the query string because it is what the next screen names and
  // what the code is checked against; it is what the person just typed.
  redirect(`/forgot-password/code?email=${encodeURIComponent(String(email))}`)
}

/** "Send it again", on the code screen. Stays on that screen. */
export async function resendResetCodeAction(
  _previous: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const supabase = await createClient()
  const outcome = await requestPasswordReset(supabase, { email: formData.get('email') })

  if (!outcome.ok) return stateFrom(outcome)
  return { notice: message('reset.sentAgain'), sentAt: Date.now() }
}

export async function verifyResetCodeAction(
  _previous: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const supabase = await createClient()
  const outcome = await verifyResetCode(supabase, {
    email: formData.get('email'),
    code: formData.get('code'),
  })

  if (!outcome.ok) return stateFrom(outcome)

  revalidatePath('/', 'layout')
  redirect('/forgot-password/new')
}

export async function setNewPasswordAction(
  _previous: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const supabase = await createClient()
  const outcome = await setNewPassword(supabase, {
    password: formData.get('password'),
    confirmPassword: formData.get('confirmPassword'),
  })

  if (!outcome.ok) return stateFrom(outcome)

  revalidatePath('/', 'layout')
  redirect('/login?reset=done')
}

/**
 * Change the password from settings.
 *
 * Stays on the screen rather than redirecting: the person is still signed in
 * here, and what they need is to be told it worked and that the other devices
 * were signed out.
 */
export async function changePasswordAction(
  _previous: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const supabase = await createClient()
  const outcome = await changePassword(supabase, {
    currentPassword: formData.get('currentPassword'),
    password: formData.get('password'),
    confirmPassword: formData.get('confirmPassword'),
  })

  if (!outcome.ok) return stateFrom(outcome)
  return { notice: message('changePassword.done') }
}
