#!/usr/bin/env node
/**
 * The product's mark, rasterised.
 *
 * Every icon this repository ships is emitted from here: the favicon's three
 * sizes, the apple touch icon, the two manifest icons, and both mobile assets.
 * They were hand-cut before, with a tool that is not in the repository, in two
 * sittings — which is exactly how the web assets came out amber-tiled and the
 * mobile ones came out inverted, with nothing able to report the disagreement.
 *
 * WHY THIS RASTERISES ITSELF
 *
 * There is no rasteriser to call. `sharp` is off in `pnpm-workspace.yaml` by a
 * recorded decision, and rsvg, ImageMagick and Inkscape are system packages a
 * fresh checkout has no claim on. A hard dependency for eight files is the wrong
 * trade and a soft one that silently skips is worse than none — see
 * `check-fonts.mjs`, which reads a TrueType table by hand for the same reason.
 *
 * So this flattens the path to a polygon and fills it by scanline. That is
 * tractable because it renders one known shape rather than arbitrary SVG: two
 * cubics, one arc, one line, and a circle knocked out of it.
 */

import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import zlib from 'node:zlib'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..')

/**
 * The teardrop, read out of the token that defines it.
 *
 * `MARKER_PATH` in `packages/tokens/src/layout.ts` is the one definition the
 * applications draw. This script runs on bare `node` before and outside any
 * build, so it cannot import TypeScript — it reads the literal the same way the
 * colours are read from `colour.ts`, and for the same reason.
 *
 * A regex over source can be lossy, which is the objection `styling` raises to
 * recovering values by parsing. So it is written to fail loudly: no match
 * throws here rather than yielding a default that would cut a wrong icon and
 * pass a comparison against itself.
 */
export function markerPath() {
  const source = readFileSync(join(ROOT, 'packages/tokens/src/layout.ts'), 'utf8')
  const match = source.match(/export const MARKER_PATH\s*=\s*\n?\s*'([^']+)'/)
  if (!match) {
    throw new Error(
      'Could not read MARKER_PATH from packages/tokens/src/layout.ts. ' +
        'The mark is cut from that constant; if it has moved or been reformatted, ' +
        'update this reader rather than pasting the path back in here.',
    )
  }
  return match[1]
}

/**
 * The mark's two colours, and why they are literals.
 *
 * `accent.light` and `inkOnAccent.light` from `@pinpoint/tokens`. They are
 * copied rather than imported because this script runs before and outside any
 * build, and because the tokens package is TypeScript that a bare `node` cannot
 * load. `check-icons.mjs` asserts the two literals still equal the tokens.
 *
 * The light values on both surfaces, on purpose. An icon is not a themed
 * surface: it is fetched outside any document, a host may never consult a
 * colour-scheme query for it, and the tile is a fill the mark brings with it
 * rather than a ground the theme supplies. One asset serves both appearances.
 */
export const TILE = '#E39A2B'
export const DROP = '#241703'

/** The box the applications draw the pin in. */
export const BOX = { width: 32, height: 42 }

/**
 * The head, knocked out of the drop rather than drawn over it.
 *
 * `icon.svg` expresses this as a second subpath under `fill-rule="evenodd"`, so
 * the pin stays one path and the hole cannot land a half-pixel off the fill at
 * 16px. Same reasoning here, same numbers: radius 6 at (16, 15), inside the
 * head circle of radius 13 at the same centre.
 */
export const HOLE = { cx: 16, cy: 15, r: 6 }

/**
 * Flatten the pin's outline to a polygon.
 *
 * The path is read from `MARKER_PATH` and parsed rather than transcribed: the
 * point at the bottom, a cubic up the left flank, a large-arc sweep over the
 * top, and a cubic back down. Writing those segments out here as numbers was
 * how this file came to hold a fourth copy of the shape, which is the thing the
 * token exists to prevent.
 *
 * The parser handles only the commands this path uses, and throws on anything
 * else rather than approximating it.
 *
 * `steps` is per segment. 256 puts the flattening error far below a pixel at
 * 1024, where the head's radius is about 300px: the chord of a 1/256 turn on a
 * 300px circle deviates from the arc by under 0.02px.
 */
