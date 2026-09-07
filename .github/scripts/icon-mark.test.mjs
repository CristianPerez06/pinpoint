#!/usr/bin/env node --test
/**
 * What the rasteriser has to get right, asserted against values that can be
 * worked out on paper.
 *
 * The generator draws the mark with about two hundred lines of arithmetic and
 * no library, so the arithmetic is the risk. Every number below is derived
 * rather than recorded from a run — a test that only says "the same as last
 * time" would have accepted the wrong head circle, which is the bug this file
 * was written after finding.
 */

import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

import { ASSETS, ANDROID_RENDERED, DROP_OF_RENDERED } from './icon-assets.mjs'
import { bytesFor } from './build-icons.mjs'
import { decodeIco, decodePng, dropBounds } from './icon-pixels.mjs'
import {
  encodePng,
  holeOutline,
  markerPath,
  outline,
  pathBounds,
  render,
  renderSvg,
  TILE,
} from './icon-mark.mjs'

/**
 * The head's real centre, from SVG's endpoint-to-centre conversion.
 *
 * The endpoints (5, 24.4) and (27, 24.4) are 22 apart, the radius is 13, so the
 * centre sits sqrt(13^2 - 11^2) = sqrt(48) above the chord — the arc is the
 * large one and goes over the top.
 */
const HEAD = { x: 16, y: 24.4 - Math.sqrt(48), r: 13 }

test('the head circle is where SVG puts it, not where the comment says', () => {
  // The pin's comment describes a circle centred at (16, 15). The endpoints are
  // 14.47 from that point, so they cannot lie on a radius-13 circle there.
  assert.ok(Math.hypot(5 - 16, 24.4 - 15) > 14, 'the described centre is not the real one')
  assert.ok(Math.abs(Math.hypot(5 - HEAD.x, 24.4 - HEAD.y) - HEAD.r) < 1e-9)
  assert.ok(Math.abs(Math.hypot(27 - HEAD.x, 24.4 - HEAD.y) - HEAD.r) < 1e-9)
})

test('the outline spans the head circle and reaches the point', () => {
  const box = pathBounds()
  assert.ok(Math.abs(box.minX - (HEAD.x - HEAD.r)) < 0.01, `minX ${box.minX}`)
  assert.ok(Math.abs(box.maxX - (HEAD.x + HEAD.r)) < 0.01, `maxX ${box.maxX}`)
  assert.ok(Math.abs(box.minY - (HEAD.y - HEAD.r)) < 0.01, `minY ${box.minY}`)
  assert.equal(box.maxY, 41, 'the point is at y 41')
  assert.ok(Math.abs(box.height / box.width - 1.405) < 0.002, `aspect ${box.height / box.width}`)
})

test('flattening has converged well below a pixel', () => {
  const coarse = pathBounds()
  let minY = Infinity
  let maxX = -Infinity
  for (const [x, y] of outline(4096)) {
    if (y < minY) minY = y
    if (x > maxX) maxX = x
  }
  // At 1024px the head is ~300px across, so 0.01 units is well under a pixel.
  assert.ok(Math.abs(coarse.minY - minY) < 0.01)
  assert.ok(Math.abs(coarse.maxX - maxX) < 0.01)
})

test('the hole is a circle of radius 6 at (16, 15)', () => {
  for (const [x, y] of holeOutline()) {
    assert.ok(Math.abs(Math.hypot(x - 16, y - 15) - 6) < 1e-9)
  }
})

test('the fill agrees with the polygon area it was told to fill', () => {
  // Shoelace over the flattened polygons is exact for those polygons, so this
  // is an independent statement about the scanline fill rather than a restating
  // of it. Even-odd means the hole subtracts.
  const area = (poly) => {
    let sum = 0
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      sum += poly[j][0] * poly[i][1] - poly[i][0] * poly[j][1]
    }
    return Math.abs(sum) / 2
  }

  const size = 512
  const dropWidth = 0.41
  const scale = (dropWidth * size) / pathBounds().width
  const expected = (area(outline()) - area(holeOutline())) * scale * scale

  const { data } = render({ size, dropWidth, tile: null })
  let covered = 0
  for (let i = 3; i < data.length; i += 4) covered += data[i] / 255

  assert.ok(
    Math.abs(covered - expected) / expected < 0.005,
    `filled ${covered.toFixed(0)}px where the polygon is ${expected.toFixed(0)}px`,
  )
})

