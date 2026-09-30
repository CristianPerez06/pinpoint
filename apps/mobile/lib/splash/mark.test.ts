import { describe, expect, it } from 'vitest'

import { measureMark } from './mark'

const mark = measureMark()

describe('the mark, measured', () => {
  it('finds the head where the arc puts it, not where it looks', () => {
    expect(mark.raw.headCentre[0]).toBeCloseTo(16, 2)
    expect(mark.raw.headCentre[1]).toBeCloseTo(17.47, 2)
    expect(mark.raw.headRadius).toBe(13)
  })

  it('is one unit tall from the tip to the top of the head', () => {
    const ys = mark.outline.map(([, y]) => y)
    expect(Math.min(...ys)).toBeCloseTo(0, 6)
    expect(Math.max(...ys)).toBeCloseTo(1, 3)
    expect(mark.raw.tip[1] - mark.raw.top).toBeCloseTo(36.53, 2)
  })

  it('keeps the hole at six thirteenths of the head', () => {
    expect(mark.hole.r / mark.head.r).toBeCloseTo(6 / 13, 6)
  })

  it('puts the tip on the axis', () => {
    expect(mark.hole.x).toBeCloseTo(0, 6)
    expect(mark.head.x).toBeCloseTo(0, 6)
  })
})
