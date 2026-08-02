## Context

See `proposal.md` — Why. Constraints that shape the approach:

- No code exists. Nothing is inherited, and nothing has to be migrated.
- The project context requires the map layer to port to mobile rather than be rewritten. This change is where that becomes structural instead of aspirational.
- `AGENTS.md` already declares a pnpm workspaces monorepo with `apps/web` and `apps/mobile`. This change makes that description true.
- **Prior art**: `grana-v3` (sibling repository, same author) runs this exact shape in production — pnpm workspaces, source-only packages, Next + Expo, no build orchestrator. Several decisions below are taken from it, and two are taken deliberately *against* it. Where that repo carries scar tissue, the comment blocks in its `pnpm-workspace.yaml` and `packages/ui-tokens/README.md` are the primary sources.

## Goals / Non-Goals

**Goals:**

- A workspace where the portability boundary is enforced by tooling, not by memory.
- The smallest structure that supports two applications and shared code, with no build orchestrator.
- Mobile scaffolding that produces real evidence rather than a placeholder.
- Styling strategy decided and written down before any UI exists, so it is not settled by accident.

**Non-Goals:**

- Any product behavior. No markers, no map rendering, no authentication, no database schema.
- A design system, a component library, or shared tokens.
- An Expo dev build, native project directories, or EAS configuration.
- Optimising install time or CI wall-clock. At this size neither is a problem worth structure.

## Decisions

### D1 — pnpm workspaces, no build orchestrator

Turborepo/Nx solve task scheduling and caching across many buildable packages. With three source-only packages and two applications there are no cross-package builds to schedule. Root scripts are thin `pnpm --filter <app> <script>` passthroughs, which keeps "what actually runs" readable from the root manifest.

*Alternative considered*: Turborepo now, to avoid adding it later. Rejected — adding it later is a `turbo.json` and a script rewrite. Adding it now is indirection over a graph that does not exist.

### D2 — Packages expose TypeScript source, with no build step

Each package sets `main`, `types`, and `exports` to `./src/index.ts`. Applications transpile. Next needs the packages listed in `transpilePackages`; Metro handles workspace source natively.

This removes an entire category of problem: no `dist/` staleness, no watch-mode build chain, no dual ESM/CJS output, no source-map indirection.

*Cost*: every consumer must be able to transpile TypeScript. Both bundlers can. A future non-bundled consumer — a Node script, an edge function — would need `tsx` or its own transpile step. Acceptable; none is planned.

*Note*: `transpilePackages` must list **every** shared package. In `grana-v3` this list names 6 of 14 and has silently drifted. With three packages, keep it complete.

### D3 — `nodeLinker: hoisted`, declared in `pnpm-workspace.yaml`

Expo and React Native require a flat, npm-style `node_modules`. Several React Native libraries resolve sibling packages with bare `require()` at Metro-config load time, which pnpm's default isolated linker breaks.

The non-obvious part is **where the setting goes**. pnpm 11 no longer reads settings from `.npmrc`; they live in `pnpm-workspace.yaml`. Putting it in `.npmrc` produces no error — the setting is silently ignored, the install comes out isolated, and the failure surfaces later as an unrelated-looking Metro resolution error. Carry a comment saying so.

*Alternative considered*: start `isolated` (stricter, catches phantom dependencies) and switch to `hoisted` when mobile arrives. Rejected because mobile arrives in this change. Worth recording that the direction matters: `isolated → hoisted` is safe, `hoisted → isolated` surfaces every accumulated phantom dependency at once. Having chosen hoisted on day one, that door is closed.

### D4 — No tsconfig `paths` for workspace packages

Workspace packages resolve through the symlink pnpm creates in `node_modules` plus the package's `main` field. `paths` entries are redundant with that.

They are also actively harmful over time. `paths` **replaces** rather than merges when a child config extends a parent, and each application re-anchors `baseUrl` to its own directory — so the mapping has to be rewritten in every application config. In `grana-v3` the result is the same list triplicated across three files, covering 6 of 14 packages, with the base copy dead. The 8 unlisted packages resolve correctly regardless, which is the proof that none of the entries were needed.

`paths` is still used for in-application aliases (`@/*`). If Metro's resolver turns out to need help, add `paths` to `apps/mobile/tsconfig.json` **only** — never duplicated across configs.

### D5 — The mobile shell is a walking skeleton, not a placeholder

