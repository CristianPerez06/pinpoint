/**
 * The mark's globe, turning, as a sheet of frames.
 *
 * The map's waiting area shows the opening's globe drawn flat (`motion`, *The
 * map's waiting area shows the turning globe*). Neither application can draw it
 * at runtime — the laptop animates with CSS only and the phone has no canvas —
 * so it is drawn here, once, as a picture each application steps through like a
 * flip-book. It is cut by the icon tooling because it is an image of the mark,
 * and `check-icons.mjs` keeps it honest the same way.
 *
 * WHAT IS IN THE PICTURE AND WHAT IS NOT
 *
 * The sphere and the continents. Not the pin: each application draws the pin on
 * top from `MARKER_PATH` and `MARKER_HOLE`, so the mark keeps one definition and
 * the globe turns behind the hole.
 *
 * THE LAYOUT
 *
 * `FRAMES` frames of one full turn, in a grid of `COLUMNS` across, left to right
 * and then down. A single row would be 72 × 144 = 10,368 pixels wide, past the
 * 8,192-pixel texture limit some Android phones have, and the phone draws this
 * at 3× density.
 */

import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { TILE } from './icon-mark.mjs'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..')

export const FRAMES = 72
export const COLUMNS = 9
export const ROWS = FRAMES / COLUMNS
/** One frame's side, in pixels: 48 points at 3×. */
export const FRAME = 144

/**
 * The continents' colour, and why it is a literal.
 *
 * `MARK_LAND` from `@pinpoint/tokens`, copied for the reason `TILE` and `DROP`
 * are: this runs on bare `node`, outside any build. `check-icons.mjs` asserts it
 * still equals the token.
 */
export const LAND = '#B8741A'

/**
 * How far the view looks down on the globe: the opening's own tilt (`TILT` in
 * `apps/mobile/lib/splash/scene.ts`), so the two globes are seen from the same
 * place.
 */
const TILT = (22 * Math.PI) / 180

/** Where the turn starts: Europe and Africa facing, as in the approved mock. */
const START_LONGITUDE = (10 * Math.PI) / 180

/** The light, from the upper left and in front, as in the approved mock. */
const LIGHT = (() => {
  const l = [-0.45, 0.55, 0.7]
  const n = Math.hypot(...l)
  return l.map((x) => x / n)
})()

/**
 * The land mask the opening's globe wears, read out of the module that holds
 * it — Natural Earth 1:110m, public domain, run-length encoded by
 * `apps/mobile/scripts/build-splash-land.mjs`. Read rather than copied, so the
 * two globes cannot wear different continents; fails loudly rather than
 * drawing a globe of sea.
 */
export function landMask() {
  const source = readFileSync(join(ROOT, 'apps/mobile/lib/splash/land.generated.ts'), 'utf8')
  const width = Number(source.match(/export const LAND_WIDTH = (\d+)/)?.[1])
  const height = Number(source.match(/export const LAND_HEIGHT = (\d+)/)?.[1])
  const runs = source.match(/export const LAND_RUNS =\s*'([0-9a-z,]+)'/)?.[1]
  if (!width || !height || !runs) {
    throw new Error(
      'Could not read the land mask from apps/mobile/lib/splash/land.generated.ts. ' +
        'The globe is drawn from it; if it has moved or been reformatted, update this reader.',
    )
  }
  const mask = new Uint8Array(width * height)
  let at = 0
  let value = 0
  for (const run of runs.split(',')) {
    const length = parseInt(run, 36)
    if (value === 1) mask.fill(1, at, at + length)
    at += length
    value = 1 - value
  }
  if (at !== width * height) {
    throw new Error(`The land mask covers ${at} pixels, not ${width * height}.`)
  }
  return { width, height, mask }
}

const hexToRgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16))

/** Supersampling per axis: four samples a pixel softens the coastline at 48 points. */
const SS = 2

/**
 * Draw the sheet: `{ width, height, data }` in RGBA, ready for `encodePng`.
 *
 * Each pixel is a point on the front of a unit sphere, rotated by the tilt and
 * by the frame's turn, then looked up in the land mask by latitude and
 * longitude. The turn runs eastward, so the continents move left to right, as
 * the Earth does seen from the front.
 */
export function renderGlobe({ frame = FRAME, frames = FRAMES, columns = COLUMNS } = {}) {
  const { width: W, height: H, mask } = landMask()
  const rows = Math.ceil(frames / columns)
  const width = frame * columns
  const height = frame * rows
  const data = new Uint8ClampedArray(width * height * 4)
  const sphere = hexToRgb(TILE)
  const land = hexToRgb(LAND)
  const cosT = Math.cos(TILT)
  const sinT = Math.sin(TILT)

  for (let f = 0; f < frames; f++) {
    const turn = START_LONGITUDE - (2 * Math.PI * f) / frames
    const ox = (f % columns) * frame
    const oy = Math.floor(f / columns) * frame

    for (let y = 0; y < frame; y++) {
      for (let x = 0; x < frame; x++) {
        let r = 0
        let g = 0
        let b = 0
        let covered = 0
        for (let sy = 0; sy < SS; sy++) {
          for (let sx = 0; sx < SS; sx++) {
            const nx = ((x + (sx + 0.5) / SS) / frame) * 2 - 1
            const ny = 1 - ((y + (sy + 0.5) / SS) / frame) * 2
            const d = nx * nx + ny * ny
            if (d > 1) continue
            const nz = Math.sqrt(1 - d)
            const gy = ny * cosT + nz * sinT
            const gz = -ny * sinT + nz * cosT
            const lat = Math.asin(gy)
            let lon = Math.atan2(nx, gz) + turn
            lon = ((((lon + Math.PI) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)) - Math.PI
            const mx = Math.min(W - 1, Math.floor(((lon + Math.PI) / (2 * Math.PI)) * W))
            const my = Math.min(H - 1, Math.floor(((Math.PI / 2 - lat) / Math.PI) * H))
            const colour = mask[my * W + mx] === 1 ? land : sphere
            const lit = Math.max(0, nx * LIGHT[0] + ny * LIGHT[1] + nz * LIGHT[2])
            const shade = 0.8 + 0.28 * lit
            r += Math.min(255, colour[0] * shade)
            g += Math.min(255, colour[1] * shade)
            b += Math.min(255, colour[2] * shade)
            covered++
          }
        }
        if (covered === 0) continue
        const i = ((oy + y) * width + ox + x) * 4
        // Colour averaged over the covered samples, coverage as alpha: the
        // edge is antialiased against whatever the sheet is drawn on.
        data[i] = Math.round(r / covered)
        data[i + 1] = Math.round(g / covered)
        data[i + 2] = Math.round(b / covered)
        data[i + 3] = Math.round((covered / (SS * SS)) * 255)
      }
    }
  }

  return { width, height, data }
}
