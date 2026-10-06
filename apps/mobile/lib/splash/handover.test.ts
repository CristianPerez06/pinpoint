import { describe, expect, it } from 'vitest'

import { createHandover } from './handover'

describe('the handover between the first frame and the deadline', () => {
  it('has given up on nothing until the deadline passes', () => {
    expect(createHandover().abandoned).toBe(false)
  })

  it('draws, and then keeps drawing, once the first frame comes in time', () => {
    const handover = createHandover()
    expect(handover.draw()).toBe(true)
    expect(handover.draw()).toBe(true)
  })

  it('does not give up on a frame that has already been drawn', () => {
    const handover = createHandover()
    handover.draw()
    expect(handover.abandon()).toBe(false)
    expect(handover.abandoned).toBe(false)
    expect(handover.draw()).toBe(true)
  })

  it('draws nothing once the deadline has passed, on a context that is going away', () => {
    const handover = createHandover()
    expect(handover.abandon()).toBe(true)
    expect(handover.abandoned).toBe(true)
    expect(handover.draw()).toBe(false)
  })
})
