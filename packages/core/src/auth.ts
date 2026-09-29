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

/**
 * A new password, typed twice.
 *
 * Its own object because two screens set a password — sign-up and the reset —
 * and #49's change-while-signed-in will be a third. Sign-up is built from this
 * rather than beside it, so the rules and the wording cannot come apart between
 * them: the reset has to refuse exactly what account creation refuses.
 */
const newPasswordShape = {
  password,
  confirmPassword: z.string().min(1, refusal('password.repeatMissing')),
}

const passwordsMatch = {
  check: (value: { password: string; confirmPassword: string }) =>
    value.password === value.confirmPassword,
  params: { path: ['confirmPassword'], message: refusal('password.mismatch') },
}

export const newPasswordSchema = z
  .object(newPasswordShape)
  .refine(passwordsMatch.check, passwordsMatch.params)

export const signUpSchema = z
  .object({
    email: z.email(refusal('email.invalid')),
    ...newPasswordShape,
  })
  .refine(passwordsMatch.check, passwordsMatch.params)

/**
 * Changing the password while signed in: the current one, then the new one twice.
 *
 * The current password is checked for being present and nothing else. Whether
 * it is *right* is the authentication service's to say, and an account may
 * predate the rules the new one is held to — the reason sign-in does the same.
 */
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, refusal('password.currentMissing')),
    ...newPasswordShape,
  })
  .refine(passwordsMatch.check, passwordsMatch.params)

/**
 * How many digits the emailed reset code has.
 *
 * Has to equal the auth service's email OTP length: `otp_length` in
 * `supabase/config.toml` locally, and "Email OTP Length" in the hosted project's
 * dashboard, which does not read that file. A mismatch is a code the form refuses
 * as malformed. `code.invalidFormat` writes the number in, and `auth.test.ts`
 * holds the two together.
 */
export const RESET_CODE_LENGTH = 6

/**
 * How long "Send it again" stays unavailable after a code is sent.
 *
 * Matches the hosted project's minimum interval between two reset emails to one
 * address, which defaults to 60 seconds. Asking sooner would be refused by the
 * service anyway; waiting here means the person is told how long instead of
 * being refused. Locally `max_frequency` is 1s, so the wait is ours alone there.
 */
export const RESEND_CODE_AFTER_SECONDS = 60

export const resetRequestSchema = z.object({
  email: z.email(refusal('email.invalid')),
})

export const resetCodeSchema = z.object({
  email: z.email(refusal('email.invalid')),
  code: z
    .string()
    .trim()
    .regex(new RegExp(`^[0-9]{${RESET_CODE_LENGTH}}$`), refusal('code.invalidFormat')),
})

export type SignInInput = z.infer<typeof signInSchema>
export type SignUpInput = z.infer<typeof signUpSchema>
export type NewPasswordInput = z.infer<typeof newPasswordSchema>
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>
export type ResetRequestInput = z.infer<typeof resetRequestSchema>
export type ResetCodeInput = z.infer<typeof resetCodeSchema>
