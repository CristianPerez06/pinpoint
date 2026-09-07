#!/usr/bin/env node
/**
 * Asserts that every icon in the repository is still the mark, and that every
 * copy of the mark's geometry and colour still agrees with every other.
 *
 * The failure this exists for already happened. Five icons were cut by hand in
 * two sittings, and they came out as two different drawings — an amber tile
 * carrying a dark drop on the web, and the inverse on the phone. Nothing in a
 * build, a typecheck, a lint or a test had anything to say about it, because an
 * icon is a binary nobody reads and a colour in `app.json` is a string that is
 * valid whatever it says. It was found by a person looking at two home screens.
 *
 * WHAT IT COMPARES
 *
 * Pixels, not bytes. zlib is free to choose a different encoding for the same
 * image and does across Node versions, so a byte comparison would fail on a
 * machine that had changed nothing.
 *
 * WHY THE PATH IS CHECKED IN FOUR PLACES
 *
 * The teardrop is held once per application and once in `icon.svg`. That
 * duplication is required rather than sloppy: `styling` forbids sharing
 * rendered markup between the platforms, and an SVG path in a shared package
 * would be exactly that. A duplication the specification asks for still has to
 * be proved, or it is just a divergence nobody has noticed yet.
 */

import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join, relative as relativePath } from 'node:path'
import { fileURLToPath } from 'node:url'

import { bytesFor } from './build-icons.mjs'
import { ASSETS } from './icon-assets.mjs'
import { decodeIco, decodePng, meanDifference } from './icon-pixels.mjs'
import { DROP, markerPath, TILE } from './icon-mark.mjs'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const read = (path) => readFileSync(join(ROOT, path), 'utf8')
const relative_ = (path) => relativePath(ROOT, path)

const problems = []

/**
 * Nowhere but the token holds the path.
 *
 * This used to assert that three copies were equal — one per application and a
 * third in the favicon. There is one now, `MARKER_PATH` in
 * `packages/tokens/src/layout.ts`, so the useful assertion inverts: nothing
 * else may carry the literal.
 *
 * That is a strictly stronger check than the one it replaces. An equality
 * comparison over a list of known copies cannot see a fourth: somebody pasting
 * the string into a new component passes, because the new file was never on the
 * list. This looks for the string instead of for disagreement.
 */
const OUTLINE = markerPath()

const SEARCHED = ['apps', 'packages', '.github/scripts']
const HOME = 'packages/tokens/src/layout.ts'

/**
 * Generated assets are exempt: they carry the path because it was cut into
 * them, which is the opposite of a copy somebody has to keep in step. They are
 * held honest by the regeneration comparison below instead.
 */
const GENERATED = new Set(ASSETS.map((asset) => asset.path))

console.log('The mark:\n')
console.log(`  ${HOME}\n    holds the path`)

const copies = []
for (const root of SEARCHED) {
  for (const file of walk(join(ROOT, root))) {
    const relative = relative_(file)
    if (relative === HOME || GENERATED.has(relative)) continue
    let text
    try {
      text = readFileSync(file, 'utf8')
    } catch {
      continue
    }
    if (text.includes(OUTLINE)) copies.push(relative)
  }
}

if (copies.length > 0) {
  problems.push(
    `The path is written out again in:\n${copies.map((c) => `      ${c}`).join('\n')}\n` +
      `    It has one definition, \`MARKER_PATH\` in ${HOME}. Import it rather than ` +
      `copying it — three copies held in agreement is what this replaced, and a copy ` +
      `is only ever in agreement until somebody edits one.`,
  )
} else {
  console.log(`    and nothing under ${SEARCHED.join(', ')} carries a copy`)
}

/** Every file under a directory, skipping build output and dependencies. */
function* walk(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name.startsWith('.next') || entry.name === 'ios') {
      continue
    }
    const full = join(directory, entry.name)
    if (entry.isDirectory()) yield* walk(full)
    else if (/\.(tsx?|jsx?|mjs|svg|css|json|html)$/.test(entry.name)) yield full
  }
}

/**
 * The mark's colours against the tokens.
 *
 * The generator holds them as literals because it runs outside any build and
 * cannot load TypeScript. This is what stops that being a place a colour
 * quietly stops matching the palette it came from.
 *
 * WHY READING `colour.ts` IS NOT THE THING THE SPEC FORBIDS
 *
 * `styling` says no process shall recover token values by parsing a stylesheet,
 * and that derivation only ever goes from the neutral definition outward. This
 * reads `packages/tokens/src/colour.ts` — the neutral definition itself, the
 * thing every stylesheet is derived *from*. It does not touch
 * `src/generated/tokens.css`, and it derives nothing: it compares two values and
 * reports a disagreement. Reading the source of truth to check a copy against it
 * is the opposite of recovering a value from a derived artefact.
 *
 * The rule's stated reason is that stylesheet parsing is lossy and fails
 * silently. A regex over TypeScript can be lossy in exactly the same way, so
 * this one is written to fail loudly instead: an unreadable match yields
 * `undefined`, which can never equal a literal, so a reformatted `colour.ts`
 * fails the check and says the value was unreadable rather than passing on a
 * comparison it never made.
 */
