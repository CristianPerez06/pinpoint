### 🎯 What does this PR do?

<!-- Briefly: the change and its intent — not a recap of the files touched. -->

### 🔗 Ticket

<!-- Optional. Link the issue or task this came from. Delete this section if there is none. -->
<!-- An issue of this repo (`#26` or the full URL) moves itself to "Done" on the Project when the PR merges — see .github/workflows/ticket-to-done.yml. -->

Ticket:

### 🧩 Type of change

<!-- Mark the one that applies with an "x". -->

- [ ] 🐞 Bug fix
- [ ] 🧩 New feature
- [ ] ⚙️ Improvement / refactor
- [ ] 📄 Documentation
- [ ] 🔧 Config / CI
- [ ] 🗂️ OpenSpec (proposing or archiving a change)

### 📐 OpenSpec

<!-- Fill this in if the PR implements an OpenSpec change. Delete it if no specs are touched. -->

Change: `openspec/changes/<name>/`

- [ ] Every task in `tasks.md` is ticked, or the ones left are named below and say why
- [ ] The change is **archived on the branch** (moved to `openspec/changes/archive/YYYY-MM-DD-<name>/`)
- [ ] Deltas applied to the master specs — no `## ADDED/MODIFIED/REMOVED/RENAMED Requirements` sections left
- [ ] A real `Purpose` written for every new capability (no `TBD`)
- [ ] `AGENTS.md` updated if this completes or adds a module or a package
- [ ] `openspec/ROADMAP.md` updated — loose ends this change closed are **removed**, ones it opened are added

### 📸 Screenshots / videos

<!-- For UI changes, before/after or a short video. Cover every surface you touched, and both themes — light and dark are separate designs here, and a change that only looks right on one is the defect this repo has already shipped once. Delete if not applicable. -->

**Before:**

**After:**

### 🧪 How to test it

<!-- Steps to verify the change does what it claims. -->

1.
2.
3.

### ✅ Pre-merge checklist

#### Local validations (the same ones CI runs)

<!-- CI runs five jobs on every PR to `main`: Lint & typecheck, Package tests, Web production build, Workspace health, and OpenSpec validation. Run them locally before opening the PR. -->

- [ ] Lint passes for web and mobile (`pnpm lint` + `pnpm lint:mobile`)
- [ ] Typecheck passes for web and mobile (`pnpm typecheck` + `pnpm typecheck:mobile`)
- [ ] Package tests pass (`pnpm test`)
- [ ] Web production build passes (`pnpm build`)
- [ ] `pnpm check:cycles`, `pnpm check:tokens`, `pnpm check:fonts` and `pnpm check:specs` pass
- [ ] If I touched dependencies: `pnpm-lock.yaml` is updated and committed
- [ ] If I touched dependencies: `react` and `react-native` are not duplicated in the
      workspace. **No local script covers this** — only the Workspace health job, so a
      clean local run proves nothing. Check it yourself:
      `pnpm why react-native --json | jq -r '[.. | objects | select(has("version") and .name? == "react-native") | .version] | unique'`

#### Architecture and conventions

- [ ] No rendered markup shared between web and mobile — parity travels as data and pure functions in `packages/`, and each app draws it in its own idiom
- [ ] `packages/` imports no renderer, DOM API or native module; `@pinpoint/map` still declares no third-party runtime dependencies
- [ ] Colours and spacing come from `@pinpoint/tokens`, and `src/generated/` was regenerated rather than hand-edited
- [ ] Both themes are handled — no colour that only works on one ground
- [ ] Nothing outside `apps/<name>/lib/config.ts` reads `process.env`, and no secret carries a `NEXT_PUBLIC_`/`EXPO_PUBLIC_` prefix
- [ ] Map attribution is still visible wherever the map renders
- [ ] No product code at the repository root — automation lives in `.github/scripts/`

#### Branch hygiene

- [ ] Branch named `<feature|bugfix|hotfix|chore>/<kebab-case>`, no IDs or random suffixes
- [ ] Branch is up to date on `main` (`main` is linear — no merge commits)
- [ ] Merging with **Squash and merge**, PR title in conventional-commit form
      (`type(scope): subject`), and **the body left empty** — the title is what lands
      in `main`, so it is worth writing rather than labelling

### 💬 Notes for the reviewer

<!-- Trade-offs, open questions, anything that needs a closer look. Delete if not applicable. -->