Three options were weighed: a blank app that imports nothing; a shell that imports `@pinpoint/map` and renders a derived value as text; a real map via `@maplibre/maplibre-react-native`.

The blank app proves only that `pnpm install` succeeded, and rots silently — workspace wiring would break unnoticed for months. The real map needs a dev build, `expo prebuild`, native directories, and an actual map decision; that is a different change.

The middle option costs roughly the same as the blank app, stays inside Expo Go, and is the only one that validates the thing this change exists to establish: that a source-only TypeScript package resolves and transpiles through Metro. It also gives `pnpm --filter mobile typecheck` something true to assert.

### D6 — Three packages: `map`, `core`, `supabase`

- `@pinpoint/map` — style JSON, camera derivation, marker geometry. **Zero runtime dependencies**, which is the load-bearing constraint: it cannot import a renderer if it imports nothing.
- `@pinpoint/core` — domain types and validation. Validation via **zod**, chosen over yup for first-class type inference; `grana-v3` uses yup for form-library reasons that do not apply here.
- `@pinpoint/supabase` — depends only on `@supabase/supabase-js`, the isomorphic client. Each application owns its own session persistence: cookie-based on web, secure-storage-based on native. Platform-specific Supabase adapters stay in the applications.

*Alternative considered*: one package, split on pain. Rejected because `map` having zero dependencies is a constraint that must be visible from the start; discovering it after the fact means untangling.

*On enforcing the graph*: `grana-v3` has 14 packages, zero cycles, and a clean 7-layer structure — achieved entirely by care, with no check of any kind. That is a good outcome and an unreliable mechanism; it holds until the one time it doesn't, by which point the untangling is expensive. The gate is cheap to write at three packages: read every workspace manifest, build the graph from the internal dependencies, depth-first search for a back edge. No third-party dependency needed.

### D8 — Configuration values declare visibility, and are validated at startup

Both bundlers inline publicly-prefixed variables into the artifacts they emit — into the deployed site on web, into the installed binary on native. A publicly-prefixed value is therefore not "configuration," it is published content. The Supabase publishable key is designed for that and is protected by row-level security; the secret key bypasses row-level security entirely and would grant full database access to anyone who opened the bundle. The distinction has to be a declared property of each variable, not something a contributor re-derives from the prefix each time.

Two failure modes taken directly from `grana-v3`:

**The ignore pattern must cover variants.** Its root `.gitignore` contains a bare `.env`, and `apps/web` has no `.gitignore` of its own. Verified with `git check-ignore`: `.env.local`, `apps/web/.env.local`, and `apps/web/.env.production` are all **not ignored**. `.env.local` is the conventional Next.js local-override filename. Use `.env*` with an explicit `!.env.example` un-ignore rather than enumerating base names.

**Never assert presence without checking it.** `grana-v3` reads configuration at eight sites, all as `process.env.NEXT_PUBLIC_SUPABASE_URL!`. The `!` silences the compiler without checking anything, so a missing variable becomes `undefined` passed into a client constructor, and the failure surfaces later as a malformed URL or an authentication error — never as the name of the variable that is missing. A single validated config module per application, read once at startup, removes the whole class.

Its example files also differ in quality: web's carries shaped placeholders (`sb_publishable_AN_ID_HERE-XXXXX`), mobile's are empty strings. Shaped placeholders teach the format and make a wrong-key paste obvious. Do that for both.

### D9 — Node and pnpm pinned in the repository, consumed by CI

`packageManager` in the root manifest pins pnpm exactly. Node is pinned in `.nvmrc`, and CI reads it with `node-version-file` rather than restating a literal.

`grana-v3` pins pnpm this way but does not pin Node at all: the version exists only as `node-version: '24'`, written out in four separate CI jobs. Nothing constrains a contributor's local runtime, the four values drift independently, and a local/CI mismatch shows up as an unrelated-looking failure. One pin, one file, read by everything.

### D7 — Styling: share token values, not styling code

Recorded in `specs/styling/spec.md`. Rationale for the choice among three levels of sharing:

| | Share tokens | Share class names | Share components |
|---|---|---|---|
| Visual consistency | yes | yes | yes |
| Styling code | per platform | shared | shared |
| Coupling | none | both apps pinned to one styling toolchain version | both apps pinned to one component runtime |
| Fit here | four surfaces | dozens of screens | dozens of screens |

Sharing tokens is not a bet against sharing class names — it is the first half of it. Adding a cross-platform styling runtime later points its configuration at the same token object; the token package does not change. The reverse is not true.