export function outline(steps = 256, path = markerPath()) {
  const points = []
  let cursor = [0, 0]

  const cubic = (p0, c0, c1, p1) => {
    for (let i = 1; i <= steps; i++) {
      const t = i / steps
      const u = 1 - t
      points.push([
        u * u * u * p0[0] + 3 * u * u * t * c0[0] + 3 * u * t * t * c1[0] + t * t * t * p1[0],
        u * u * u * p0[1] + 3 * u * u * t * c0[1] + 3 * u * t * t * c1[1] + t * t * t * p1[1],
      ])
    }
  }

  for (const [command, a] of commands(path)) {
    if (command === 'M') {
      cursor = [a[0], a[1]]
      points.push(cursor)
    } else if (command === 'C') {
      const to = [a[4], a[5]]
      cubic(cursor, [a[0], a[1]], [a[2], a[3]], to)
      cursor = to
    } else if (command === 'A') {
      arc(points, cursor, a, steps)
      cursor = [a[5], a[6]]
    } else if (command === 'Z') {
      // The path closes on the point it opened at, which is already plotted.
    } else {
      throw new Error(
        `MARKER_PATH uses the "${command}" command, which this rasteriser does not ` +
          `implement. Add it rather than approximating the shape.`,
      )
    }
  }

  return points
}

/** Split a path into `[command, numbers]` pairs. Absolute commands only. */
function commands(path) {
  const out = []
  for (const [, letter, rest] of path.matchAll(/([A-Za-z])([^A-Za-z]*)/g)) {
    if (letter !== letter.toUpperCase()) {
      throw new Error(`MARKER_PATH uses the relative command "${letter}"; only absolute are read.`)
    }
    const numbers = (rest.match(/-?\d*\.?\d+/g) ?? []).map(Number)
    out.push([letter, numbers])
  }
  return out
}

/**
 * An elliptical arc, with its centre derived rather than assumed.
 *
 * This is the part it is easy to get wrong, and the pin's own comment got it
 * wrong for a long time: it described "a circle of radius 13 centred at
 * (16, 15)", and the endpoints the path gives are 14.47 from that point. They
 * cannot be on it.
 *
 * SVG does not take a centre. It takes two endpoints, two radii and two flags
 * and computes one — so the head's real centre is (16, 17.47), and the drop's
 * top is at y 4.47 rather than y 2. That is a 6% difference in the mark's
 * height, and it is why the icons measure 1.405 tall per unit wide where the
 * described geometry would give 1.5.
 *
 * This is the endpoint-to-centre conversion from the SVG specification's
 * implementation notes, restricted to equal radii and no rotation — which is
 * everything this path uses, and anything else throws rather than being
 * quietly approximated.
 */
function arc(points, from, a, steps) {
  const [rx, ry, rotation, largeArc, sweepFlag, x, y] = a
  if (rx !== ry || rotation !== 0) {
    throw new Error('MARKER_PATH has an arc with unequal radii or a rotation; not implemented.')
  }

  const r = rx
  const midX = (from[0] + x) / 2
  const midY = (from[1] + y) / 2
  const half = Math.hypot(x - from[0], y - from[1]) / 2
  // Perpendicular offset from the chord's midpoint to the centre. Clamped at
  // zero because a radius too small for the chord is scaled up by SVG rather
  // than being an error.
  const offset = Math.sqrt(Math.max(0, r * r - half * half))
  const ux = (x - from[0]) / (half * 2)
  const uy = (y - from[1]) / (half * 2)
  // Which of the two candidate centres: the flags disagreeing picks one side.
  const side = largeArc === sweepFlag ? -1 : 1
  const cx = midX + side * offset * -uy
  const cy = midY + side * offset * ux

  const a0 = Math.atan2(from[1] - cy, from[0] - cx)
  const a1 = Math.atan2(y - cy, x - cx)
  let span = a1 - a0
  if (sweepFlag) {
    while (span <= 0) span += Math.PI * 2
  } else {
    while (span >= 0) span -= Math.PI * 2
  }

  for (let i = 1; i <= steps; i++) {
    const angle = a0 + (span * i) / steps
    points.push([cx + r * Math.cos(angle), cy + r * Math.sin(angle)])
  }
}

/** The hole, as a polygon, so one fill rule covers both subpaths. */
export function holeOutline(steps = 256) {
  const points = []
  for (let i = 0; i < steps; i++) {
    const a = (Math.PI * 2 * i) / steps
    points.push([HOLE.cx + HOLE.r * Math.cos(a), HOLE.cy + HOLE.r * Math.sin(a)])
  }
  return points
}

