import { describe, expect, it } from 'vitest'

import { animationEnd, exitDuration, pose, SPLASH_TIMING } from './timeline'

describe('the opening, on the clock', () => {
  it('plays the full version in at most two and a half seconds, and leaves in at most three tenths', () => {
    expect(animationEnd('full')).toBeLessThanOrEqual(2500)
    expect(exitDuration('full')).toBeLessThanOrEqual(300)
  })

  it('plays the short version in at most seven tenths of a second before leaving', () => {
    expect(animationEnd('short')).toBeLessThanOrEqual(700)
  })

  it('fades out with reduce motion on in at most two tenths of a second', () => {
    expect(animationEnd('still')).toBe(0)
    expect(exitDuration('still')).toBeLessThanOrEqual(200)
  })
})

describe('the full version', () => {
  const f = SPLASH_TIMING.full
  const first = f.hold + f.grow
  const turn = f.spinAccel + f.spinSettle

  it('starts as the icon, still and flat', () => {
    expect(pose('full', 0)).toEqual({ grow: 0, spin: 0, sway: 0 })
    expect(pose('full', f.hold)).toEqual({ grow: 0, spin: 0, sway: 0 })
  })

  it('spins right, back to the start, then left as far as the first spin', () => {
    expect(pose('full', first + turn).spin).toBeCloseTo(f.spinDegrees, 0)
    expect(pose('full', first + 2 * turn).spin).toBeCloseTo(0, 0)
    expect(pose('full', first + 3 * turn).spin).toBeCloseTo(-f.spinDegrees, 0)
  })

  it('overshoots each stop and comes back', () => {
    const peak = Math.max(
      ...Array.from({ length: f.spinSettle }, (_, i) => pose('full', first + f.spinAccel + i).spin),
    )
    expect(peak).toBeGreaterThan(f.spinDegrees + 1)
    expect(Math.abs(pose('full', first + turn - 1).spin - f.spinDegrees)).toBeLessThan(0.5)
  })

  it('ends where the last spin stopped and holds there', () => {
    const end = animationEnd('full')
    expect(pose('full', end)).toEqual(pose('full', end + 5000))
  })
})

describe('the short version', () => {
  it('never spins', () => {
    for (let t = 0; t <= animationEnd('short'); t += 25) expect(pose('short', t).spin).toBe(0)
  })
})