test('the hole is knocked out rather than painted over', () => {
  const size = 256
  const image = render({ size, dropWidth: 0.41, tile: TILE })
  const box = pathBounds()
  const scale = (0.41 * size) / box.width
  const originX = (size - box.width * scale) / 2 - box.minX * scale
  const originY = (size - box.height * scale) / 2 - box.minY * scale

  const at = (x, y) => {
    const i = (Math.round(originY + y * scale) * size + Math.round(originX + x * scale)) * 4
    return [image.data[i], image.data[i + 1], image.data[i + 2]]
  }

  // The hole's centre shows the tile through it; a point inside the head but
  // outside the hole is the drop.
  assert.deepEqual(at(16, 15), [0xe3, 0x9a, 0x2b], 'the hole shows the tile')
  assert.deepEqual(at(16, 15 - 9), [0x24, 0x17, 0x03], 'the head around it is the drop')
})

test('every asset centres the drop on the canvas', () => {
  for (const asset of ASSETS.filter((a) => a.kind === 'png')) {
    const image = decodePng(bytesFor(asset))
    const box = dropBounds(image, asset.transparent ? null : TILE)
    const centreX = (box.minX + box.maxX) / 2
    const centreY = (box.minY + box.maxY) / 2
    // Within a pixel of the canvas centre. The tip is the exposed end on a
    // cropping host, so an off-centre box brings it nearer the mask than the head.
    assert.ok(Math.abs(centreX - image.width / 2) <= 1, `${asset.path} x ${centreX}`)
    assert.ok(Math.abs(centreY - image.height / 2) <= 1, `${asset.path} y ${centreY}`)
  }
})

test('every asset draws the drop at the fraction its contract states', () => {
  for (const asset of ASSETS.filter((a) => a.kind === 'png')) {
    const image = decodePng(bytesFor(asset))
    const box = dropBounds(image, asset.transparent ? null : TILE)
    const measured = box.width / image.width
    assert.ok(
      Math.abs(measured - asset.dropWidth) < 0.01,
      `${asset.path} draws ${(measured * 100).toFixed(1)}% where ${(asset.dropWidth * 100).toFixed(1)}% is stated`,
    )
  }
})

test('the two cropping contracts arrive at the same rendered size', () => {
  // The whole point of stating the drop against the rendered region: an Android
  // adaptive layer shows 72 of 108 units, so its file carries a smaller drop in
  // order to draw the same one.
  const adaptive = ASSETS.find((a) => a.path.endsWith('adaptive-icon.png'))
  const image = decodePng(bytesFor(adaptive))
  const box = dropBounds(image, null)
  const rendered = box.width / (image.width * ANDROID_RENDERED)
  assert.ok(
    Math.abs(rendered - DROP_OF_RENDERED) < 0.01,
    `reads at ${(rendered * 100).toFixed(1)}% of the tile a launcher draws`,
  )
})

test('the drop clears the safe region of every contract that crops', () => {
  /** Furthest any drawn pixel sits from the canvas centre, in pixels. */
  const reach = (image, tile) => {
    const box = dropBounds(image, tile)
    const cx = image.width / 2
    const cy = image.height / 2
    return Math.max(
      Math.hypot(box.minX - cx, box.minY - cy),
      Math.hypot(box.maxX - cx, box.minY - cy),
      Math.hypot(box.minX - cx, box.maxY - cy),
      Math.hypot(box.maxX - cx, box.maxY - cy),
      Math.abs(box.maxY - cy),
      Math.abs(box.minY - cy),
    )
  }

  // A web manifest `maskable` icon reserves a circle 80% of the image width.
  for (const path of ['apps/web/public/icon-192.png', 'apps/web/public/icon-512.png']) {
    const asset = ASSETS.find((a) => a.path === path)
    const image = decodePng(bytesFor(asset))
    assert.ok(
      reach(image, TILE) <= image.width * 0.4,
      `${path} reaches past the 80%-of-width safe circle`,
    )
  }

  // An Android adaptive layer guarantees only the middle 66 of 108 units.
  const adaptive = ASSETS.find((a) => a.path.endsWith('adaptive-icon.png'))
  const image = decodePng(bytesFor(adaptive))
  assert.ok(
    reach(image, null) <= (image.width * (66 / 108)) / 2,
    'the adaptive foreground reaches past the 66-of-108 safe circle',
  )
})

test('the iOS application icon carries no alpha channel', () => {
  // An icon with an alpha channel is rejected at submission.
  const asset = ASSETS.find((a) => a.path === 'apps/mobile/assets/icon.png')
  assert.equal(decodePng(bytesFor(asset)).colourType, 2)
})

test('the adaptive foreground keeps its alpha, and its hole is transparent', () => {
  const asset = ASSETS.find((a) => a.path.endsWith('adaptive-icon.png'))
  const image = decodePng(bytesFor(asset))
  assert.equal(image.colourType, 6)

  const at = (x, y) => image.data[(y * image.width + x) * 4 + 3]
  assert.equal(at(2, 2), 0, 'the ground is the background layer, not a tile')

  // The hole sits at the head's centre: 15 of the path's 42-unit box, measured
  // from the drop's top rather than the canvas's.
  const box = dropBounds(image, null)
  const unit = box.width / 26
  assert.equal(at(image.width / 2, Math.round(box.minY + (15 - (24.4 - Math.sqrt(48) - 13)) * unit)), 0)
})