/**
 * Coverage of the shape, by scanline.
 *
 * Sampled vertically and exact horizontally: each pixel row is cut into `SS`
 * sub-scanlines, every edge of every polygon is intersected with each one, and
 * the crossings are paired off even-odd into spans that are added to a coverage
 * accumulator with fractional ends.
 *
 * The obvious implementation — sample a grid of points per pixel and ask each
 * whether it is inside — is the same picture and does not finish: at 1024
 * square with 16 samples and a flattened outline of a thousand edges it is
 * billions of edge tests. Doing the crossings once per sub-scanline instead of
 * once per sample is what makes this a fraction of a second.
 *
 * Even-odd rather than nonzero because that is what `icon.svg` declares, and
 * because it is what makes the hole a hole: a span inside both the outline and
 * the head circle has crossed two edges and is outside the fill.
 */
const SS = 4

function coverageMap(polygons, size) {
  const coverage = new Float64Array(size * size)

  const edges = []
  for (const poly of polygons) {
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const [x0, y0] = poly[j]
      const [x1, y1] = poly[i]
      if (y0 !== y1) edges.push([x0, y0, x1, y1])
    }
  }

  const crossings = []
  for (let row = 0; row < size; row++) {
    for (let sub = 0; sub < SS; sub++) {
      const y = row + (sub + 0.5) / SS
      crossings.length = 0
      for (const [x0, y0, x1, y1] of edges) {
        if (y0 > y !== y1 > y) crossings.push(x0 + ((y - y0) * (x1 - x0)) / (y1 - y0))
      }
      if (crossings.length < 2) continue
      crossings.sort((a, b) => a - b)

      for (let k = 0; k + 1 < crossings.length; k += 2) {
        addSpan(coverage, row * size, crossings[k], crossings[k + 1], size, 1 / SS)
      }
    }
  }

  return coverage
}

/** Add a horizontal span's coverage to one row, with fractional ends. */
function addSpan(coverage, rowOffset, xa, xb, size, weight) {
  const left = Math.max(xa, 0)
  const right = Math.min(xb, size)
  if (right <= left) return

  const first = Math.floor(left)
  const last = Math.min(Math.ceil(right) - 1, size - 1)

  if (first === last) {
    coverage[rowOffset + first] += (right - left) * weight
    return
  }
  coverage[rowOffset + first] += (first + 1 - left) * weight
  for (let x = first + 1; x < last; x++) coverage[rowOffset + x] += weight
  coverage[rowOffset + last] += (right - last) * weight
}

/**
 * Render the mark into an RGBA buffer.
 *
 * `size` is the canvas in pixels. `dropWidth` is the drop's width as a fraction
 * of that canvas — the number the specification states per canvas contract. The
 * drop's bounding box is centred on the canvas centre, which matters on a
 * cropping host: a drop centred by eye puts the tip nearer the mask than the
 * head, and the tip is the part carrying the pin's meaning.
 *
 * `tile` of `null` leaves the ground transparent, which is what an Android
 * adaptive foreground wants — the layer is drawn over a background colour the
 * manifest names, so painting a tile into it would hide that colour and defeat
 * the two-layer construction the format exists for.
 */
export function render({ size, dropWidth, tile, drop = DROP, radius = 0 }) {
  const px = Buffer.alloc(size * size * 4)

  const box = pathBounds()
  const scale = (dropWidth * size) / box.width
  const originX = (size - box.width * scale) / 2 - box.minX * scale
  const originY = (size - box.height * scale) / 2 - box.minY * scale

  const map = (poly) => poly.map(([x, y]) => [originX + x * scale, originY + y * scale])
  const drop2 = coverageMap([map(outline()), map(holeOutline())], size)
  const tileCoverage = tile ? tileMap(size, radius) : null

  const tileRgb = tile ? hexToRgb(tile) : null
  const dropRgb = hexToRgb(drop)

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const at = y * size + x
      const covered = Math.min(1, Math.max(0, drop2[at]))
      const i = at * 4

      if (tileRgb) {
        // The drop is composited over the tile, so the hole shows the tile
        // through it rather than being a third colour.
        px[i] = mix(tileRgb[0], dropRgb[0], covered)
        px[i + 1] = mix(tileRgb[1], dropRgb[1], covered)
        px[i + 2] = mix(tileRgb[2], dropRgb[2], covered)
        px[i + 3] = Math.round(Math.min(1, Math.max(0, tileCoverage[at])) * 255)
      } else {
        px[i] = dropRgb[0]
        px[i + 1] = dropRgb[1]
        px[i + 2] = dropRgb[2]
        px[i + 3] = Math.round(covered * 255)
      }
    }
  }

  return { width: size, height: size, data: px }
}

