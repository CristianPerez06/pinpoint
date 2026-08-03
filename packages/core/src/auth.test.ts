import { describe, expect, it } from 'vitest'

import { signInSchema, signUpSchema } from './auth'

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
