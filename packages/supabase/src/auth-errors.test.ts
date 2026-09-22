import { ENGLISH_LANGUAGE, say } from '@pinpoint/wording'
import { describe, expect, it } from 'vitest'

import {
  AUTH_FAILURES,
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
  it('names something the catalogue can say, for every failure', () => {
    for (const failure of AUTH_FAILURES) {
      const said = say(ENGLISH_LANGUAGE, authFailureMessage(failure))
      expect(said.length, `${failure} resolves to nothing`).toBeGreaterThan(0)
    }
  })

  /*
   * Resolved before it is read, because what must not leak is the sentence.
   *
   * This package hands over a name now, and a name cannot reveal anything to
   * anybody — so asserting against the name would pass whatever the sentence
   * said. The check has to go one step further along than the code does.
   */
  it('does not reveal whether an account exists on a failed sign-in', () => {
    const said = say(
      ENGLISH_LANGUAGE,
      authFailureMessage(authFailureOf({ code: 'invalid_credentials' })),
    ).toLowerCase()
    expect(said).not.toContain('no account')
    expect(said).not.toContain('not registered')
    expect(said).not.toContain('wrong password')
  })
})
