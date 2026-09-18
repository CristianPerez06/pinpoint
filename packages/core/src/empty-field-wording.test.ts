import { describe, expect, it } from 'vitest'

import { EMPTY_FIELD_WORDING } from './empty-field-wording'

describe('EMPTY_FIELD_WORDING', () => {
  it('says what is missing, in the shape the day set', () => {
    expect(EMPTY_FIELD_WORDING).toEqual({
      day: 'No day yet',
      note: 'No note yet',
      link: 'No link yet',
    })
  })
})
