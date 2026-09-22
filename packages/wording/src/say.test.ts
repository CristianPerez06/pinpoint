import { describe, expect, it } from 'vitest'

import { ENGLISH } from './english'
import { ENGLISH_LANGUAGE, message, say, type MessageKey } from './say'

describe('say', () => {
  it('resolves a sentence that stands on its own', () => {
    expect(say(ENGLISH_LANGUAGE, message('place.saveFailed'))).toBe('Could not save this place.')
  })

  it('places a value into the sentence that has a gap for it', () => {
    expect(say(ENGLISH_LANGUAGE, message('city.nameTaken', { name: 'Kyoto Day 2' }))).toBe(
      'This trip already has a city called “Kyoto Day 2”.',
    )
  })

  it('places a value that is not the whole sentence', () => {
    expect(say(ENGLISH_LANGUAGE, message('member.takeBackQuestion', { name: 'Cristian' }))).toBe(
      "Take back Cristian's invitation?",
    )
  })

  /**
   * The values stay out of the sentence until the sentence is chosen.
   *
   * This is the property the whole shape exists for: a message carries the city
   * beside the name rather than joined into it, so that the language deciding
   * where the city goes in the sentence has not already been decided by whoever
   * reported the refusal.
   */
  it('carries its values rather than a finished sentence', () => {
    expect(message('city.nameTaken', { name: 'Osaka' })).toEqual({
      key: 'city.nameTaken',
      values: { name: 'Osaka' },
    })
  })

  it('refuses a name that does not exist, a missing value and a value with nowhere to go', () => {
    // @ts-expect-error no such name
    message('place.doesNotExist')
    // @ts-expect-error this sentence has a gap that has to be filled
    message('city.nameTaken')
    // @ts-expect-error this sentence has nowhere to put a value
    message('place.saveFailed', { name: 'Osaka' })
  })
})

/**
 * Every sentence, as a table.
 *
 * Nothing in a typecheck can tell whether the sentence now behind
 * `place.saveFailed` is the one `MARKER_SAVE_FAILED_MESSAGE` used to hold, and
 * the constant it came from is deleted in the same change. This is what makes
 * the move reviewable — a table in the diff rather than eighty deletions spread
 * across four packages — and what makes a later rewording show up as a reworded
 * line rather than as nothing at all.
 */
describe('the English catalogue', () => {
  it('says what it says', () => {
    const table = (Object.keys(ENGLISH) as MessageKey[])
      .map((key) => {
        const entry = ENGLISH[key]
        const text =
          typeof entry === 'string'
            ? entry
            : // Rendered with its gaps named, so the snapshot shows the shape of
              // the sentence rather than a sample of somebody's data.
              entry(
                new Proxy(
                  {},
                  { get: (_, name) => `{${String(name)}}` },
                ) as never,
              )
        return `${key}\n  ${text}`
      })
      .join('\n')

    expect(table).toMatchSnapshot()
  })

  it('has an entry for every marker type', () => {
    for (const id of [
      'place',
      'temple',
      'culture',
      'nature',
      'food',
      'shopping',
      'stay',
      'transport',
    ]) {
      expect(ENGLISH).toHaveProperty(`markerType.${id}`)
    }
  })
})
