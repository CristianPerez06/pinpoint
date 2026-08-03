import { z } from 'zod'

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

const MIN_PASSWORD_LENGTH = 8

const password = z
  .string()
  .min(MIN_PASSWORD_LENGTH, `Use at least ${MIN_PASSWORD_LENGTH} characters.`)
  .regex(/[A-Za-z]/, 'Include at least one letter.')
  .regex(/[0-9]/, 'Include at least one number.')

export const signInSchema = z.object({
  email: z.email('Enter a valid email address.'),
  // Deliberately not the full password rules: an existing account may predate a
  // rule change, and rejecting it here would lock the person out of their own
  // account with a validation message instead of letting the service answer.
  password: z.string().min(1, 'Enter your password.'),
})

export const signUpSchema = z
  .object({
    email: z.email('Enter a valid email address.'),
    password,
    confirmPassword: z.string().min(1, 'Repeat your password.'),
  })
  .refine((value) => value.password === value.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Both passwords must match.',
  })

export type SignInInput = z.infer<typeof signInSchema>
export type SignUpInput = z.infer<typeof signUpSchema>
