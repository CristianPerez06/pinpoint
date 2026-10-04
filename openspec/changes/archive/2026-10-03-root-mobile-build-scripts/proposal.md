## Why

Building the phone app for release takes a long EAS command typed from the right folder
(#266). Two root scripts for it already exist on one machine, uncommitted. Committing
them makes the release build one command, the same on every machine. They also run
`eas` from `apps/mobile` rather than the root, where running Expo tooling is how the root
manifest was rewritten twice (`AGENTS.md`).

## What Changes

- `pnpm build:android` and `pnpm build:ios` in the root `package.json`, each running
  `eas build --profile production` for its platform from `apps/mobile`.
- A one-line note beside them saying why they go through `--filter mobile exec`.

Nothing changes for anyone using the app.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None. Repo tooling only.

## Impact

- Root `package.json` only. `apps/mobile/eas.json` already defines the `production`
  profile, and `eas-cli` is already a dependency of the phone app.
