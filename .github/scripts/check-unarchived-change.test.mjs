#!/usr/bin/env node --test
/**
 * What the check has to get right, stated as path lists rather than as trees.
 *
 * The cases that matter are not hypothetical: two of them are the pull requests
 * that produced this guard, and they are asserted by name so a future refactor
 * that stops catching them fails here rather than on `main`.
 *
 * The passing cases carry as much weight as the failing one. A guard that fires
 * on every proposal is a guard somebody turns off in a fortnight.
 */

import assert from 'node:assert/strict'
import { test } from 'node:test'

import { classify, evaluate } from './check-unarchived-change.mjs'

/** #139: ticked tasks, rewrote the packages and both apps, archived nothing. */
const APPLY_WITHOUT_ARCHIVE = [
  'openspec/changes/one-colour-per-place-type/tasks.md',
  'openspec/changes/one-colour-per-place-type/design.md',
  'packages/map/src/marker-type.ts',
  'packages/tokens/src/colour.ts',
  'apps/web/app/_components/marker-icon.tsx',
  'DESIGN.md',
]

/** #141: moved the folder under archive/ and synced the master specs. */
const ARCHIVE_PR = [
  'openspec/changes/one-colour-per-place-type/tasks.md',
  'openspec/changes/one-colour-per-place-type/proposal.md',
  'openspec/changes/archive/2026-09-15-one-colour-per-place-type/tasks.md',
  'openspec/changes/archive/2026-09-15-one-colour-per-place-type/proposal.md',
  'openspec/specs/markers/spec.md',
  'openspec/specs/styling/spec.md',
]

/** What `/opsx:propose` produces: a change and nothing else. */
const PROPOSAL = [
  'openspec/changes/guard-unarchived-changes/proposal.md',
  'openspec/changes/guard-unarchived-changes/tasks.md',
  'openspec/changes/guard-unarchived-changes/specs/monorepo-structure/spec.md',
]

test('fails an apply that leaves the change unarchived', () => {
  const result = evaluate({ paths: APPLY_WITHOUT_ARCHIVE })

  assert.equal(result.ok, false)
  assert.deepEqual(result.unarchived, ['one-colour-per-place-type'])
  assert.ok(result.implementation.includes('packages/map/src/marker-type.ts'))
})

test('passes a pull request that archives the change it touched', () => {
  // The date prefix is why this is not a string comparison: the folder under
  // archive/ is never spelled the same as the folder it came from.
  const result = evaluate({ paths: ARCHIVE_PR })

  assert.equal(result.ok, true)
  assert.deepEqual(result.unarchived, [])
})

test('passes a proposal, which is an unarchived change on purpose', () => {
  const result = evaluate({ paths: PROPOSAL })

  assert.equal(result.ok, true)
  assert.deepEqual(result.implementation, [])
})

test('passes a pull request that touches no change at all', () => {
  const result = evaluate({
    paths: ['apps/web/app/page.tsx', '.github/workflows/ci.yml', 'README.md'],
  })

  assert.equal(result.ok, true)
  assert.deepEqual(result.unarchived, [])
})

test('does not count syncing the master specs as implementation', () => {
  // Archiving writes openspec/specs/. If that counted, every archive would look
  // like an apply and the guard would fire on the one thing it wants.
  const { implementation } = classify([
    'openspec/specs/markers/spec.md',
    'openspec/changes/some-change/tasks.md',
  ])

  assert.deepEqual(implementation, [])
})

test('ignores a loose file sitting directly in openspec/changes/', () => {
  const { active } = classify(['openspec/changes/README.md'])

  assert.deepEqual([...active], [])
})

test('reports every unarchived change, not just the first', () => {
  const result = evaluate({
    paths: [
      'openspec/changes/one/tasks.md',
      'openspec/changes/two/tasks.md',
      'packages/map/src/index.ts',
    ],
  })

  assert.equal(result.ok, false)
  assert.deepEqual(result.unarchived, ['one', 'two'])
})

test('a change archived alongside another that is not still fails', () => {
  const result = evaluate({
    paths: [
      'openspec/changes/done/tasks.md',
      'openspec/changes/archive/2026-01-01-done/tasks.md',
      'openspec/changes/pending/tasks.md',
      'packages/map/src/index.ts',
    ],
  })

  assert.equal(result.ok, false)
  assert.deepEqual(result.unarchived, ['pending'])
})

test('a deliberate deferral in the pull request body passes, with its reason', () => {
  const result = evaluate({
    paths: APPLY_WITHOUT_ARCHIVE,
    body: 'Splits the work in two.\n\nArchive deferred: the visual checks need a device.\n',
  })

  assert.equal(result.ok, true)
  assert.equal(result.deferred, 'the visual checks need a device.')
})

test('the deferral is recognised through the markdown a person actually types', () => {
  for (const line of [
    '- Archive deferred: waiting on review',
    '> archive deferred: waiting on review',
    '**Archive deferred:** waiting on review'.replace(/\*\*/g, ''),
  ]) {
    const result = evaluate({ paths: APPLY_WITHOUT_ARCHIVE, body: `text\n${line}\n` })
    assert.equal(result.ok, true, line)
  }
})

test('a deferral with no reason does not count', () => {
  // A marker that accepts an empty excuse is one that gets pasted in without
  // thinking, which is the failure mode it exists to prevent.
  const result = evaluate({
    paths: APPLY_WITHOUT_ARCHIVE,
    body: 'Archive deferred:\n',
  })

  assert.equal(result.ok, false)
  assert.equal(result.deferred, null)
})

test('the words in prose do not defer anything', () => {
  const result = evaluate({
    paths: APPLY_WITHOUT_ARCHIVE,
    body: 'The archive deferred until later is the thing this guard prevents.',
  })

  assert.equal(result.ok, false)
})
