'use server'

import { claimTripMemberships, signIn, signOut, signUp } from '@pinpoint/auth'
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
 */

export interface AuthFormState {
  fieldErrors?: Record<string, string>
  formError?: string
}

const EMPTY: AuthFormState = {}

function stateFrom(outcome: Awaited<ReturnType<typeof signIn>>): AuthFormState {
  if (outcome.ok) return EMPTY
  return outcome.kind === 'invalid-input'
    ? { fieldErrors: outcome.fieldErrors }
    : { formError: outcome.message }
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

  // Email confirmation is off, so sign-up leaves the person signed in. Claim
  // the member rows seeded for this address while that session exists — it is
  // what turns a bare account into somebody on a trip.
  //
  // Claiming nothing is not an error: it means nobody has been invited at this
  // address. That person sees an empty trip list, which is the correct answer.
  await claimTripMemberships(supabase)

  revalidatePath('/', 'layout')
  redirect('/')
}

export async function signOutAction(): Promise<void> {
  const supabase = await createClient()
  await signOut(supabase)

  revalidatePath('/', 'layout')
  redirect('/login')
}
