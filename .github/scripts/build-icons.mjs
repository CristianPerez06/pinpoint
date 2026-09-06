#!/usr/bin/env node
/**
 * Cuts every icon asset from the mark.
 *
 * Run it after changing the pin's path or the mark's colours; `pnpm
 * check:icons` fails if what is committed is not what this would produce.
 *
 *   node .github/scripts/build-icons.mjs
 */

import { writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { ASSETS } from './icon-assets.mjs'
import { encodeIco, encodePng, render, TILE } from './icon-mark.mjs'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..')

/** What one asset's bytes should be, so the builder and the check agree. */
export function bytesFor(asset) {
  const tile = asset.transparent ? null : TILE
  if (asset.kind === 'ico') {
    return encodeIco(
      asset.sizes.map((size) =>
        render({ size, dropWidth: asset.dropWidth, tile, radius: (asset.radius ?? 0) * size }),
      ),
    )
  }
  return encodePng(
    render({
      size: asset.size,
      dropWidth: asset.dropWidth,
      tile,
      radius: (asset.radius ?? 0) * asset.size,
    }),
  )
}

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('Cutting the mark:\n')
  for (const asset of ASSETS) {
    const bytes = bytesFor(asset)
    writeFileSync(join(ROOT, asset.path), bytes)
    const size = asset.kind === 'ico' ? asset.sizes.join('/') : asset.size
    console.log(
      `  ${asset.path}\n    ${size}px, ${asset.contract}, drop ${(asset.dropWidth * 100).toFixed(1)}% of canvas, ${bytes.length} bytes`,
    )
  }
  console.log('\nDone. `pnpm check:icons` verifies these stay cut from the mark.')
}
