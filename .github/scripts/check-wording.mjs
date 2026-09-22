#!/usr/bin/env node
/**
 * Every name the product says resolves, and every sentence it holds is said.
 *
 * `@pinpoint/wording` holds each sentence under a name, and everything else
 * hands that name around until an application draws it. Both halves of that
 * arrangement fail silently, in opposite directions, which is why this reads the
 * repository rather than trusting either side.
 *
 * A name with no sentence behind it draws **nothing** where a sentence belongs —
 * an empty refusal under a field, a blank where a place's type should be. It
 * typechecks wherever a cast got involved, it renders, and the only symptom is
 * an absence on one screen somebody happens to open.
 *
 * A sentence nothing resolves is quieter still and costs later rather than now:
 * it is kept correct forever, reviewed whenever the words around it change, and
 * translated into every language this product ever offers, for a screen that
 * stopped asking for it.
 *
 * WHY IT READS THE REPOSITORY AND HOLDS NO LIST
 *
 * The same argument `check-icons.mjs` makes at length: a check comparing a set
 * of known copies cannot see a copy nobody added to the set, so the file that
 * needs checking most — the new one — is exactly the one it skips. This looks
 * for names instead of for disagreement.
 *
 * WHY A COMPUTED NAME IS A FAILURE RATHER THAN SOMETHING TO SKIP
 *
 * `message(`markerType.${id}`)` cannot be read by anything that reads text, so
 * a check that tolerated it would quietly stop being able to answer either
 * question — the assembled name is not checked for existing, and every sentence
 * it might have reached looks unused. One such call makes the whole check
 * unsound rather than slightly less complete, which is why it fails here.
 *
 * What to write instead is an exhaustive record from the thing being named to a
 * name, which is what both applications do for a marker type. That is the same
 * shape they already use to map an icon's name to a glyph, and it is better than
 * the template it replaces: a type added without a sentence beside it fails to
 * typecheck rather than drawing a blank.
 */

import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))

/** Where the sentences live. Everything else is a consumer. */
export const CATALOGUE = 'packages/wording/src/english.ts'

/** Where names may be used. The catalogue itself is read separately. */
export const SEARCHED = ['apps', 'packages', '.github/scripts']

const SOURCE = /\.(ts|tsx|mjs|js|jsx)$/

/**
 * A name written to prove it is refused is not a name being used.
 *
 * `say.test.ts` passes `message('place.doesNotExist')` under an
 * `@ts-expect-error`, which is the test asserting that the compiler rejects an
 * unknown name — the very thing this check also defends. Reported as a problem
 * it would be exactly backwards: the repository would fail because one of its
 * guarantees is tested.
 *
 * Keyed on the marker rather than on the file, so the exemption says what it
 * is for. A file-wide one would also quietly stop checking every real name
 * beside it.
 */
function isDeliberatelyRefused(source, index) {
  const lineStart = source.lastIndexOf('\n', index) + 1
  const previousLine = source.slice(source.lastIndexOf('\n', lineStart - 2) + 1, lineStart)
  return previousLine.includes('@ts-expect-error')
}

/** Files that talk *about* names rather than using them. */
function isExempt(path) {
  // The catalogue declares the names; it does not consume them.
  if (path === CATALOGUE) return true
  // This check's own source and test quote names as examples.
  if (path.endsWith('check-wording.mjs')) return true
  if (path.endsWith('check-wording.test.mjs')) return true
  return false
}

function sourceFiles(root, dir, found = []) {
  let entries
  try {
    entries = readdirSync(join(root, dir), { withFileTypes: true })
  } catch {
    return found
  }
  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue
    const path = join(dir, entry.name)
    if (entry.isDirectory()) sourceFiles(root, path, found)
    else if (SOURCE.test(entry.name)) found.push(path)
  }
  return found
}

/**
 * The names the catalogue defines.
 *
 * Read as text rather than imported, because importing would need the
 * TypeScript source to be compiled and this has to run before anything is
 * built. The shape it depends on is one entry per line opening with a quoted
 * key — which is what `english.ts` is, and what the count guard below defends.
 */
export function definedNames(source) {
  const names = new Set()
  for (const match of source.matchAll(/^ {2}'([a-zA-Z][\w.]*)':/gm)) names.add(match[1])
  return names
}

/**
 * Every name a file uses, and every name it assembles rather than writes.
 *
 * A name is used when it is written as a quoted literal that the catalogue
 * knows. That deliberately catches more than `message('…')` calls: a name also
 * travels as the value of a record — a failure to a name, a marker type to a
 * name — and those are the same fact stated in a place this would otherwise
 * call unused.
 */
