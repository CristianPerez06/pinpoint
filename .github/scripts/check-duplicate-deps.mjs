#!/usr/bin/env node
/**
 * Fail if a runtime that both apps bundle is installed at more than one version.
 *
 * Why this exists: two versions of a dually-bundled runtime crash the bundle in
 * ways that look unrelated to dependencies — the classic symptom is
 * "Cannot read property 'useRef' of null" from deep inside a navigation library.
 * Nothing else catches it: lint, typecheck, tests and the web build are all green
 * with two copies installed. Both apps pin these exactly; this catches a
 * transitive resolution that reintroduces a second copy.
 *
 * Only `react` and `react-native`. `react-dom` is bundled into web alone; mobile
 * can pull a different one transitively for Expo's web export without it ever
 * reaching a native bundle, so that duplication is benign.
 *
 * This used to be shell inside the "Workspace health" job, which meant CI could
 * check it and a person could not — the pull request template had to tell people
 * to paste a `jq` one-liner by hand instead. See `comment:verify`.
 */
import { execFileSync } from 'node:child_process'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

/** `pnpm why` answers for the package it is run in, so it is always run from the root. */
const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..')

const BUNDLED_INTO_BOTH_APPS = ['react', 'react-native']

/**
 * Every version of `name` anywhere in the resolved tree.
 *
 * `pnpm why` answers with the dependency graph rather than a flat list, so the
 * versions are scattered across nested `dependents` at any depth. Walking the
 * whole structure is the point: a second copy introduced transitively is exactly
 * the case this catches, and it never appears at the top level.
 *
 * @param {string} name
 * @returns {string[]} sorted, de-duplicated
 */
export function installedVersions(name, json) {
  const tree = json ?? JSON.parse(execFileSync('pnpm', ['why', name, '--json'], {
    cwd: repoRoot,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  }))

  const versions = new Set()
  const visit = (node) => {
    if (Array.isArray(node)) return node.forEach(visit)
    if (node === null || typeof node !== 'object') return
    if (typeof node.version === 'string' && (node.name === name || node.alias === name)) {
      versions.add(node.version)
    }
    for (const value of Object.values(node)) visit(value)
  }
  visit(tree)

  return [...versions].sort()
}

function main() {
  let failed = false

  for (const name of BUNDLED_INTO_BOTH_APPS) {
    const versions = installedVersions(name)
    console.log(`  ${name.padEnd(14)} -> ${versions.join(', ') || '(not installed)'}`)
    if (versions.length > 1) {
      console.error(
        `::error::Multiple versions of '${name}' installed in the workspace ` +
          `(${versions.join(', ')}). This breaks bundle resolution at runtime — the ` +
          `classic symptom is "Cannot read property X of null" from deep inside a ` +
          `navigation library. Align the version across apps/web and apps/mobile.`,
      )
      failed = true
    }
  }

  if (failed) process.exit(1)
  console.log('\nNo runtime bundled into both apps is duplicated.')
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main()
