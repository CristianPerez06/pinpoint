#!/usr/bin/env node --test
/**
 * What the check has to get right, on trees built here rather than on this one.
 *
 * This repository's own tree only ever exercises the passing case — and it has
 * to, since the whole point is that the failing state never survives. So a check
 * that silently found nothing (a marker spelled wrong, a `dependencies` read
 * that never fires) would look exactly like a check that works. Every case below
 * builds the tree it asserts on.
 */

import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'

import { inspect } from './check-root-prebuild.mjs'

/** What this repository's root manifest actually looks like: tooling, no runtime. */
const CLEAN_MANIFEST = {
  name: 'pinpoint',
  private: true,
  scripts: { build: 'pnpm --filter web build' },
  devDependencies: { supabase: '^2.111.0' },
}

/** What a root `expo prebuild` adds to it. */
const PREBUILD_DEPENDENCIES = {
  expo: '~57.0.14',
  react: '19.2.3',
  'react-native': '0.86.2',
}

/**
 * @param {{manifest?: object | null, dirs?: string[], files?: string[]}} tree
 * @returns {string} a repository root to inspect
 */
function build(tree) {
  const root = mkdtempSync(join(tmpdir(), 'root-prebuild-'))

  if (tree.manifest !== null) {
    writeFileSync(
      join(root, 'package.json'),
      typeof tree.manifest === 'string'
        ? tree.manifest
        : JSON.stringify(tree.manifest ?? CLEAN_MANIFEST, null, 2),
    )
  }
  for (const dir of tree.dirs ?? []) mkdirSync(join(root, dir), { recursive: true })
  for (const file of tree.files ?? []) writeFileSync(join(root, file), '{}\n')

  return root
}

/** @param {Parameters<typeof build>[0]} tree */
function problemsOf(tree) {
  const root = build(tree)
  try {
    return inspect(root).problems
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
}

test('a clean workspace root passes', () => {
  assert.deepEqual(problemsOf({}), [])
})

test('runtime dependencies at the root fail, naming every one of them', () => {
  const problems = problemsOf({
    manifest: { ...CLEAN_MANIFEST, dependencies: PREBUILD_DEPENDENCIES },
  })
  assert.deepEqual(
    problems.map((p) => [p.kind, p.path]),
    [['dependencies', 'package.json']],
  )
  assert.equal(problems[0].detail, 'expo, react, react-native')
})

test('devDependencies are what the root is for, and are not a marker', () => {
  // The root legitimately declares tooling. A check that failed on any
  // dependency at all would fail on the tree it is meant to protect.
  assert.deepEqual(problemsOf({ manifest: CLEAN_MANIFEST }), [])
})

test('an empty dependencies block is not a marker', () => {
  // `{}` is what a tool leaves after its packages are taken back out. Nothing
  // was declared, so there is nothing to report and nothing to remove.
  assert.deepEqual(problemsOf({ manifest: { ...CLEAN_MANIFEST, dependencies: {} } }), [])
})

test('a root ios/ fails, even though .gitignore hides it', () => {
  assert.deepEqual(
    problemsOf({ dirs: ['ios'] }).map((p) => [p.kind, p.path]),
    [['native', 'ios/']],
  )
})

test('a root android/ fails too', () => {
  assert.deepEqual(
    problemsOf({ dirs: ['android'] }).map((p) => [p.kind, p.path]),
    [['native', 'android/']],
  )
})

test('native output belonging to the app is none of the check business', () => {
  // The whole distinction: apps/mobile/ios is the thing a prebuild is supposed
  // to produce. Only the root is guarded.
  assert.deepEqual(problemsOf({ dirs: ['apps/mobile/ios', 'apps/mobile/android'] }), [])
})

test('a root app.json fails', () => {
  assert.deepEqual(
    problemsOf({ files: ['app.json'] }).map((p) => [p.kind, p.path]),
    [['config', 'app.json']],
  )
})

test('a real root prebuild reports all three markers at once', () => {
  // What the person actually meets. Reporting one and stopping would send them
  // round the loop three times.
  const problems = problemsOf({
    manifest: { ...CLEAN_MANIFEST, dependencies: PREBUILD_DEPENDENCIES },
    dirs: ['ios'],
    files: ['app.json'],
  })
  assert.deepEqual(problems.map((p) => p.path).sort(), ['app.json', 'ios/', 'package.json'])
})

test('a manifest too broken to parse is left to pnpm to report', () => {
  // pnpm is about to fail on this with a far better message than a guard could
  // manage, and throwing here would bury it under a stack trace from a script
  // nobody was thinking about.
  assert.deepEqual(problemsOf({ manifest: '{ not json' }), [])
})

test('a root with no manifest at all passes', () => {
  assert.deepEqual(problemsOf({ manifest: null }), [])
})
