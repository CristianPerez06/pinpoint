## Context

See `proposal.md` — Why. The rest of this is what was established by reading
`@expo/cli` and by testing pnpm's behaviour, rather than assumed.

**What `expo prebuild` does, in order** (`@expo/cli/build/src/prebuild/prebuildAsync.js`):

1. `ensureConfigAsync` — may prompt for a bundle identifier and, when it does,
   writes an `app.json` beside the manifest it found.
2. `updateFromTemplateAsync` — **writes the native folders and edits
   `package.json`'s dependencies**, returning the list it changed.
3. `installAsync([])` — runs the detected package manager with no arguments, i.e.
   `pnpm install`, behind a `Install the updated dependencies?` confirmation that
   defaults to yes.
4. `configureProjectAsync`, then CocoaPods.

So by the time anything installs, the root manifest already declares `expo`,
`react` and `react-native`, and the root `ios/` already exists. That is what makes
an install-time guard work at all: the evidence is on disk before the install it
can hook. It is also the ceiling on what the guard can achieve — the native folder
is written at step 2 and nothing at step 3 can unwrite it. The guard stops the
install, reports every marker, and tells the person how to undo all of it. It does
not prevent anything.

**What pnpm does** (tested, on this repository and on throwaway workspaces, pnpm 11.18):

- A root `preinstall` script runs on `pnpm install` in a workspace, and a non-zero
  exit fails the install. It also runs on `pnpm add`.
- **It runs after resolution and linking, not before them.** A failed install had
  already rewritten `pnpm-lock.yaml` and moved 186 packages around in
  `node_modules` by the time the guard spoke. So the guard does not save the
  lockfile, and the recovery has to mention it.
- **It is skipped entirely when pnpm has nothing to do.** An install that reports
  `Already up to date` runs no lifecycle script, so planting a root `app.json` and
  running `pnpm install` passes. This does not weaken the guard for the case it
  exists for — a root prebuild adds three dependencies, which is real work — but
  it does mean `preinstall` is not a general-purpose tripwire for the other two
  markers. `verify` and CI are what cover those.

**The issue's open question is answered.** `react-dom@19.2.8` in root
`node_modules` is not prebuild damage. `pnpm why react-dom` traces it to
`expo → @expo/cli → @expo/router-server → @expo/metro-runtime`, a legitimate
dependency of `apps/mobile`, hoisted to the root by `nodeLinker: hoisted`. It is
present on a clean checkout. `apps/web` has its own `19.2.3` nested inside
`apps/web/node_modules`, which resolution reaches first. `check-duplicate-deps.mjs`
already documents React DOM as a deliberate exclusion for exactly this reason. No
work follows from it, and the guard does not need to be louder on its account.

## Goals / Non-Goals

**Goals:**

- Fail within seconds of the mistake, on the machine where it was made.
- Say what happened, how to undo it, and where the command should have been run.
- Depend on nothing installed, so it runs before and during a broken install.

**Non-Goals:**

- Preventing the command. Expo will always accept a directory that has a
  `package.json`; nothing available here makes the root refuse. The target is
  *loud*, not *impossible*.
- Changing `.gitignore`. Decided with the user: the root `ios/` stays hidden from
  `git status`, and the check is what finds it.
- A root convenience script. See Decisions.

## Decisions

**A single script, run from three places.** `.github/scripts/check-root-prebuild.mjs`,
wired to a `check:root-prebuild` package script, called by root `preinstall`, by
`verify`, and by a step in CI's `workspace-health` job. This follows
`check-duplicate-deps.mjs`, whose header records why it stopped being shell inside
the workflow: CI could check it and a person could not. `comment:verify` in
`package.json` requires any new CI step to be in `verify` as well.

The script uses only `node:fs` and `node:path` — no dependencies, like
`check-cycles.mjs`, because it has to run when the dependency tree is exactly what
is broken.

**Three markers, all unambiguous at the root:**

| Marker | Why it is proof |
| --- | --- |
| `dependencies` in the root `package.json` | The root declares two devDependencies and nothing else. It is a workspace container; a runtime dependency here was put there by a tool. |
| `ios/` or `android/` at the root | Generated native output. Nothing generates these at the root on purpose, and `.gitignore` hides them. |
| `app.json` at the root | Written by `ensureConfigAsync` when it prompts for a bundle identifier. The root is not an Expo project and never has a config. |

Rejected as a marker: *the lockfile changed*. It is the loudest symptom and the
worst test — a lockfile legitimately changes whenever anyone touches a dependency,
so it cannot tell the two apart.

**`preinstall`, not `postinstall`.** Not for the reason first assumed — pnpm runs
it after resolution, so the lockfile is already rewritten either way. It is
`preinstall` because it is the hook that exists on the *failing* path: a
`postinstall` runs only once the install has succeeded, and an install that has
just linked the wrong dependency tree is exactly the one that should not be
allowed to finish.

**The failure message carries the recovery.** It prints the markers it found and
the exact commands:

```
git checkout -- package.json pnpm-lock.yaml
rm -rf ios android app.json
pnpm --filter mobile exec expo prebuild
```

`AGENTS.md` records the shape of this failure the way it records the others, since
the guard only fires once the mistake is made and the person still has to
understand what they are looking at.

**No root `prebuild` script.** Two reasons. It is not what the user chose. And a
root script named `prebuild` is a lifecycle hook: pnpm and npm run `prebuild`
before `build`, and the root already has `"build": "pnpm --filter web build"` — so
the convenience script would fire an Expo prebuild before every web build. A name
like `prebuild:mobile` dodges today's collision and lies in wait for the day
someone adds `build:mobile`. The failure message teaches the right command
instead, at the moment it is needed.

## Risks / Trade-offs

- **The install prompt can be declined.** Expo asks `Install the updated
  dependencies?`; answering no means no install, so the guard does not fire then.
  It fires at the next `pnpm install`, `pnpm verify`, or in CI — later than
  intended, still before anything merges, and the manifest and native folder are
  both still there to be found.
- **The guard fires after the damage, not before it.** Unavoidable: the template
  is written before the install, and pnpm rewrites the lockfile before it runs a
  root `preinstall`. Mitigated by the message listing every marker it found and
  the command that undoes each one.
- **A no-op install runs no guard.** `Already up to date` skips lifecycle scripts
  entirely, so `preinstall` cannot be relied on to notice a root `ios/` left
  behind by an earlier mistake. `verify` and CI are what notice that.
- **A false positive blocks installing.** If the root ever legitimately needs a
  runtime dependency, the guard fails every install until it is amended. Accepted:
  the root having a runtime dependency is itself already a violation of
  `monorepo-structure`'s rule about what may live at the root, so a future case
  should change that rule deliberately rather than slip past a check. The escape
  hatch if someone is stuck is `pnpm install --ignore-scripts`.
- **`preinstall` runs on every install, for everyone.** It reads three paths and
  parses one small JSON file, so the cost is a few milliseconds.
