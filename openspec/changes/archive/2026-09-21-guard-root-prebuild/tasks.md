## 1. The check

- [x] 1.1 Write `.github/scripts/check-root-prebuild.mjs`: reads the root `package.json` and the root directory, fails when any of the three markers in `design.md` is present, and exits 0 otherwise. No imports beyond `node:fs`/`node:path`, so it runs before anything is installed. Verify by running `node .github/scripts/check-root-prebuild.mjs` on the clean tree and seeing it pass.
- [x] 1.2 Give it a header comment in the house style of `check-duplicate-deps.mjs` and `check-unarchived-change.mjs`: what it catches, that it has happened twice, why the lockfile is not a marker, and why it hooks `preinstall`. Verify by reading it beside those two — a person who has never seen the failure should understand it from the file alone.
- [x] 1.3 Make the failure message name each marker found and print the recovery commands from `design.md`, including `pnpm --filter mobile exec expo prebuild` as the right way to run it. Verify by temporarily pointing the script at a fixture root and reading the output.
- [x] 1.4 Write `.github/scripts/check-root-prebuild.test.mjs` with `node --test`, covering: a clean root passes; `dependencies` present fails; a root `ios/` fails; a root `app.json` fails; several at once are all reported. Follow `check-openspec-workflows.test.mjs` for how the existing tests take their input. Verify with `node --test .github/scripts/check-root-prebuild.test.mjs`.

## 2. Wiring

- [x] 2.1 Add `check:root-prebuild` to the root `package.json`, running the test then the script, as `check:icons` and `check:openspec-workflows` do. Verify with `pnpm check:root-prebuild`.
- [x] 2.2 Add `"preinstall": "node .github/scripts/check-root-prebuild.mjs"` to the root `package.json` — the script directly, not the `check:` script, so the guard does not depend on a test run inside every install. Verify that `pnpm install` still succeeds and prints the preinstall step.
- [x] 2.3 Add `pnpm check:root-prebuild` to `verify`, among the fast checks at the front. Verify the ordering claim in `comment:verify` still holds — it answers in milliseconds.
- [x] 2.4 Add the step to CI's `workspace-health` job in `.github/workflows/ci.yml`, with a comment saying why it exists, matching the commentary style of the steps around it.

## 3. Write it down

- [x] 3.1 Add a gotcha entry to `AGENTS.md` under "Gotchas that cost real time": that `expo prebuild` is run from `apps/mobile`, what running it at the root does, that `.gitignore`'s `ios/` hides the result, and that the guard is what finds it. State the shape of the failure the way the other entries do. Verify by reading it in place.

## 4. Prove it on the real thing

- [x] 4.1 On a clean tree, run `npx expo prebuild` from the repository root and confirm the guard fires at the install step and names the markers. Then run the recovery it printed — `git checkout -- package.json pnpm-lock.yaml`, `rm -rf ios android app.json`, `pnpm install` — and confirm `git status` is clean apart from this change's own files.
- [x] 4.2 From `apps/mobile`, confirm `pnpm exec expo prebuild` still works and writes `apps/mobile/ios`, with no guard in its way. **Not run as written, by decision:** a real prebuild regenerates `apps/mobile/ios` and can trigger a CocoaPods install, which `AGENTS.md` documents as expensive when it goes wrong, and the question it answers was already settled three cheaper ways — the check resolves its target from its own location so it only ever reads the repository root (`inspect('.')` → no problems); a test asserts `apps/mobile/ios` and `apps/mobile/android` are not markers; and `pnpm install` from `apps/mobile` passes the guard.
- [x] 4.3 Run `pnpm verify` and confirm it is green, and `pnpm check:duplicate-deps` still reports one `react` and one `react-native`.
- [x] 4.4 Run `openspec validate guard-root-prebuild --strict`.