/**
 * Coverage of the tile, so a rounded tile has a clean edge.
 *
 * `radius` of 0 means square to the edge, which is every asset a host masks or
 * rounds for itself. Only the favicon carries its own corners: nothing masks a
 * favicon, and a browser draws what it is given.
 */
function tileMap(size, radius) {
  const coverage = new Float64Array(size * size)
  if (radius <= 0) {
    coverage.fill(1)
    return coverage
  }
  for (let row = 0; row < size; row++) {
    for (let sub = 0; sub < SS; sub++) {
      const y = row + (sub + 0.5) / SS
      // The rounded rectangle's horizontal extent at this height: full width
      // between the corner arcs, inset by the arc elsewhere.
      const cy = Math.min(Math.max(y, radius), size - radius)
      const dy = y - cy
      const dx = Math.sqrt(Math.max(0, radius * radius - dy * dy))
      const left = dy === 0 ? 0 : radius - dx
      const right = size - left
      addSpan(coverage, row * size, left, right, size, 1 / SS)
    }
  }
  return coverage
}

/**
 * The drop's own bounding box, measured off the flattened outline.
 *
 * Measured rather than written down, because the two numbers that would be
 * written down are the ones the pin's own comment gets wrong. Everything that
 * positions the mark — the drop fraction, the centring on the canvas — is
 * stated against this box, so an edit to the path moves the mark correctly
 * without a second number needing to be updated to match.
 */
export function pathBounds() {
  const points = outline()
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const [x, y] of points) {
    if (x < minX) minX = x
    if (x > maxX) maxX = x
    if (y < minY) minY = y
    if (y > maxY) maxY = y
  }
  return { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY }
}

const mix = (a, b, t) => Math.round(a + (b - a) * t)

function hexToRgb(hex) {
  const h = hex.replace('#', '')
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]
}

/**
 * Coverage of the tile at one pixel, so a rounded tile has a clean edge.
 *
 * `radius` of 0 means square to the edge, which is every asset a host masks or
 * rounds for itself. Only the favicon carries its own corners: nothing masks a
 * favicon, and a browser draws what it is given.
 */
function cornerCoverage(x, y, size, radius) {
  if (radius <= 0) return 1
  let hits = 0
  for (let sy = 0; sy < SS; sy++) {
    for (let sx = 0; sx < SS; sx++) {
      const px0 = x + (sx + 0.5) / SS
      const py0 = y + (sy + 0.5) / SS
      const cx = Math.min(Math.max(px0, radius), size - radius)
      const cy = Math.min(Math.max(py0, radius), size - radius)
      if (Math.hypot(px0 - cx, py0 - cy) <= radius) hits++
    }
  }
  return hits / (SS * SS)
}

/**
 * A PNG, deflated with `node:zlib`. Eight bits, no interlace.
 *
 * Colour type 2 when every pixel is opaque and type 6 when any is not. That is
 * not a size optimisation: an iOS application icon carrying an alpha channel is
 * rejected at submission, and `apps/mobile/assets/icon.png` is that icon. The
 * two assets that genuinely need alpha — the Android adaptive foreground, which
 * is drawn over a background layer, and the favicon, whose corners are its own
 * — keep it by having a pixel that is not opaque.
 */
export function encodePng({ width, height, data }) {
  let opaque = true
  for (let i = 3; i < data.length; i += 4) {
    if (data[i] !== 255) {
      opaque = false
      break
    }
  }

  const channels = opaque ? 3 : 4
  const stride = width * channels
  const raw = Buffer.alloc(height * (stride + 1))
  for (let y = 0; y < height; y++) {
    const row = y * (stride + 1)
    raw[row] = 0
    for (let x = 0; x < width; x++) {
      const src = (y * width + x) * 4
      const dst = row + 1 + x * channels
      raw[dst] = data[src]
      raw[dst + 1] = data[src + 1]
      raw[dst + 2] = data[src + 2]
      if (channels === 4) raw[dst + 3] = data[src + 3]
    }
  }

  const chunk = (type, body) => {
    const out = Buffer.alloc(body.length + 12)
    out.writeUInt32BE(body.length, 0)
    out.write(type, 4, 'ascii')
    body.copy(out, 8)
    out.writeUInt32BE(crc32(out.subarray(4, 8 + body.length)), 8 + body.length)
    return out
  }

  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8
  ihdr[9] = channels === 4 ? 6 : 2
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

const CRC_TABLE = (() => {
  const table = new Int32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    table[n] = c
  }
  return table
})()