const colour = read('packages/tokens/src/colour.ts')
const tokenValue = (name) =>
  colour.match(new RegExp(`${name}:\\s*\\{\\s*light:\\s*'(#[0-9A-Fa-f]{6})'`))?.[1]

for (const [name, literal, what] of [
  ['accent', TILE, 'the tile'],
  ['inkOnAccent', DROP, 'the drop'],
]) {
  const token = tokenValue(name)
  if (token?.toUpperCase() !== literal.toUpperCase()) {
    problems.push(
      `${what} is ${literal}, but \`${name}\`'s light value is ${token ?? 'unreadable'}. ` +
        `The mark would no longer be drawn in the product's own colours.`,
    )
  }
}

/**
 * The Android background layer.
 *
 * It is the mark's tile on the one asset that cannot carry a tile of its own,
 * so it is the accent — and it is checked here because a colour in `app.json`
 * is a string that stays valid whatever it says. It held `#1A1917`, which is
 * `ink`'s light value: a text colour standing in as a ground, which is the
 * shape `styling` warns about and which nothing would otherwise report.
 */
const appJson = JSON.parse(read('apps/mobile/app.json'))
const background = appJson.expo?.android?.adaptiveIcon?.backgroundColor
if (background?.toUpperCase() !== TILE.toUpperCase()) {
  problems.push(
    `\`adaptiveIcon.backgroundColor\` is ${background}, not the mark's tile ${TILE}. ` +
      `The foreground has no tile of its own, so this is the tile — the Android icon ` +
      `would be the only surface where the mark is not amber.`,
  )
}

/** The largest mean per-channel difference an anti-aliasing change may produce. */
const TOLERANCE = 0.5

console.log()
for (const asset of ASSETS) {
  let committed
  try {
    committed = readFileSync(join(ROOT, asset.path))
  } catch {
    problems.push(`${asset.path} is missing. Run \`node .github/scripts/build-icons.mjs\`.`)
    continue
  }

  const fresh = bytesFor(asset)

  // The favicon is text, so it is compared as text. Everything else is
  // compared as pixels — never as bytes, because zlib may legitimately encode
  // the same picture differently.
  if (asset.kind === 'svg') {
    if (fresh.toString('utf8') !== committed.toString('utf8')) {
      problems.push(
        `${asset.path} is not what the mark would cut. ` +
          `It is generated now — edit the path, the colours or the generator, not this file. ` +
          `Run \`node .github/scripts/build-icons.mjs\`.`,
      )
    }
    console.log(
      `  ${asset.path}\n    ${String(asset.size).padEnd(11)} ${asset.contract.padEnd(18)} ` +
        `drop ${(asset.dropWidth * 100).toFixed(1)}% of canvas   text, exact`,
    )
    continue
  }

  const pairs =
    asset.kind === 'ico'
      ? decodeIco(fresh).map((image, i) => [image, decodeIco(committed)[i]])
      : [[decodePng(fresh), decodePng(committed)]]

  let worst = 0
  let failed = false
  for (const [expected, actual] of pairs) {
    try {
      worst = Math.max(worst, meanDifference(expected, actual))
      if (expected.colourType !== actual.colourType) {
        failed = true
        problems.push(
          `${asset.path} is colour type ${actual.colourType}, expected ${expected.colourType}. ` +
            `An iOS application icon carrying an alpha channel is rejected at submission.`,
        )
      }
    } catch (error) {
      failed = true
      problems.push(`${asset.path}: ${error.message}`)
    }
  }

  if (!failed && worst > TOLERANCE) {
    problems.push(
      `${asset.path} is not what the mark would cut — mean difference ${worst.toFixed(2)}/255. ` +
        `Run \`node .github/scripts/build-icons.mjs\`.`,
    )
  }

  const size = asset.kind === 'ico' ? asset.sizes.join('/') : asset.size
  console.log(
    `  ${asset.path}\n    ${String(size).padEnd(11)} ${asset.contract.padEnd(18)} ` +
      `drop ${(asset.dropWidth * 100).toFixed(1)}% of canvas   difference ${worst.toFixed(2)}/255`,
  )
}

if (problems.length > 0) {
  console.error('\nIcon check failed:\n')
  for (const problem of problems) console.error(`  - ${problem}\n`)
  process.exit(1)
}

console.log(`\nOne mark, ${ASSETS.length} assets, cut from one path in ${TILE} and ${DROP}.`)
