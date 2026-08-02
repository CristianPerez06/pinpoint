## 1. Workspace foundation

- [ ] 1.1 Create `pnpm-workspace.yaml` with `apps/*` and `packages/*`, `nodeLinker: hoisted`, and a comment recording that pnpm 11 ignores `.npmrc` settings and that an isolated install breaks Metro (design D3)
- [ ] 1.2 Create the root `package.json`: private, `packageManager` pinned to an exact pnpm version, scripts as thin `pnpm --filter <app> <script>` passthroughs for dev / build / lint / typecheck / test on both apps
- [ ] 1.3 Create `tsconfig.base.json` with shared `compilerOptions` only — strict, `noEmit`, bundler resolution, `jsx: react-jsx`. No `paths` for workspace packages (design D4)
- [ ] 1.4 Pin Node in `.nvmrc` and pnpm via `packageManager`, each in exactly one place (design D9)
- [ ] 1.5 Update `.gitignore` for a pnpm + Next + Expo workspace: `node_modules`, `.next`, `.expo`, `*.tsbuildinfo`, and `.env*` with an explicit `!.env.example` un-ignore
- [ ] 1.6 Verify the ignore rule with `git check-ignore` for `.env`, `.env.local`, `.env.production`, and the same under each app; confirm `.env.example` is **not** ignored (design D8 — this is the exact hole found in grana-v3)

## 2. Shared packages

- [ ] 2.1 Create `packages/map` — `@pinpoint/map`, private, `main`/`types`/`exports` all `./src/index.ts`, **empty `dependencies`**
- [ ] 2.2 Implement in `packages/map`: the OpenFreeMap style JSON reference, a pure `fitBounds(markers) -> { center, zoom }` camera derivation, and shared map constants. No renderer import, no DOM API, no React
- [ ] 2.3 Add Vitest to `packages/map` and cover `fitBounds` — empty input, single marker, multiple markers, antimeridian-adjacent coordinates
- [ ] 2.4 Create `packages/core` — `@pinpoint/core`, source-only, exporting domain types (`Trip`, `Marker`) and zod schemas for them (design D6)
- [ ] 2.5 Create `packages/supabase` — `@pinpoint/supabase`, source-only, depending only on `@supabase/supabase-js`. Export a client factory parameterised by credentials and storage adapter; no platform-specific session handling
- [ ] 2.6 Verify no package under `packages/` imports a renderer, a DOM API, a native module, or anything under `apps/` (spec: portability boundary, dependency direction)

## 3. Web application

- [ ] 3.1 Scaffold `apps/web` as a Next.js App Router application named `web`, React pinned to an exact version (design, Open Questions)
- [ ] 3.2 Add the three shared packages as `workspace:*` dependencies and list **all three** in `transpilePackages` in `next.config.ts` (design D2)
- [ ] 3.3 Create `apps/web/tsconfig.json` extending `tsconfig.base.json`, with `paths` for the in-app `@/*` alias only
- [ ] 3.4 Add a single config module that validates every required variable at startup and fails naming the missing one. No other module reads `process.env` directly (design D8)
- [ ] 3.5 Commit `apps/web/.env.example` listing every required variable with shape-carrying placeholders, not blanks
- [ ] 3.6 Render a single page that imports `@pinpoint/map` and displays the `fitBounds` result as text. No map renderer, no styling
- [ ] 3.7 Confirm `pnpm --filter web lint`, `typecheck`, and `build` pass
- [ ] 3.8 Verify the config guard: unset a required variable, confirm startup fails with a message naming it

## 4. Mobile shell

- [ ] 4.1 Scaffold `apps/mobile` as an Expo application named `mobile` with expo-router, React pinned to the same exact version as web (spec: single runtime version)
- [ ] 4.2 Configure `apps/mobile/metro.config.js`: `watchFolders` including the workspace root, and `nodeModulesPaths` covering both the app and root `node_modules`
- [ ] 4.3 Create `apps/mobile/tsconfig.json` extending `tsconfig.base.json` then `expo/tsconfig.base`
- [ ] 4.4 Add a single config module mirroring web's, validating every required variable at startup; commit `apps/mobile/.env.example` with shape-carrying placeholders (design D8)
- [ ] 4.5 Render one screen that imports `@pinpoint/map` and displays the `fitBounds` result as text — the walking skeleton (design D5). No styling library, no map renderer, no native module; must run under Expo Go
- [ ] 4.6 Confirm `pnpm --filter mobile lint` and `typecheck` pass, and that the app boots and displays the derived value
- [ ] 4.7 Verify the skeleton fails as intended: temporarily break workspace resolution and confirm the mobile typecheck fails, then restore

## 5. Continuous integration

- [ ] 5.1 Create `.github/workflows/ci.yml` running on pull requests to `main` and pushes to `main`, with in-progress cancellation for pull requests only. Every job resolves Node via `node-version-file: .nvmrc` — no literal version anywhere in the workflow (design D9)
- [ ] 5.2 Add a lint and typecheck job covering both applications
- [ ] 5.3 Add a web production build job using placeholder configuration values, contacting no external service (spec: no credentials in CI)
- [ ] 5.4 Add a test job running the shared packages' tests
- [ ] 5.5 Add a workspace health job: `pnpm install --frozen-lockfile` for lockfile freshness, plus a gate failing when more than one version of `react` or `react-native` is installed, with a message naming the dependency and the versions found (design, spec: single runtime version)
- [ ] 5.6 Add a dependency-cycle gate to the same job — read every workspace manifest, build the graph from internal dependencies, fail on a back edge and print the cycle. No third-party dependency (design D6)
- [ ] 5.7 Verify the cycle gate: introduce a deliberate cycle between two packages, confirm CI fails and names it, then revert
- [ ] 5.8 Confirm every job passes on a branch before merging

## 6. Documentation

- [ ] 6.1 Update `README.md` — replace "Nothing built yet" with the workspace layout, prerequisites (pinned Node and pnpm), configuration setup from the example files, and how to run each application
- [ ] 6.2 Extend `AGENTS.md` beyond its one-line description: the `apps/` vs `packages/` split, no product code at the repo root, dependency direction and acyclicity, the zero-dependency rule for `@pinpoint/map`, the publishable-vs-secret configuration rule, the no-`paths`-for-workspace-packages rule, and the `nodeLinker: hoisted` warning
- [ ] 6.3 Confirm no styling library, token package, map renderer, or Supabase migrations directory was introduced (proposal: Impact — deferred)
- [ ] 6.4 Confirm no tracked file contains a real credential, and that no secret-class value carries a bundler-public prefix in either application
