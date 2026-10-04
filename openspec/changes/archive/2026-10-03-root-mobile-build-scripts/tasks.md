## 1. Scripts

- [x] 1.1 Commit `build:android` and `build:ios` in the root `package.json`, with a `comment:` entry on why they run through `--filter mobile exec`. Verify `pnpm --filter mobile exec eas build --help` prints EAS's build help and `git status` shows nothing new afterwards

## 2. Done

- [x] 2.1 Run `openspec validate root-mobile-build-scripts --strict` and `pnpm verify`, and both pass
