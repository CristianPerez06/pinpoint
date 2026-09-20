import { describe, expect, it } from 'vitest'

import { EMPTY_FIELD_WORDING, UNFILED_CITY_WORDING } from './empty-field-wording'

describe('EMPTY_FIELD_WORDING', () => {
  it('says what is missing, in the shape the day set', () => {
    expect(EMPTY_FIELD_WORDING).toEqual({
      day: 'No day yet',
      note: 'No note yet',
      link: 'No link yet',
      hours: 'No hours yet',
    })
  })
})

describe('UNFILED_CITY_WORDING', () => {
  it('is the word the form and the city control already use', () => {
    expect(UNFILED_CITY_WORDING).toBe('Unassigned')
  })

  it('does not take the `No … yet` shape the other empty fields take', () => {
    // Being filed under no city is a state a place may rest in, not a value
    // waiting to be supplied. `yet` would say the opposite.
    expect(UNFILED_CITY_WORDING).not.toMatch(/yet$/)
    expect(Object.values(EMPTY_FIELD_WORDING)).not.toContain(UNFILED_CITY_WORDING)
  })
})
