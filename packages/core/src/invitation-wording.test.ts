import { describe, expect, it } from 'vitest'

import {
  TAKE_BACK_CONFIRM,
  TAKE_BACK_DECLINE,
  TAKE_BACK_LABEL,
  takeBackConsequence,
  takeBackQuestion,
} from './invitation-wording'

describe('takeBackQuestion', () => {
  it('names the person', () => {
    expect(takeBackQuestion('Cristian')).toBe("Take back Cristian's invitation?")
  })

  it('leaves a name ending in s alone', () => {
    // Deliberately not special-cased. `Lucas's` is correct in the style this
    // product writes in, and a rule that dropped the second s would have to
    // know whether the name is classical or plural, which it cannot.
    expect(takeBackQuestion('Lucas')).toBe("Take back Lucas's invitation?")
  })
})

describe('takeBackConsequence', () => {
  it('names the address and says it can be used again', () => {
    const said = takeBackConsequence('crisitan.ap84@gmail.com')
    expect(said).toMatch(/^crisitan\.ap84@gmail\.com comes off the trip\./)
    expect(said).toMatch(/invite that address again\.$/)
  })

  it('states no count', () => {
    // Removing a member who has joined would have to count what goes with
    // them. This one has nothing to count, and a number here would imply
    // there is a kind of loss that there is not.
    expect(takeBackConsequence('a@b.test')).not.toMatch(/\d/)
  })
})

describe('the controls', () => {
  it('say what they do rather than yes and no', () => {
    expect(TAKE_BACK_LABEL).toBe('Take back')
    expect(TAKE_BACK_CONFIRM).toBe('Take it back')
    expect(TAKE_BACK_DECLINE).toBe('Cancel')
    for (const label of [TAKE_BACK_LABEL, TAKE_BACK_CONFIRM, TAKE_BACK_DECLINE]) {
      expect(label).not.toMatch(/^(Yes|No|OK)$/)
    }
  })
})
