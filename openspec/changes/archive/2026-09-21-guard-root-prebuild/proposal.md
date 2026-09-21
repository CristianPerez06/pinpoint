## Why

Nothing changes for the person using Pinpoint. This is about a mistake that has
been made twice while building it, and that left no trace either time.

Building the phone app involves a command, `expo prebuild`, that has to be run
from inside `apps/mobile`. Run it one directory up, at the top of the repository,
and Expo does not complain — it quietly decides the whole repository is the phone
app. It writes three things nobody asked for: it adds the app's own dependencies
to the repository's top-level manifest, it churns the lockfile that pins every
version in the project, and it generates a folder of iOS build files at the top
level with a blank white app icon. Meanwhile the thing you were trying to build —
`apps/mobile/ios` — is not touched at all, so nothing you wanted happened either.

The iOS folder is invisible: the repository already ignores every folder named
`ios/`, so it never shows up when you check what you have changed. The manifest
and lockfile edits do show up, but as an unexplained diff in whatever work
happens to be in progress. That is how it was found the second time — three
hours later, while reviewing something unrelated.

## What Changes

- A new check that fails, by name, when the top of the repository shows the marks
  of having been treated as an app: dependencies declared in the root manifest, or
  a generated `ios/` or `android/` folder sitting there.
- The check runs at three moments: whenever anyone installs dependencies, as part
  of `pnpm verify`, and in CI. The install hook is the one that matters — Expo
  installs packages as part of a prebuild, so the failure lands seconds after the
  mistake rather than hours later, and it says what happened and how to undo it.
- A note in `AGENTS.md`, which says nothing about prebuild today.

Not in this change, decided with the user:

- **The ignore rule stays as it is.** `ios/` keeps hiding the top-level folder
  from `git status`; the check is what finds it instead.
- **No convenience script at the root.** `expo prebuild` is run from
  `apps/mobile`, and the check's failure message says so.

The question the issue raised — whether the second copy of React DOM the prebuild
left behind actually breaks anything — is answered and needs no work. That copy is
Expo's own, it is present on a clean checkout with no prebuild anywhere near it,
and the web app resolves its own copy in preference. The existing duplicate-runtime
check already excludes React DOM on purpose, for this reason.

## Capabilities

### New Capabilities

<!-- None. -->

### Modified Capabilities

- `monorepo-structure`: the requirement covering automated checks gains the
  repository root itself as something that is checked — that it declares no
  application dependencies and holds no generated native build output — and
  requires that check to run when dependencies are installed, not only in CI.

## Impact

- New: `.github/scripts/check-root-prebuild.mjs`, and a test for it beside the
  other script tests.
- Changed: root `package.json` (a `preinstall` hook, a `check:root-prebuild`
  script, and the new step in `verify`), `.github/workflows/ci.yml`, `AGENTS.md`.
- No application code, no dependencies added, no cost.
