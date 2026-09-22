import { ENGLISH_LANGUAGE, say, type Message } from '@pinpoint/wording'
import { describe, expect, it } from 'vitest'

import {
  TAKE_BACK_CONFIRM,
  TAKE_BACK_DECLINE,
  TAKE_BACK_LABEL,
  takeBackConsequence,
  takeBackQuestion,
} from './invitation-wording'

/**
 * These assert the words, so they resolve a name to get at them.
 *
 * What is asserted below is wording — an apostrophe, the `yet` shape, a control
 * that says what it does — and that is still worth holding. It is one step
 * further along than it was: the function hands over a name, and the sentence
 * is what the catalogue has behind it.
 */
const words = (m: Message) => say(ENGLISH_LANGUAGE, m)

describe('takeBackQuestion', () => {
  it('names the person', () => {
    expect(words(takeBackQuestion('Cristian'))).toBe("Take back Cristian's invitation?")
  })

  it('leaves a name ending in s alone', () => {
    // Deliberately not special-cased. `Lucas's` is correct in the style this
    // product writes in, and a rule that dropped the second s would have to
    // know whether the name is classical or plural, which it cannot.
    expect(words(takeBackQuestion('Lucas'))).toBe("Take back Lucas's invitation?")
  })
})

describe('takeBackConsequence', () => {
  it('names the address and says it can be used again', () => {
    const said = words(takeBackConsequence('crisitan.ap84@gmail.com'))
    expect(said).toMatch(/^crisitan\.ap84@gmail\.com comes off the trip\./)
    expect(said).toMatch(/invite that address again\.$/)
  })

  it('states no count', () => {
    // Removing a member who has joined would have to count what goes with
    // them. This one has nothing to count, and a number here would imply
    // there is a kind of loss that there is not.
    expect(words(takeBackConsequence('a@b.test'))).not.toMatch(/\d/)
  })
})

describe('the controls', () => {
  it('say what they do rather than yes and no', () => {
    expect(words(TAKE_BACK_LABEL)).toBe('Take back')
    expect(words(TAKE_BACK_CONFIRM)).toBe('Take it back')
    expect(words(TAKE_BACK_DECLINE)).toBe('Cancel')
    for (const label of [TAKE_BACK_LABEL, TAKE_BACK_CONFIRM, TAKE_BACK_DECLINE]) {
      expect(words(label)).not.toMatch(/^(Yes|No|OK)$/)
    }
  })
})
