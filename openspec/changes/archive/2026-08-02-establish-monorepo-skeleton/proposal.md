## Why

Pinpoint has a README and an OpenSpec setup, and no code. Before any product work can start, the repo needs a workspace layout that supports the constraint already written into the project context: the map layer must **port** to mobile rather than be rewritten. That constraint is only real if it is enforced by the build from the first commit — a boundary that exists on paper gets crossed within a week.

## What Changes

- Establish a pnpm workspaces monorepo: `apps/*` + `packages/*`, no build orchestrator.
- Add `apps/web` — a Next.js App Router application, no product features.
- Add `apps/mobile` — an Expo shell that **imports a shared package and renders its output**, proving Metro can resolve workspace TypeScript source. Not a blank placeholder.
- Add three shared packages, consumed as TypeScript source with no build step:
  - `@pinpoint/map` — map style JSON and pure camera/marker logic. Zero dependencies.
  - `@pinpoint/core` — domain types and validation.
  - `@pinpoint/supabase` — Supabase client and generated database types.
- Establish a configuration contract: every value declares whether it is publishable or secret, only publishable values get a bundler-public prefix, real config files are untracked across every variant filename, and missing values fail at startup naming the variable.
- Pin the Node.js and package-manager versions in the repository, in one place each, and have CI consume those pins rather than restating them.
- Add CI: lint, typecheck (both apps), web build, package tests, lockfile freshness, a duplicate-`react`/`react-native` gate, and a dependency-cycle gate.
- Record the styling strategy as a specification **without implementing it**: design tokens shared as data, platform-native styling code, no cross-platform styling runtime. No token package is created by this change — there is no UI to style yet.

No product behavior ships. This is the foundation everything else is built on.

## Capabilities

### New Capabilities

- `monorepo-structure`: The workspace layout, the shape of the dependency graph, the portability boundary shared packages must respect, how both apps resolve shared code, the configuration and toolchain contracts, and the automated gates that keep those properties true.
- `styling`: How visual styling is shared between web and mobile — single source of truth for design tokens, resolved literal values, and platform-native styling code. Recorded now, built when the first shared colour exists.

### Modified Capabilities

None. This is the first change in the repo; `openspec/specs/` is empty.

## Impact

- **New files**: `pnpm-workspace.yaml`, root `package.json`, `tsconfig.base.json`, `.nvmrc`, `.github/workflows/ci.yml`, `apps/web/**`, `apps/mobile/**`, `packages/{map,core,supabase}/**`, an example configuration file per application.
- **New dependencies**: Next.js + React (web), Expo + React Native + expo-router (mobile), `@supabase/supabase-js`, Vitest. All free, no signup, no metered service.
- **Deferred deliberately**: NativeWind and any shared styling runtime; `maplibre-gl` and `@maplibre/maplibre-react-native`; a Supabase migrations directory and CLI linking; an Expo dev build with native directories. Each is introduced by the change that first needs it.
- **AGENTS.md** already describes this layout. This change makes the description true.
