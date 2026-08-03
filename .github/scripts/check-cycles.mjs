#!/usr/bin/env node
/**
 * Fail if the workspace dependency graph contains a cycle, or if a package
 * depends on an application.
 *
 * Why this exists: a sibling repo reached 14 packages with a clean acyclic
 * graph purely by care, with no check of any kind. That is a good outcome and
 * an unreliable mechanism — it holds until the one time it doesn't, and by then
 * the untangling is expensive. Cheap to enforce at three packages.
 *
 * No dependencies on purpose: this must run before anything is installed.
 */
import { readdirSync, readFileSync, existsSync } from 'node:fs'
import { join, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..')

/** @returns {{name: string, dir: string, kind: 'app'|'package', allDeps: string[], deps: string[]}[]} */
function readMembers() {
  const members = []
  for (const [group, kind] of [
    ['apps', 'app'],
    ['packages', 'package'],
  ]) {
    const groupDir = join(repoRoot, group)
    if (!existsSync(groupDir)) continue
    for (const entry of readdirSync(groupDir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue
      const manifestPath = join(groupDir, entry.name, 'package.json')
      if (!existsSync(manifestPath)) continue
      const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
      const allDeps = Object.keys({
        ...manifest.dependencies,
        ...manifest.devDependencies,
        ...manifest.peerDependencies,
      })
      members.push({
        name: manifest.name,
        dir: `${group}/${entry.name}`,
        kind,
        allDeps,
        deps: [],
      })
    }
  }

  // Second pass: a workspace edge is a dependency naming another member.
  // Filtering on a scope prefix instead would miss the apps entirely — they are
  // named `web` and `mobile`, unscoped — which silently disables the
  // packages-must-not-depend-on-apps check.
  const names = new Set(members.map((m) => m.name))
  for (const member of members) {
    member.deps = member.allDeps.filter((d) => names.has(d) && d !== member.name)
  }
  return members
}

const members = readMembers()
const byName = new Map(members.map((m) => [m.name, m]))
const problems = []

// A package must never depend on an application. Applications are named
// without the scope, so any dependency resolving to an app member is upward.
for (const member of members) {
  if (member.kind !== 'package') continue
  for (const dep of member.deps) {
    const target = byName.get(dep)
    if (target && target.kind === 'app') {
      problems.push(
        `${member.name} (${member.dir}) depends on the application ${target.name}. ` +
          `Dependencies point from apps to packages, never the reverse.`,
      )
    }
  }
}

// Depth-first search for a back edge.
const WHITE = 0
const GREY = 1
const BLACK = 2
const state = new Map(members.map((m) => [m.name, WHITE]))
const cycles = []

function visit(name, stack) {
  const current = state.get(name)
  if (current === GREY) {
    // `stack` already ends with the repeated node — appending `name` again
    // would print it twice.
    const start = stack.indexOf(name)
    cycles.push(stack.slice(start).join(' -> '))
    return
  }
  if (current === BLACK) return

  state.set(name, GREY)
  for (const dep of byName.get(name)?.deps ?? []) {
    if (byName.has(dep)) visit(dep, [...stack, dep])
  }
  state.set(name, BLACK)
}

for (const member of members) visit(member.name, [member.name])

for (const cycle of cycles) problems.push(`Dependency cycle: ${cycle}`)

// Report.
const packages = members.filter((m) => m.kind === 'package')
console.log(
  `Checked ${members.length} workspace members ` +
    `(${members.length - packages.length} apps, ${packages.length} packages)`,
)
for (const member of members) {
  console.log(`  ${member.name.padEnd(22)} -> ${member.deps.join(', ') || '(none)'}`)
}

if (problems.length > 0) {
  console.error('')
  for (const problem of problems) {
    console.error(`::error::${problem}`)
  }
  process.exit(1)
}

console.log('\nGraph is acyclic and directed away from applications.')
