#!/usr/bin/env node
/**
 * Fail if the repository root has been treated as an application project.
 *
 * Why this exists: `expo prebuild` has to be run from `apps/mobile`. Run it one
 * directory up and Expo does not complain — the Expo CLI installs into the
 * nearest `package.json`, and at the root of a pnpm workspace that is the
 * workspace root. It has happened twice, and both times it was invisible.
 *
 * What a root prebuild does, none of it asked for:
 *
 *   - adds `expo`, `react` and `react-native` to the root `package.json` as
 *     `dependencies`, where the root previously declared two devDependencies
 *     and nothing else;
 *   - churns `pnpm-lock.yaml`, which pins every version in the project;
 *   - writes a root `ios/` whose app icon is Expo's blank default, because
 *     there is no config at the root naming one;
 *   - leaves `apps/mobile/ios` untouched, so the build you were trying to
 *     produce does not get made either.
 *
 * WHY A CHECK AND NOT A NOTE
 *
 * `.gitignore` is `ios/`, unscoped, so the root output never appears in
 * `git status` — the one place a person would look. The manifest and lockfile
 * edits do appear, but as an unexplained diff in whatever branch happens to be
 * checked out. That is how it was found the second time: three hours later,
 * while reviewing an unrelated change. AGENTS.md now carries the gotcha, and a
 * note alone is insufficient — it has already been got wrong by someone who
 * would have read it.
 *
 * WHEN IT RUNS, AND WHY THAT MOMENT
 *
 * From `preinstall`, so it fires on the install Expo itself runs. Reading
 * `@expo/cli/build/src/prebuild/prebuildAsync.js`, the order is: write the
 * native folders and edit `package.json`'s dependencies, *then* ask
 * `Install the updated dependencies?` and run the package manager. So by the
 * time the guard is reached the evidence is already on disk, and the lockfile
 * is not yet rewritten — which makes the recovery smaller than if this ran
 * afterwards. pnpm runs a workspace root's `preinstall` on both `install` and
 * `add`, and a non-zero exit fails the install.
 *
 * It also runs in `verify` and in CI, which is what catches the case where the
 * install prompt was declined: no install means no `preinstall`, and the
 * manifest and the native folder are still there to be found.
 *
 * WHAT COUNTS AS PROOF
 *
 * Three markers, each unambiguous at the root and none of them ambiguous with
 * ordinary work:
 *
 *   `dependencies` in the root manifest — the root is a workspace container and
 *       a home for tooling. Every runtime dependency belongs to the app or
 *       package that bundles it, so one here was put there by a tool.
 *   `ios/` or `android/` at the root — generated native output. Nothing
 *       generates these at the root on purpose, and `.gitignore` hides them.
 *   `app.json` at the root — written by Expo's `ensureConfigAsync` when it
 *       prompts for a bundle identifier. The root is not an Expo project.
 *
 * Deliberately NOT a marker: the lockfile having changed. It is the loudest
 * symptom and the worst test, because a lockfile legitimately changes whenever
 * anyone touches a dependency. It cannot tell the two apart.
 *
 * No dependencies on purpose: this runs before anything is installed, and on an
 * install that is itself the thing going wrong.
 */
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

/** Generated native output. Present at the root only by mistake. */
const NATIVE_DIRS = ['ios', 'android']

/** Where the command belongs, printed on every failure. */
const RIGHT_WAY = 'pnpm --filter mobile exec expo prebuild'

/**
 * Everything at `root` that says a toolchain mistook it for an application.
 *
 * Pure and takes its root as an argument so the tests can build the trees they
 * assert on: this repository's own tree only ever exercises the passing case,
 * where a check that silently found nothing would look identical to one that
 * works.
 *
 * @param {string} root
 * @returns {{problems: {kind: string, path: string, detail?: string}[]}}
 */
export function inspect(root) {
  const problems = []

  const manifestPath = join(root, 'package.json')
  if (existsSync(manifestPath)) {
    // A manifest too broken to parse is not this check's business — pnpm is
    // about to report it far better than a guard could, and throwing here would
    // bury that behind a stack trace from a script nobody was thinking about.
    let manifest
    try {
      manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
    } catch {
      manifest = null
    }

    const declared = Object.keys(manifest?.dependencies ?? {})
    if (declared.length > 0) {
      problems.push({
        kind: 'dependencies',
        path: 'package.json',
        detail: declared.join(', '),
      })
    }
  }

  for (const dir of NATIVE_DIRS) {
    if (existsSync(join(root, dir))) problems.push({ kind: 'native', path: `${dir}/` })
  }

  if (existsSync(join(root, 'app.json'))) problems.push({ kind: 'config', path: 'app.json' })

  return { problems }
}

/**
 * The commands that undo what was found — only what was found.
 *
 * `git checkout --` is offered for the manifest rather than prescribed: a root
 * prebuild happens in the middle of somebody's work, and that work may have
 * touched `package.json` for its own reasons. Advice that discards it is worse
 * than the mistake it is cleaning up.
 *
 * @param {{kind: string, path: string, detail?: string}[]} problems
 * @returns {string[]}
 */
function recovery(problems) {
  const steps = []

  const dependencies = problems.find((problem) => problem.kind === 'dependencies')
  if (dependencies) {
    steps.push(
      `Remove the "dependencies" block from package.json (${dependencies.detail}). ` +
        `If nothing else in your work touches that file, \`git checkout -- package.json\` does it.`,
    )
  }

  const generated = problems.filter((problem) => problem.kind !== 'dependencies')
  if (generated.length > 0) {
    steps.push(`Delete what was generated here: rm -rf ${generated.map((p) => p.path).join(' ')}`)
  }

  steps.push(
    'Check whether pnpm-lock.yaml was rewritten as well — `git status` shows it, ' +
      'and `git checkout -- pnpm-lock.yaml` restores it.',
  )
  steps.push(`Then run it where it belongs: ${RIGHT_WAY}`)

  return steps
}

function main() {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
  const { problems } = inspect(root)

  if (problems.length === 0) {
    console.log('The repository root declares no runtime dependencies and holds no native output.')
    return
  }

  console.error('')
  for (const problem of problems) {
    if (problem.kind === 'dependencies') {
      console.error(
        `::error::The root package.json declares runtime dependencies (${problem.detail}). ` +
          `The root is a workspace container: every runtime dependency belongs to the app or ` +
          `package that bundles it, so these were added by a tool run from the wrong directory.`,
      )
    } else if (problem.kind === 'native') {
      console.error(
        `::error::${problem.path} at the repository root is generated native build output. ` +
          `It belongs to apps/mobile. .gitignore hides it from \`git status\`, which is why ` +
          `this check looks for it directly.`,
      )
    } else {
      console.error(
        `::error::${problem.path} at the repository root is an Expo app config. The root is not ` +
          `an Expo project; Expo wrote this when it was run here instead of in apps/mobile.`,
      )
    }
  }

  console.error(
    `\nThis is what \`expo prebuild\` does when it is run from the repository root instead\n` +
      `of from apps/mobile. It does not fail — Expo installs into the nearest package.json,\n` +
      `and here that is the workspace root. apps/mobile/ios is left untouched, so the build\n` +
      `you wanted was not made either.\n\n` +
      `To put it back:\n\n` +
      recovery(problems)
        .map((step, index) => `  ${index + 1}. ${step}`)
        .join('\n') +
      `\n\nSee AGENTS.md § Gotchas that cost real time.\n`,
  )
  process.exit(1)
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main()
