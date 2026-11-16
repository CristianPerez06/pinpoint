import { describe, expect, it } from 'vitest'

import { BASEMAP_COLOUR, COLOUR, MARKER_FOREGROUND, MARKER_TYPE_COLOURS } from './colour'

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

const MODES = ['light', 'dark'] as const

/**
 * Text clears 4.5:1 on every surface it is drawn on (`styling`, *A token used
 * for text clears the text contrast floor*).
 *
 * Measured rather than trusted for the same reason as the edge above, and
 * written down when the palette moved from amber to purple: a whole palette
 * changing at once is exactly when a pairing that used to pass stops passing
 * and nobody looks at that one screen.
 */
describe('text on the surfaces it is drawn on', () => {
  const grounds = ['surface', 'ground', 'surfaceMuted', 'surfaceSunk'] as const
  const texts = ['ink', 'inkMuted', 'accentInk', 'danger'] as const
  const pairs: ReadonlyArray<readonly [string, string]> = [
    ...texts.flatMap((text) => grounds.map((on) => [text, on] as const)),
    ['accentInk', 'accentWash'],
    ['inkMuted', 'accentWash'],
    ['inkOnAccent', 'accent'],
    ['danger', 'dangerSurface'],
  ]

  it.each(MODES.flatMap((mode) => pairs.map(([text, on]) => [mode, text, on] as const)))(
    'on the %s ground, %s clears 4.5:1 on %s',
    (mode, text, on) => {
      const fg = COLOUR[text as keyof typeof COLOUR][mode]
      const bg = COLOUR[on as keyof typeof COLOUR][mode]
      expect(contrast(fg, bg)).toBeGreaterThanOrEqual(4.5)
    },
  )
})

/**
 * Every pin clears the 3:1 non-text floor against the land it stands on, and
 * its glyph clears it against the pin (`map-rendering`, *A visited marker is
 * drawn as visited*, which holds every type colour to that floor).
 *
 * The first gold proposed for `shopping` when it left violet measured 2.88:1 on
 * the light land — a value that looked right in a swatch and is the reason this
 * is a test.
 */
describe('marker type colours', () => {
  const types = Object.keys(MARKER_TYPE_COLOURS) as Array<keyof typeof MARKER_TYPE_COLOURS>

  it.each(MODES.flatMap((mode) => types.map((type) => [mode, type] as const)))(
    'on the %s ground, %s clears 3:1 against the land',
    (mode, type) => {
      expect(
        contrast(MARKER_TYPE_COLOURS[type][mode], BASEMAP_COLOUR.land[mode]),
      ).toBeGreaterThanOrEqual(3)
    },
  )

  it.each(MODES.flatMap((mode) => types.map((type) => [mode, type] as const)))(
    'on the %s ground, the glyph clears 3:1 on %s',
    (mode, type) => {
      expect(
        contrast(MARKER_FOREGROUND[mode], MARKER_TYPE_COLOURS[type][mode]),
      ).toBeGreaterThanOrEqual(3)
    },
  )
})
