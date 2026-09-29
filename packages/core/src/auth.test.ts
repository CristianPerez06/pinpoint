import { ENGLISH } from '@pinpoint/wording'
import { describe, expect, it } from 'vitest'

import {
  changePasswordSchema,
  MIN_PASSWORD_LENGTH,
  newPasswordSchema,
  RESET_CODE_LENGTH,
  resetCodeSchema,
  resetRequestSchema,
  signInSchema,
  signUpSchema,
} from './auth'

const fieldsWithErrors = (result: { error?: { issues: { path: PropertyKey[] }[] } }) =>
  new Set(result.error?.issues.map((issue) => String(issue.path[0])) ?? [])

describe('signUpSchema', () => {
  const VALID = {
    email: 'traveller@example.com',
    password: 'kyoto2026',
    confirmPassword: 'kyoto2026',
  }

  it('accepts a well-formed sign-up', () => {
    expect(signUpSchema.safeParse(VALID).success).toBe(true)
  })

  it.each([
    ['too short', 'kyot1'],
    ['no number', 'kyotokyoto'],
    ['no letter', '20262026'],
  ])('rejects a password that is %s', (_label, password) => {
    const result = signUpSchema.safeParse({
      ...VALID,
      password,
      confirmPassword: password,
    })
    expect(result.success).toBe(false)
    expect(fieldsWithErrors(result)).toContain('password')
  })

  it('reports a mismatch against the confirmation field', () => {
    const result = signUpSchema.safeParse({
      ...VALID,
      confirmPassword: 'kyoto2027',
    })
    expect(result.success).toBe(false)
    expect(fieldsWithErrors(result)).toContain('confirmPassword')
  })

  it('rejects an invalid email against the email field', () => {
    const result = signUpSchema.safeParse({ ...VALID, email: 'not-an-email' })
    expect(result.success).toBe(false)
    expect(fieldsWithErrors(result)).toContain('email')
  })
})

describe('signInSchema', () => {
  it('accepts any non-empty password', () => {
    // An account may predate a change to the password rules. Rejecting it here
    // would lock someone out of their own account with a validation message.
    const result = signInSchema.safeParse({
      email: 'traveller@example.com',
      password: 'short',
    })
    expect(result.success).toBe(true)
  })

  it('rejects an empty password', () => {
    const result = signInSchema.safeParse({
      email: 'traveller@example.com',
      password: '',
    })
    expect(result.success).toBe(false)
    expect(fieldsWithErrors(result)).toContain('password')
  })

  it('rejects an invalid email', () => {
    const result = signInSchema.safeParse({ email: 'nope', password: 'x' })
    expect(result.success).toBe(false)
    expect(fieldsWithErrors(result)).toContain('email')
  })
})

describe('the shortest password allowed', () => {
  /*
   * The rule and the sentence are in two files now, and nothing but this holds
   * them together. Raising `MIN_PASSWORD_LENGTH` without rewording
   * `password.tooShort` would refuse a nine-character password while telling
   * somebody eight was enough — a form that cannot be satisfied by doing what
   * it says.
   */
  it('is the number the refusal names', () => {
    expect(ENGLISH['password.tooShort']).toContain(String(MIN_PASSWORD_LENGTH))
  })
})

describe('newPasswordSchema', () => {
  it('refuses what sign-up refuses', () => {
    for (const password of ['kyot1', 'kyotokyoto', '20262026']) {
      const reset = newPasswordSchema.safeParse({ password, confirmPassword: password })
      const signUp = signUpSchema.safeParse({
        email: 'traveller@example.com',
        password,
        confirmPassword: password,
      })
      expect(reset.success).toBe(false)
      expect(signUp.success).toBe(false)
      expect(reset.error?.issues[0]?.message).toBe(signUp.error?.issues[0]?.message)
    }
  })

  it('reports a mismatch against the confirmation field', () => {
    const result = newPasswordSchema.safeParse({
      password: 'kyoto2026',
      confirmPassword: 'kyoto2027',
    })
    expect(result.success).toBe(false)
    expect(fieldsWithErrors(result)).toEqual(new Set(['confirmPassword']))
  })

  it('accepts a valid password typed twice', () => {
    expect(
      newPasswordSchema.safeParse({ password: 'kyoto2026', confirmPassword: 'kyoto2026' })
        .success,
    ).toBe(true)
  })
})

describe('resetCodeSchema', () => {
  const EMAIL = 'traveller@example.com'

  it('accepts six digits, ignoring spaces around them', () => {
    expect(resetCodeSchema.safeParse({ email: EMAIL, code: ' 123456 ' }).success).toBe(true)
  })

  it.each([
    ['too short', '12345'],
    ['too long', '1234567'],
    ['not digits', '12a456'],
  ])('refuses a code that is %s', (_label, code) => {
    const result = resetCodeSchema.safeParse({ email: EMAIL, code })
    expect(result.success).toBe(false)
    expect(fieldsWithErrors(result)).toContain('code')
  })

  it('is the length the refusal names', () => {
    expect(ENGLISH['code.invalidFormat']).toContain(String(RESET_CODE_LENGTH))
  })
})

describe('resetRequestSchema', () => {
  it('refuses something that is not an address', () => {
    const result = resetRequestSchema.safeParse({ email: 'nope' })
    expect(fieldsWithErrors(result)).toContain('email')
  })
})

describe('changePasswordSchema', () => {
  const VALID = {
    currentPassword: 'old',
    password: 'kyoto2026',
    confirmPassword: 'kyoto2026',
  }

  it('accepts any non-empty current password', () => {
    expect(changePasswordSchema.safeParse(VALID).success).toBe(true)
  })

  it('reports each failure against its own field', () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: '',
      password: 'short',
      confirmPassword: 'other',
    })
    expect(fieldsWithErrors(result)).toEqual(
      new Set(['currentPassword', 'password', 'confirmPassword']),
    )
  })

  it('reports a mismatch against the repeat', () => {
    const result = changePasswordSchema.safeParse({ ...VALID, confirmPassword: 'kyoto2027' })
    expect(fieldsWithErrors(result)).toEqual(new Set(['confirmPassword']))
  })
})