test('the favicon carries its own corners and the others do not', () => {
  const ico = decodeIco(bytesFor(ASSETS.find((a) => a.kind === 'ico')))
  for (const image of ico) {
    assert.equal(image.data[3], 0, 'a favicon corner is transparent')
    assert.equal(image.data[(image.height / 2) * image.width * 4 + 3], 255, 'its edge is not')
  }

  const apple = decodePng(bytesFor(ASSETS.find((a) => a.path.endsWith('apple-icon.png'))))
  assert.equal(apple.colourType, 2, 'square to the edge — iOS cuts its own corners')
})

test('a PNG round-trips through the encoder unchanged', () => {
  const image = render({ size: 64, dropWidth: 0.41, tile: TILE })
  const back = decodePng(encodePng(image))
  assert.equal(back.width, 64)
  for (let i = 0; i < image.data.length; i++) assert.equal(back.data[i], image.data[i])
})

test('the mark still matches the assets it was cut to reproduce', () => {
  // The four web assets were correct before this generator existed, so they are
  // the oracle it was measured against. Tolerances are the hand-cutting they
  // record: those four were cut at 41.1%, 41.7% and 41.8% of their canvases,
  // which is why this is not an exact comparison and why the generator exists.
  const originals = {
    'apps/web/app/apple-icon.png': [74, 105],
    'apps/web/public/icon-192.png': [80, 111],
    'apps/web/public/icon-512.png': [214, 300],
  }
  for (const [path, [width, height]] of Object.entries(originals)) {
    const asset = ASSETS.find((a) => a.path === path)
    const image = decodePng(bytesFor(asset))
    const box = dropBounds(image, TILE)
    // The tolerance is the specification's own: two percentage points of the
    // canvas on width, and that times the drop's 1.405 aspect on height.
    assert.ok(
      Math.abs(box.width - width) / image.width <= 0.02 &&
        Math.abs(box.height - height) / image.height <= 0.03,
      `${path}: ${box.width}x${box.height} against the original ${width}x${height}`,
    )
  }
})

test('the path is read from the token, not held here', () => {
  // The generator must not carry its own copy — that is what the token is for,
  // and a copy here would be invisible to the copy-detector that exempts
  // generated assets.
  const source = readFileSync(new URL('../../packages/tokens/src/layout.ts', import.meta.url), 'utf8')
  assert.ok(source.includes(markerPath()), 'layout.ts holds the literal')

  const mine = readFileSync(new URL('./icon-mark.mjs', import.meta.url), 'utf8')
  assert.ok(!mine.includes(markerPath()), 'the generator holds no copy of it')
})

test('the parser refuses what it cannot draw rather than approximating it', () => {
  // A future path using a quadratic, a relative command or a rotated ellipse
  // must stop the build, not be silently straightened. `outline` takes a path so
  // this exercises the real parser rather than a stand-in for it.
  assert.throws(() => outline(8, 'M0 0 q 1 1 2 2'), /relative command/)
  assert.throws(() => outline(8, 'M0 0 Q 1 1 2 2'), /does not implement/)
  assert.throws(() => outline(8, 'M0 0 A 6 3 0 1 0 6 0'), /unequal radii|rotation/)
})

test('the parser draws a circle it can check itself against', () => {
  // Two half-arcs back to the start is a circle of radius 6 at (16, 15) — the
  // same shape `holeOutline` produces from its constants, by a different route.
  const drawn = outline(256, `M16 9 A 6 6 0 1 0 16 21 A 6 6 0 1 0 16 9 Z`)
  for (const [x, y] of drawn) {
    assert.ok(Math.abs(Math.hypot(x - 16, y - 15) - 6) < 1e-9, `(${x}, ${y}) off the circle`)
  }
})

test('the favicon centres the drop on the box the path actually draws', () => {
  const svg = renderSvg({ size: 32, dropWidth: 0.5, radius: 7 / 32 })
  const box = pathBounds()
  const centreY = (box.minY + box.maxY) / 2

  // The hand-kept favicon centred on 21.5 — the midpoint of the box the old
  // comment described, which was never the box the path draws. That put the
  // drop 0.76px low on a 32 canvas.
  assert.ok(!svg.includes('translate(-16 -21.5)'), 'not the assumed centre')
  assert.ok(svg.includes(`translate(-16 -${centreY.toFixed(4)})`), `centre ${centreY}`)
  assert.ok(svg.includes(markerPath()), 'carries the shared path')
  assert.ok(svg.includes(TILE) && svg.includes('#241703'), 'carries the token colours')
})
