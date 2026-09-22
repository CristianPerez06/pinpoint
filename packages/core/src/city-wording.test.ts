import { ENGLISH_LANGUAGE, say } from '@pinpoint/wording'
import { describe, expect, it } from 'vitest'

import { CITY_NEEDS_A_NAME, cityNameTaken } from './city-wording'

/**
 * These now resolve a name before asserting anything, which is the point.
 *
 * What these functions hand over is a name; the sentence is a thing an
 * application draws. Resolving here is a test doing what a surface does, and it
 * is the only place under `packages/` that calls `say` — reaching for it in
 * anything but a test means a package has started deciding what language
 * somebody reads.
 */
const words = (message: Parameters<typeof say>[1]) => say(ENGLISH_LANGUAGE, message)

describe('what a refused city says', () => {
  it('asks for a name', () => {
    expect(words(CITY_NEEDS_A_NAME)).toBe('Give the city a name.')
  })

  /*
   * Quoted, and the quotation marks are the thing that drifted: the laptop had
   * them and the phone did not, for as long as both existed. Asserted here so
   * that one sentence answers this on both platforms.
   */
  it('names the city the trip already holds', () => {
    expect(words(cityNameTaken('Kyoto'))).toBe('This trip already has a city called “Kyoto”.')
  })

  /*
   * The name travels beside the sentence rather than inside it.
   *
   * This is what makes the sentence translatable at all: a language that puts
   * the city somewhere else in the sentence needs the city, not a finished
   * English clause with the city already in the middle of it.
   */
  it('carries the city as a value rather than joined in', () => {
    expect(cityNameTaken('Kyoto')).toEqual({
      key: 'city.nameTaken',
      values: { name: 'Kyoto' },
    })
  })

  it('is a sentence, like every other refusal', () => {
    for (const said of [words(CITY_NEEDS_A_NAME), words(cityNameTaken('Kyoto'))]) {
      expect(said).toMatch(/\.$/)
      expect(said[0]).toBe(said[0].toUpperCase())
    }
  })
})