function crc32(buf) {
  let c = 0xffffffff
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

/** An ICO is a 6-byte header, one 16-byte directory entry per size, then PNGs. */
export function encodeIco(images) {
  const pngs = images.map(encodePng)
  const header = Buffer.alloc(6 + images.length * 16)
  header.writeUInt16LE(0, 0)
  header.writeUInt16LE(1, 2)
  header.writeUInt16LE(images.length, 4)

  let offset = header.length
  images.forEach((image, i) => {
    const entry = 6 + i * 16
    // 0 means 256 in an ICO directory; no size here reaches it, but the format
    // says so and a future 256 entry would otherwise write a silent zero.
    header[entry] = image.width >= 256 ? 0 : image.width
    header[entry + 1] = image.height >= 256 ? 0 : image.height
    header.writeUInt16LE(1, entry + 4)
    header.writeUInt16LE(32, entry + 6)
    header.writeUInt32BE(0, entry + 8)
    header.writeUInt32LE(pngs[i].length, entry + 8)
    header.writeUInt32LE(offset, entry + 12)
    offset += pngs[i].length
  })

  return Buffer.concat([header, ...pngs])
}

/**
 * The favicon, as text.
 *
 * The one asset a host renders itself rather than being handed pixels, so it
 * stays SVG — and it is emitted rather than hand-kept for the same reason the
 * rasters are. It carried its own copy of the path, its own colour literals and
 * its own transform, none of which anything compared to anything.
 *
 * The comment is part of the output. It is where the reasoning about knockouts,
 * literals and one-asset-for-both-themes is written down, and a generated file
 * that drops it would trade a maintenance problem for an amnesia problem.
 */
export function renderSvg({ size = 32, dropWidth, radius }) {
  const box = pathBounds()
  const scale = (dropWidth * size) / box.width
  const centreX = (box.minX + box.maxX) / 2
  const centreY = (box.minY + box.maxY) / 2
  const round = (n) => Number(n.toFixed(4))

  // The head, knocked out as a second subpath under `evenodd`. Written from the
  // same constants the rasteriser uses, as two half-circle arcs.
  const hole =
    `M${HOLE.cx} ${HOLE.cy - HOLE.r} ` +
    `A ${HOLE.r} ${HOLE.r} 0 1 0 ${HOLE.cx} ${HOLE.cy + HOLE.r} ` +
    `A ${HOLE.r} ${HOLE.r} 0 1 0 ${HOLE.cx} ${HOLE.cy - HOLE.r} Z`

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}">
  <!--
    The tab mark. GENERATED — do not edit.

    Cut by \`.github/scripts/build-icons.mjs\` from \`MARKER_PATH\` in
    \`packages/tokens/src/layout.ts\`, which is the same path both applications
    draw on the map. \`pnpm check:icons\` fails if this file is not what the mark
    would cut. It was hand-kept until it was not, and it held its own copy of the
    path and its own colour literals, which nothing compared to anything.

    The head is knocked out with \`fill-rule="evenodd"\` rather than being a
    second shape in the tile's colour, so the pin stays one path and the hole
    cannot land a half-pixel off the fill at 16px.

    Amber is \`accent\` and the drop is \`inkOnAccent\` — that pairing is not a
    choice made here. The styling spec requires anything drawn on the accent to
    be lettered in \`inkOnAccent\`, and both are literals rather than \`var()\`
    because a favicon is fetched outside the document and inherits none of its
    custom properties.

    The drop is larger here than on any other asset, and not because of masking:
    this is drawn at 16px in a tab strip, where 41% is six pixels across and the
    tile has to do the reading.

    The tile is rounded because nothing masks a favicon: a browser draws what it
    is given. The apple and manifest icons are the same mark drawn square to the
    edge, because iOS and Android cut their own corners out of whatever they are
    handed and would round these again.

    One asset serves both themes. It carries its own ground, so there is no
    \`prefers-color-scheme\` here and nothing to be resolved by a host that may
    not consult the media query for an icon at all.
  -->
  <rect width="${size}" height="${size}" rx="${round(radius * size)}" fill="${TILE}"/>
  <path
    fill="${DROP}"
    fill-rule="evenodd"
    transform="translate(${size / 2} ${size / 2}) scale(${round(scale)}) translate(${round(-centreX)} ${round(-centreY)})"
    d="${markerPath()} ${hole}"
  />
</svg>
`
}
