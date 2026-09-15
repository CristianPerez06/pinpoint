#!/usr/bin/env node
/**
 * Fail when a pull request implements an OpenSpec change and leaves it
 * unarchived.
 *
 * Why this exists: it has already happened twice, and the second time was only
 * noticed because a third change went looking. #91 merged the seven-type place
 * type code without archiving its change; #139 merged the eighth type on top of
 * it, also unarchived. By then `openspec/specs/markers/spec.md` still said
 * *"Family SHALL determine colour… a new type SHALL be assigned to an existing
 * family — no new colour is introduced"*, which is the scheme the code had
 * deleted. The specification did not merely lag the implementation; it stated
 * the opposite of it, and it did so on `main` for two merges.
 *
 * AGENTS.md already carries the rule — *"Apply and archive a change on the same
 * branch, one after the other, unless the user says otherwise"* — and the pull
 * request template already asks. Neither is a gate. Both merges passed every
 * check that exists, because nothing that exists looks at this: `check:specs`
 * validates that a specification is well *formed*, never that it is true of the
 * code beside it, and `openspec list` reporting a change as `in-progress` is not
 * wired to anything.
 *
 * WHAT IT ACTUALLY CHECKS, AND WHY NOT SOMETHING SIMPLER
 *
 * "Touches an unarchived change" is the obvious rule and it is wrong: opening a
 * proposal adds an unarchived change, which is the correct outcome of
 * `/opsx:propose` and must pass. The distinction that matters is whether the
 * pull request *implemented* anything:
 *
 *   touches an active change  +  touches nothing outside openspec/   -> a proposal, fine
 *   touches an active change  +  touches code                        -> an apply, must archive
 *   touches no active change                                         -> not our business
 *
 * So implementation is defined as **any path outside `openspec/`**. That is
 * deliberately blunt and deliberately fails closed. A narrower rule — excluding
 * documentation, say — would have to decide that `DESIGN.md` is not
 * implementation, and `DESIGN.md` is exactly what an apply pull request rewrites
 * alongside the code. Blunt costs the occasional false positive, which a person
 * clears in one line; narrow costs the thing this guard exists to catch, which
 * nobody notices for two merges.
 *
 * THE ESCAPE HATCH IS DELIBERATE AND VISIBLE
 *
 * AGENTS.md says *"unless the user says otherwise"*, so there has to be a way to
 * say otherwise — and it has to be legible to whoever reads the pull request
 * later, not a flag buried in a workflow file. It is a line in the pull request
 * body:
 *
 *   Archive deferred: <reason>
 *
 * The reason is required. A marker that permits an empty excuse is a marker that
 * gets pasted in without one.
 *
 * No dependencies on purpose: this runs before anything is installed.
 */
import { execFileSync } from 'node:child_process'

/** Where changes live while they are being worked on. */
const CHANGES = 'openspec/changes/'

/** Where they live afterwards, as `openspec/changes/archive/YYYY-MM-DD-<name>/`. */
const ARCHIVE = 'openspec/changes/archive/'

/**
 * The marker that defers an archive on purpose. Matched case-insensitively at
 * the start of a line, because a pull request body is typed by a person.
 */
const DEFER = /^[ \t>*-]*archive deferred:[ \t]*(\S.*)$/im

/**
 * Split a list of changed paths into the three things this check cares about.
 *
 * Paths are repository-relative and forward-slashed, which is what
 * `git diff --name-only` emits on every platform.
 *
 * @param {string[]} paths
 * @returns {{active: Set<string>, archived: Set<string>, implementation: string[]}}
 */
export function classify(paths) {
  const active = new Set()
  const archived = new Set()
  const implementation = []

  for (const path of paths) {
    if (path.startsWith(ARCHIVE)) {
      /* `openspec/changes/archive/2026-09-15-one-colour-per-place-type/…` — the
         date prefix is stripped so the folder can be matched against the active
         name it came from. */
      const folder = path.slice(ARCHIVE.length).split('/')[0]
      if (folder) archived.add(folder.replace(/^\d{4}-\d{2}-\d{2}-/, ''))
      continue
    }

    if (path.startsWith(CHANGES)) {
      const folder = path.slice(CHANGES.length).split('/')[0]
      /* A file sitting directly in `openspec/changes/` belongs to no change. */
      if (folder && path.slice(CHANGES.length).includes('/')) active.add(folder)
      continue
    }

    /* Everything else. `openspec/specs/` is excluded along with the rest of
       `openspec/`, because syncing the specifications is *part of* archiving —
       counting it as implementation would make every archive look like one. */
    if (!path.startsWith('openspec/')) implementation.push(path)
  }

  return { active, archived, implementation }
}