export function namesIn(source, defined) {
  const used = new Set()
  for (const match of source.matchAll(/'([a-zA-Z][\w.]*)'/g)) {
    if (defined.has(match[1])) used.add(match[1])
  }

  const computed = []
  for (const match of source.matchAll(/\b(?:message|refusal)\(\s*`([^`]*)`/g)) {
    computed.push(match[1])
  }
  // A name passed as a bare variable is the same failure wearing a different
  // coat: nothing downstream can tell which sentence was meant.
  for (const match of source.matchAll(/\b(?:message|refusal)\(\s*([A-Za-z_$][\w$]*)\s*[,)]/g)) {
    computed.push(match[1])
  }

  return { used, computed }
}

/** Marker types, read from the shared list, so this holds no copy of them. */
export function markerTypeIds(source) {
  const block = source.match(/MARKER_TYPE_IDS_TUPLE = \[([^\]]*)\]/)
  if (!block) return []
  return [...block[1].matchAll(/'([\w-]+)'/g)].map((m) => m[1])
}

export function inspect(root) {
  const problems = []
  const read = (path) => readFileSync(join(root, path), 'utf8')

  let catalogue
  try {
    catalogue = read(CATALOGUE)
  } catch {
    return { problems: [`${CATALOGUE} is missing, so nothing can be checked.`], defined: 0 }
  }

  const defined = definedNames(catalogue)

  /*
   * A parse that finds nothing passes every assertion below, so the floor is
   * stated. If the catalogue's shape moves, this fails loudly here rather than
   * reading nothing and reporting the repository clean.
   */
  if (defined.size < 20) {
    problems.push(
      `Only ${defined.size} names were read from ${CATALOGUE}. That is fewer than this ` +
        `catalogue has ever held, so the shape being parsed has probably moved and this ` +
        `check is no longer reading what it thinks it is.`,
    )
    return { problems, defined: defined.size }
  }

  const used = new Set()
  for (const dir of SEARCHED) {
    for (const path of sourceFiles(root, dir)) {
      if (isExempt(path)) continue
      const source = read(path)
      const seen = namesIn(source, defined)
      for (const name of seen.used) used.add(name)
      for (const name of seen.computed) {
        problems.push(
          `${path} builds a message name out of \`${name}\` instead of writing it out. ` +
            `A name assembled at runtime cannot be checked for existing, and every sentence ` +
            `it might reach looks unused — so one of these makes this whole check unsound. ` +
            `Use an exhaustive record from the thing being named to a written-out name, the ` +
            `way both applications name a marker type.`,
        )
      }
    }
  }

  for (const name of [...defined].sort()) {
    if (!used.has(name)) {
      problems.push(
        `${CATALOGUE} holds "${name}" and nothing resolves it. A sentence nobody asks for ` +
          `is still kept correct, reviewed and eventually translated — delete it, or find ` +
          `what should have been using it.`,
      )
    }
  }

  /*
   * Names used but not defined are mostly caught by the compiler, which knows
   * `MessageKey`. What it cannot catch is a name reached through a cast, and a
   * cast is exactly what a record of names tends to need.
   */
  const calls = new Set()
  for (const dir of SEARCHED) {
    for (const path of sourceFiles(root, dir)) {
      if (isExempt(path)) continue
      const source = read(path)
      for (const match of source.matchAll(/\b(?:message|refusal)\(\s*'([^']+)'/g)) {
        if (isDeliberatelyRefused(source, match.index)) continue
        if (!defined.has(match[1])) {
          problems.push(
            `${path} says "${match[1]}", which ${CATALOGUE} does not hold. Nothing would be ` +
              `drawn where that sentence belongs.`,
          )
        }
        calls.add(match[1])
      }
    }
  }

  // Every marker type is named somewhere, which is the one set of names that
  // has to exist per member of a list held in another package.
  const typesFile = 'packages/map/src/marker-type.ts'
  try {
    for (const id of markerTypeIds(read(typesFile))) {
      if (!defined.has(`markerType.${id}`)) {
        problems.push(
          `${typesFile} defines the marker type "${id}" and ${CATALOGUE} has no ` +
            `"markerType.${id}". That type would draw with no name beside it.`,
        )
      }
    }
  } catch {
    problems.push(`${typesFile} could not be read, so marker type names were not checked.`)
  }

  return { problems, defined: defined.size }
}

const invokedDirectly =
  process.argv[1] && relative(process.argv[1], fileURLToPath(import.meta.url)) === ''

if (invokedDirectly) {
  const root = join(HERE, '..', '..')
  const { problems, defined } = inspect(root)

  if (problems.length > 0) {
    console.error('\nWording check failed:\n')
    for (const problem of problems) console.error(`  - ${problem}\n`)
    process.exit(1)
  }

  console.log(`\nAll ${defined} named messages resolve, and every one of them is used.`)
}
