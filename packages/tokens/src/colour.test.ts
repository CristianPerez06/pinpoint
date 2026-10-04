import { describe, expect, it } from 'vitest'

import { COLOUR } from './colour'

/** WCAG 2.2 relative luminance of a `#RRGGBB` value. */
function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const channel = parseInt(hex.slice(i, i + 2), 16) / 255
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi! + 0.05) / (lo! + 0.05)
}

/**
 * A control's edge is measured rather than trusted.
 *
 * It sat at about 1.5:1 for as long as it existed, and nothing noticed, because
 * a faint edge looks deliberate (#124). These are the three grounds a control is
 * drawn on, on both themes.
 */
describe('lineStrong', () => {
  const grounds = ['surface', 'ground', 'surfaceMuted'] as const

  it.each(
    (['light', 'dark'] as const).flatMap((mode) => grounds.map((on) => [mode, on] as const)),
  )('clears 3:1 on the %s %s', (mode, on) => {
    expect(contrast(COLOUR.lineStrong[mode], COLOUR[on][mode])).toBeGreaterThanOrEqual(3)
  })
})