/**
 * Decide whether a set of changed paths is a violation.
 *
 * @param {{paths: string[], body?: string}} input
 * @returns {{ok: boolean, unarchived: string[], implementation: string[], deferred: string|null}}
 */
export function evaluate({ paths, body = '' }) {
  const { active, archived, implementation } = classify(paths)
  const unarchived = [...active].filter((name) => !archived.has(name)).sort()
  const deferred = (body.match(DEFER)?.[1] ?? '').trim() || null

  /* Both conditions, in the order they are cheap to reason about: a change was
     worked on, and something outside openspec/ changed too. Either alone is
     fine. */
  const ok = unarchived.length === 0 || implementation.length === 0 || deferred !== null

  return { ok, unarchived, implementation, deferred }
}

/**
 * The files a pull request changes, as git sees them.
 *
 * Three dots, not two: it asks what the branch did, not what has happened on
 * the base since it forked. With two dots a busy `main` would drag unrelated
 * files into the answer and the guard would fire on work the branch never
 * touched.
 *
 * @param {string} base
 * @returns {string[]}
 */
export function changedPaths(base) {
  const committed = execFileSync('git', ['diff', '--name-only', `${base}...HEAD`], {
    encoding: 'utf8',
  })

  /* Plus whatever is not committed yet. In CI the tree is clean and this adds
     nothing; locally it is the difference between `pnpm verify` warning you
     before you push and agreeing with you until it is somebody else's problem.
     `--porcelain` prefixes two status columns and quotes unusual names, so the
     path starts at column 3 and a rename is reported as `old -> new`. */
  const working = execFileSync('git', ['status', '--porcelain', '--untracked-files=all'], {
    encoding: 'utf8',
  })
    .split('\n')
    .filter(Boolean)
    .map((line) => line.slice(3))
    .map((path) => (path.includes(' -> ') ? path.slice(path.indexOf(' -> ') + 4) : path))
    .map((path) => path.replace(/^"|"$/g, ''))

  return [...new Set([...committed.split('\n').filter(Boolean), ...working])]
}

/**
 * Resolve something to compare against, tolerating the several shapes a base
 * arrives in: a bare branch name from `GITHUB_BASE_REF`, a full ref, or nothing
 * at all when this runs outside a pull request.
 *
 * @param {string|undefined} ref
 * @returns {string|null} a revision git can resolve, or null when there is
 *   nothing to compare — which is not a failure, it is a push to `main`.
 */
export function resolveBase(ref) {
  const candidates = ref
    ? [ref, `origin/${ref}`, `refs/remotes/origin/${ref}`]
    : ['origin/main', 'main']

  for (const candidate of candidates) {
    try {
      execFileSync('git', ['rev-parse', '--verify', '--quiet', `${candidate}^{commit}`], {
        stdio: ['ignore', 'ignore', 'ignore'],
      })
      return candidate
    } catch {
      /* try the next shape */
    }
  }
  return null
}

function main() {
  const base = resolveBase(process.env.GITHUB_BASE_REF || process.env.BASE_REF)

  if (base === null) {
    console.log('check:unarchived — no base branch to compare against, nothing to check.')
    return
  }

  const paths = changedPaths(base)
  if (paths.length === 0) {
    console.log(`check:unarchived — no changes against ${base}, nothing to check.`)
    return
  }

  const { ok, unarchived, implementation, deferred } = evaluate({
    paths,
    body: process.env.PR_BODY ?? '',
  })

  if (ok) {
    if (deferred && unarchived.length > 0) {
      console.log(`check:unarchived — archive deferred on purpose: ${deferred}`)
      return
    }
    console.log('check:unarchived OK')
    return
  }

  const names = unarchived.map((name) => `openspec/changes/${name}/`)
  console.error(
    [
      '',
      'This pull request implements an OpenSpec change and does not archive it.',
      '',
      `  still active:  ${names.join('\n                 ')}`,
      `  and it changes ${implementation.length} file(s) outside openspec/, for example:`,
      ...implementation.slice(0, 5).map((path) => `      ${path}`),
      '',
      'AGENTS.md: "Apply and archive a change on the same branch, one after the',
      'other, unless the user says otherwise." Merging without the archive leaves',
      'openspec/specs/ describing the code that was just replaced — which has',
      'happened twice, and was invisible to every other check both times.',
      '',
      'Either archive it on this branch:',
      '',
      `    openspec archive ${unarchived[0]}`,
      '',
      'or, if deferring is the deliberate choice, say so in the pull request body',
      'on a line of its own, with a reason:',
      '',
      '    Archive deferred: <why>',
      '',
    ].join('\n'),
  )
  process.exitCode = 1
}

/* Only when run directly, so the tests can import the pure functions above. */
if (process.argv[1] && process.argv[1].endsWith('check-unarchived-change.mjs')) main()
