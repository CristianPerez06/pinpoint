'use server'

import { signIn, signOut, signUp } from '@pinpoint/auth'
import { authFailureMessage } from '@pinpoint/supabase'
import type { Message } from '@pinpoint/wording'
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
