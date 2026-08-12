#!/usr/bin/env node
/**
 * The typeface is bundled twice — once per application — and this asserts the
 * two copies are the same file, and that the file is the family the tokens
 * name.
 *
 * The failure this exists for is silent by construction. A missing, renamed, or
 * differently-versioned font file does not throw: the browser and React Native
 * both fall back to a system face, every measurement on the screen changes, and
 * nothing in a build, a typecheck, or a lint has anything to say about it. The
 * only other way to catch it is to look at rendered pixels and know what Figtree
 * is supposed to look like.
 *
 * Reads the TrueType `name` table directly rather than taking a dependency. A
 * check that needs installing is a check that gets skipped.
 */

import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..')

/** Must match FONT_FAMILY in packages/tokens/src/type.ts. */
const EXPECTED_FAMILY = 'Figtree'

const COPIES = [
  'apps/web/app/fonts/Figtree.ttf',
  'apps/mobile/assets/fonts/Figtree.ttf',
]

const problems = []

/**
 * nameID 16 is the typographic family, 1 the legacy family, 5 the version.
 *
 * 16 is the one that matters here and the one it is easy to get wrong. This is
 * a variable font, so its legacy nameID 1 records the *default instance* —
 * "Figtree Light" — while the family the whole weight axis belongs to is only
 * in nameID 16. Checking nameID 1 rejects a perfectly correct file.
 */
function readNameTable(buffer) {
  const tableCount = buffer.readUInt16BE(4)

  let nameOffset = null
  for (let i = 0; i < tableCount; i++) {
    const record = 12 + i * 16
    if (buffer.toString('latin1', record, record + 4) === 'name') {
      nameOffset = buffer.readUInt32BE(record + 8)
      break
    }
  }
  if (nameOffset === null) return {}

  const count = buffer.readUInt16BE(nameOffset + 2)
  const storage = nameOffset + buffer.readUInt16BE(nameOffset + 4)
  const found = {}

  for (let i = 0; i < count; i++) {
    const record = nameOffset + 6 + i * 12
    const platformId = buffer.readUInt16BE(record)
    const nameId = buffer.readUInt16BE(record + 6)
    const length = buffer.readUInt16BE(record + 8)
    const offset = buffer.readUInt16BE(record + 10)

    if (nameId !== 1 && nameId !== 5 && nameId !== 16) continue

    const bytes = buffer.subarray(storage + offset, storage + offset + length)
    // Platform 3 (Windows) stores UTF-16BE; platform 1 (Mac) stores single bytes.
    const decoded =
      platformId === 3
        ? Buffer.from(bytes).swap16().toString('utf16le')
        : bytes.toString('latin1')

    found[nameId] ??= decoded.trim()
  }

  return { family: found[16] ?? found[1], version: found[5] }
}

const digests = new Map()

for (const path of COPIES) {
  const absolute = join(ROOT, path)

  let buffer
  try {
    buffer = readFileSync(absolute)
  } catch {
    problems.push(`${path} is missing. Both applications bundle the same file.`)
    continue
  }

  digests.set(path, createHash('sha256').update(buffer).digest('hex'))

  const { family, version } = readNameTable(buffer)

  if (family !== EXPECTED_FAMILY) {
    problems.push(
      `${path} reports family "${family ?? 'unreadable'}", but the tokens name "${EXPECTED_FAMILY}". ` +
        `A mismatched family name registers under one name and is asked for under another, ` +
        `which falls back to a system face and says nothing.`,
    )
  }

  console.log(`  ${path}\n    family: ${family}  version: ${version ?? 'unstated'}`)
}

const unique = new Set(digests.values())
if (digests.size === COPIES.length && unique.size > 1) {
  problems.push(
    `The two copies differ:\n` +
      [...digests].map(([path, digest]) => `      ${digest.slice(0, 12)}  ${path}`).join('\n') +
      `\n    Web and mobile would render the same role in two different faces.`,
  )
}

if (problems.length > 0) {
  console.error('\nFont check failed:\n')
  for (const problem of problems) console.error(`  - ${problem}`)
  process.exit(1)
}

console.log(`\nBoth copies are ${EXPECTED_FAMILY}, byte-identical.`)
