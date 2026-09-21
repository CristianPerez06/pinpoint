import { describe, expect, it } from 'vitest'

import { CITY_NEEDS_A_NAME, cityNameTaken } from './city-wording'

describe('what a refused city says', () => {
  it('asks for a name', () => {
    expect(CITY_NEEDS_A_NAME).toBe('Give the city a name.')
  })

  /*
   * Quoted, and the quotation marks are the thing that drifted: the laptop had
   * them and the phone did not, for as long as both existed. Asserted here so
   * that one sentence answers this on both platforms.
   */
  it('names the city the trip already holds', () => {
    expect(cityNameTaken('Kyoto')).toBe('This trip already has a city called “Kyoto”.')
  })

  it('is a sentence, like every other refusal', () => {
    for (const said of [CITY_NEEDS_A_NAME, cityNameTaken('Kyoto')]) {
      expect(said).toMatch(/\.$/)
      expect(said[0]).toBe(said[0].toUpperCase())
    }
  })
})
