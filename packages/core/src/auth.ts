import { z } from 'zod'
import { refusal } from './field-errors'

/**
 * Credential validation, shared by both apps.
 *
 * Defined once so that a password accepted on web is accepted on mobile. Each
 * app collects the input and renders the outcome; neither decides what counts
 * as valid.
 *
 * These schemas run before any network call. A rejected form never reaches the
 * authentication service.
 */

/**
 * Exported so a test can hold it against what `password.tooShort` says.
 *
 * The rule and the sentence used to be one expression — `.min(N, \`Use at
 * least ${N} characters.\`)` — so they could not disagree. A schema's message
 * slot carries a bare name now, which puts the number in the catalogue and out
 * of reach of this constant. `auth.test.ts` is what stops the two drifting.
 */
export const MIN_PASSWORD_LENGTH = 8

const password = z
  .string()
  .min(MIN_PASSWORD_LENGTH, refusal('password.tooShort'))
  .regex(/[A-Za-z]/, refusal('password.needsLetter'))
  .regex(/[0-9]/, refusal('password.needsNumber'))

export const signInSchema = z.object({
  email: z.email(refusal('email.invalid')),
  // Deliberately not the full password rules: an existing account may predate a
  // rule change, and rejecting it here would lock the person out of their own
  // account with a validation message instead of letting the service answer.
  password: z.string().min(1, refusal('password.missing')),
})

export const signUpSchema = z
  .object({
    email: z.email(refusal('email.invalid')),
    password,
    confirmPassword: z.string().min(1, refusal('password.repeatMissing')),
  })
  .refine((value) => value.password === value.confirmPassword, {
    path: ['confirmPassword'],
    message: refusal('password.mismatch'),
  })

export type SignInInput = z.infer<typeof signInSchema>
export type SignUpInput = z.infer<typeof signUpSchema>
