#!/usr/bin/env node --test
/**
 * What the check has to get right, on trees built here rather than on this one.
 *
 * The repository's own tree only ever exercises the passing case, so a check
 * that silently found nothing — a catalogue whose shape moved, a directory
 * walk that matched nothing — would look identical to a check that works. Every
 * case below builds the tree it asserts on.
 */

import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { test } from 'node:test'

import { inspect } from './check-wording.mjs'

/**
 * Enough names to clear the floor the check refuses to work below.
 *
 * `markerType.place` is in the base set because the default tree declares that
 * one type, and a type with no name beside it is a failure. Leaving it out
 * would put a second problem in every result and make each assertion below
 * about two things.
 */
function catalogueOf(extra = {}) {
  const base = { 'markerType.place': 'Place' }
  for (let i = 0; i < 20; i += 1) base[`filler.name${i}`] = 'A filler sentence.'
  const entries = { ...base, ...extra }
  const lines = Object.entries(entries).map(([key, text]) => `  '${key}': '${text}',`)
  return `export const ENGLISH = {\n${lines.join('\n')}\n} as const\n`
}

/** Something that resolves every filler, so only the case under test fails. */
function consumerOf(names) {
  return names.map((name) => `message('${name}')`).join('\n')
}

function fillerNames() {
  return ['markerType.place', ...Array.from({ length: 20 }, (_, i) => `filler.name${i}`)]
}

/**
 * @param {{catalogue?: string, app?: string, types?: string}} tree
 * @returns {string} a repository root to inspect
 */
function treeWith(tree) {
  const root = mkdtempSync(join(tmpdir(), 'wording-'))
  const write = (path, contents) => {
    mkdirSync(join(root, dirname(path)), { recursive: true })
    writeFileSync(join(root, path), contents)
  }

  write('packages/wording/src/english.ts', tree.catalogue ?? catalogueOf())
  write('apps/web/app/thing.tsx', tree.app ?? consumerOf(fillerNames()))
  write(
    'packages/map/src/marker-type.ts',
    tree.types ?? "export const MARKER_TYPE_IDS_TUPLE = ['place'] as const\n",
  )
  return root
}

function check(tree) {
  const root = treeWith(tree)
  try {
    return inspect(root)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
}

test('passes a catalogue whose every name is resolved', () => {
  const { problems, defined } = check({})
  assert.deepEqual(problems, [])
  assert.equal(defined, 21)
})

test('fails a name nothing defines', () => {
  const { problems } = check({
    app: `${consumerOf(fillerNames())}\nmessage('place.notAThing')`,
  })
  assert.equal(problems.length, 1)
  assert.match(problems[0], /place\.notAThing/)
  assert.match(problems[0], /does not hold/)
})

test('fails a sentence nothing resolves', () => {
  const { problems } = check({
    catalogue: catalogueOf({ 'place.forgotten': 'Nobody asks for this.' }),
    app: consumerOf(fillerNames()),
  })
  assert.equal(problems.length, 1)
  assert.match(problems[0], /place\.forgotten/)
  assert.match(problems[0], /nothing resolves it/)
})

test('counts a name used as a record value, not only one passed to message()', () => {
  // A failure mapped to a name, or a marker type mapped to one, is the same
  // fact as a call — and calling it unused is how a real sentence gets deleted.
  const { problems } = check({
    catalogue: catalogueOf({ 'auth.generic': 'Something went wrong.' }),
    app: `${consumerOf(fillerNames())}\nconst BY_FAILURE = { generic: 'auth.generic' }`,
  })
  assert.deepEqual(problems, [])
})

test('fails a name assembled from a template', () => {
  const { problems } = check({
    app: `${consumerOf(fillerNames())}\nmessage(\`markerType.\${id}\`)`,
  })
  assert.equal(problems.length, 1)
  assert.match(problems[0], /builds a message name/)
})

test('fails a name passed as a bare variable', () => {
  const { problems } = check({
    app: `${consumerOf(fillerNames())}\nmessage(chosenKey)`,
  })
  assert.equal(problems.length, 1)
  assert.match(problems[0], /builds a message name out of `chosenKey`/)
})

test('fails a marker type with no name beside it', () => {
  const { problems } = check({
    types: "export const MARKER_TYPE_IDS_TUPLE = ['place', 'temple'] as const\n",
  })
  assert.equal(problems.length, 1)
  assert.match(problems[0], /markerType\.temple/)
})

test('refuses to work when the catalogue shape has moved', () => {
  // The floor. A parse that finds nothing passes every other assertion, so
  // finding almost nothing has to be the loud case rather than the clean one.
  const { problems } = check({ catalogue: 'export const ENGLISH = somethingElse()\n' })
  assert.equal(problems.length, 1)
  assert.match(problems[0], /probably moved/)
})

test('reports a missing catalogue rather than passing', () => {
  const root = mkdtempSync(join(tmpdir(), 'wording-'))
  try {
    const { problems } = inspect(root)
    assert.equal(problems.length, 1)
    assert.match(problems[0], /is missing/)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})