Two facts specific to this product carry the decision. First, the dominant pixel area is the map, styled by style JSON and never touched by application styling. Second, the non-map interface is roughly four surfaces — a marker sheet, an add-marker form, a share dialog, and map chrome. Hand-writing native styles at that scale is cheaper than any bridge.

**On derivation direction.** If web consumes tokens through a CSS-first toolchain, the values must exist as CSS somewhere, so one generated file is unavoidable. It must be generated *from* the neutral data, not recovered *from* the stylesheet. `grana-v3` runs it the other way — `theme.css` parsed by regex into `tokens.cjs` — and pays for it three times: `/:root\s*\{([^}]+)\}/` truncates at the first `}`, regeneration is manual with nothing detecting staleness, and values that are `var()` references pass through uninterpreted to React Native, rendering views transparent. That last one required a five-row translation table and a standing rule in the package README. Serialising an object cannot fail those ways; the failure class is removed by construction, not avoided by discipline.

**Revisit conditions.** The spec rejects a cross-platform styling runtime by default. Any of these is grounds to reopen it, and a proposal doing so must name which:

1. Mobile grows past roughly eight surfaces with substantial non-map chrome.
2. The web application adopts a component library built on semantic CSS-variable aliases, *and* visual parity with mobile is required — the alias indirection is then already present, and a shared runtime at least makes it uniform.
3. A cross-platform styling runtime ships stable support for the same major version of the underlying CSS toolchain the web application uses. That collapses the cost to a single shared stylesheet with no derivation step at all, and materially changes the calculus.

### D10 — What is deliberately deferred

| Deferred | Introduced by |
|---|---|
| `maplibre-gl`, `@maplibre/maplibre-react-native` | the first change that renders a map |
| Expo dev build, `expo prebuild`, native directories, EAS | the first change needing a native module |
| Shared token package, any styling runtime | the first shared colour (see `specs/styling/spec.md`) |
| `supabase/` migrations directory, Supabase CLI linking | the first change defining a schema |
| Storybook, component testing | the first shared component |

Each is a real cost — a dependency, a configuration surface, a thing to keep current — with no corresponding benefit until its trigger arrives.

## Risks / Trade-offs

- **Metro's resolver is fussier than tsc's, and D4 removes a crutch.** → D5 is the mitigation: the walking skeleton surfaces this during this change rather than months later. If it bites, the fix is bounded and stated in D4.
- **`hoisted` hides phantom dependencies** — a package can import something it does not declare, and it resolves anyway. → Accepted; unavoidable given Expo. Partly offset by keeping package manifests explicit and few. Note that D3 closes the door on tightening this later.
- **Zero-dependency `map` is a discipline constraint, not a mechanical one.** Nothing stops a contributor adding a dependency. → The spec states it and requires explicit justification; a manifest with an empty `dependencies` block makes a violation visible in review.
- **Deferring the dev build means the port thesis is not fully proven.** The skeleton proves workspace resolution through Metro, not that map style JSON renders identically on native. → Accepted. Proving it requires a dev build and a real map, which is a separate change; the boundary in `specs/monorepo-structure/spec.md` is what keeps that change from becoming a rewrite.
- **Writing the styling spec before any UI risks specifying the wrong thing.** → Mitigated by scope: the spec constrains *how* tokens are shared and forbids one specific coupling. It does not specify a palette, a scale, or a component. D7's revisit conditions are the escape hatch.
- **Startup validation can be bypassed by reading `process.env` directly at a call site.** The config module only helps if it is the single entry point. → Keep exactly one config module per application, have every consumer import from it, and treat a direct `process.env` read outside it as a review failure. A lint rule can enforce this later if it proves necessary.
- **The cycle gate is custom code, so it is one more thing that can be wrong.** → Keep it to a few dozen lines with no dependency, and validate it during this change by introducing a deliberate cycle and confirming the gate fails.
- **`.nvmrc` pins Node but does not install it.** A contributor without a version manager is unaffected by the pin. → Accepted; the pin still makes the intended version discoverable and keeps CI honest. `README.md` states the prerequisite.

## Open Questions

- Exact React version to pin. Determined at implementation time by whatever the chosen Next and Expo versions both accept. Does not affect the specs or the task breakdown.
- Whether the current release of any cross-platform styling runtime already supports the web application's CSS toolchain major version. Relevant only if revisit condition 3 in D7 is invoked; the decision recorded here stands either way.
