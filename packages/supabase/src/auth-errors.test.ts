import { describe, expect, it } from 'vitest'

import {
  AUTH_FAILURE_MESSAGES,
  authFailureMessage,
  authFailureOf,
  GENERIC_AUTH_FAILURE,
} from './auth-errors'

describe('authFailureOf', () => {
  it('maps a known code to our identifier', () => {
    expect(authFailureOf({ code: 'invalid_credentials' })).toBe(
      'invalid-credentials',
    )
  })

  it('maps the two codes for a taken email to one identifier', () => {
    expect(authFailureOf({ code: 'user_already_exists' })).toBe('email-taken')
    expect(authFailureOf({ code: 'email_exists' })).toBe('email-taken')
  })

  it.each([
    ['an unknown code', { code: 'something_new' }],
    ['a missing code', {}],
    ['a null code', { code: null }],
    ['no error object', null],
    ['undefined', undefined],
  ])('falls back to generic for %s', (_label, error) => {
    expect(authFailureOf(error)).toBe(GENERIC_AUTH_FAILURE)
  })
})

describe('authFailureMessage', () => {
  it('has a message for every failure', () => {
    for (const [failure, message] of Object.entries(AUTH_FAILURE_MESSAGES)) {
      expect(message.length).toBeGreaterThan(0)
      expect(authFailureMessage(failure as keyof typeof AUTH_FAILURE_MESSAGES)).toBe(
        message,
      )
    }
  })

  it('does not reveal whether an account exists on a failed sign-in', () => {
    const message = authFailureMessage(authFailureOf({ code: 'invalid_credentials' }))
    expect(message.toLowerCase()).not.toContain('no account')
    expect(message.toLowerCase()).not.toContain('not registered')
    expect(message.toLowerCase()).not.toContain('wrong password')
  })
})
