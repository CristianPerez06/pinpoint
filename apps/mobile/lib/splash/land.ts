import { LAND_HEIGHT, LAND_RUNS, LAND_WIDTH } from './land.generated'

/**
 * The continents mask, expanded: one byte per pixel, 1 for land, rows from the
 * north. See `scripts/build-splash-land.mjs` for where it comes from.
 */
export function landMask(): Uint8Array {
  const mask = new Uint8Array(LAND_WIDTH * LAND_HEIGHT)
  let at = 0
  let value = 0
  for (const run of LAND_RUNS.split(',')) {
    const length = parseInt(run, 36)
    if (value === 1) mask.fill(1, at, at + length)
    at += length
    value = 1 - value
  }
  return mask
}

/** Whether a point on Earth is land, read from the mask. */
export function isLand(mask: Uint8Array, lat: number, lon: number): boolean {
  const x = Math.min(LAND_WIDTH - 1, Math.floor(((lon + 180) / 360) * LAND_WIDTH))
  const y = Math.min(LAND_HEIGHT - 1, Math.floor(((90 - lat) / 180) * LAND_HEIGHT))
  return mask[y * LAND_WIDTH + x] === 1
}

/**
 * The mask as RGBA texture pixels: land in `colour`, sea fully transparent.
 *
 * Rows are written south first, because a texture's first row is the bottom of
 * the sphere and the mask's first row is the north.
 */
export function landPixels(mask: Uint8Array, colour: string): Uint8Array {
  const r = parseInt(colour.slice(1, 3), 16)
  const g = parseInt(colour.slice(3, 5), 16)
  const b = parseInt(colour.slice(5, 7), 16)
  const pixels = new Uint8Array(LAND_WIDTH * LAND_HEIGHT * 4)
  for (let row = 0; row < LAND_HEIGHT; row++) {
    const from = row * LAND_WIDTH
    const to = (LAND_HEIGHT - 1 - row) * LAND_WIDTH
    for (let x = 0; x < LAND_WIDTH; x++) {
      if (mask[from + x] !== 1) continue
      const i = (to + x) * 4
      pixels[i] = r
      pixels[i + 1] = g
      pixels[i + 2] = b
      pixels[i + 3] = 255
    }
  }
  return pixels
}

export { LAND_HEIGHT, LAND_WIDTH }
