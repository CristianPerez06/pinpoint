import { ENGLISH_LANGUAGE, say, type Message } from '@pinpoint/wording'
import { describe, expect, it } from 'vitest'

import { EMPTY_FIELD_WORDING, UNFILED_CITY_WORDING } from './empty-field-wording'

/**
 * These assert the words, so they resolve a name to get at them.
 *
 * What is asserted below is wording — an apostrophe, the `yet` shape, a control
 * that says what it does — and that is still worth holding. It is one step
 * further along than it was: the function hands over a name, and the sentence
 * is what the catalogue has behind it.
 */
const words = (m: Message) => say(ENGLISH_LANGUAGE, m)

describe('EMPTY_FIELD_WORDING', () => {
  it('says what is missing, in the shape the day set', () => {
    expect({
      day: words(EMPTY_FIELD_WORDING.day),
      note: words(EMPTY_FIELD_WORDING.note),
      link: words(EMPTY_FIELD_WORDING.link),
      hours: words(EMPTY_FIELD_WORDING.hours),
    }).toEqual({
      day: 'No day yet',
      note: 'No note yet',
      link: 'No link yet',
      hours: 'No hours yet',
    })
  })
})

describe('UNFILED_CITY_WORDING', () => {
  it('is the word the form and the city control already use', () => {
    expect(words(UNFILED_CITY_WORDING)).toBe('Unassigned')
  })

  it('does not take the `No … yet` shape the other empty fields take', () => {
    // Being filed under no city is a state a place may rest in, not a value
    // waiting to be supplied. `yet` would say the opposite.
    expect(words(UNFILED_CITY_WORDING)).not.toMatch(/yet$/)
    expect(Object.values(EMPTY_FIELD_WORDING).map(words)).not.toContain(
      words(UNFILED_CITY_WORDING),
    )
  })
})
