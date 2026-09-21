import { describe, expect, it } from 'vitest'

import { newTripMemberSchema } from './trip-member'

const TRIP = '00000000-0000-4000-8000-000000000000'

describe('a refused invitation says what is wrong', () => {
  const complainAbout = (field: string, value: unknown) => {
    const parsed = newTripMemberSchema.safeParse({
      tripId: TRIP,
      displayName: 'Sam',
      email: 'sam@example.com',
      [field]: value,
    })
    return parsed.success
      ? undefined
      : parsed.error.issues.find((issue) => issue.path[0] === field)?.message
  }

  it('an address that is not one', () => {
    expect(complainAbout('email', 'sam at example')).toBe('Enter a valid email address.')
  })

  it('nobody to invite', () => {
    expect(complainAbout('displayName', '')).toBe('Enter the name to show on this trip.')
  })

  it('a name past its limit', () => {
    expect(complainAbout('displayName', 'x'.repeat(61))).toBe(
      'A name can be 60 characters at most.',
    )
  })
})
