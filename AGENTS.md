# pinpoint

pnpm workspaces monorepo. Two apps — `apps/web` (Next.js App Router) and `apps/mobile`
(Expo) — over three shared packages.

The canonical rules live in `openspec/specs/`. This file is the short version an agent
needs before touching anything.

## Where code goes

- `apps/<name>/` — platform- or deployment-specific code. Routes, screens, middleware.
- `packages/<name>/` — code shared between apps, with no platform dependencies.
- **No product code at the repository root.** Repo automation belongs in
  `.github/scripts/`.

Apps depend on packages. Packages never depend on apps, and never on each other in a
cycle — `pnpm check:cycles` enforces both. One app never imports from the other; if
something in `apps/web/` turns out to be needed on mobile, **promote it to a package**
rather than copying it across.

## The portability boundary

`@pinpoint/map` **declares no runtime dependencies**, and that is load-bearing rather
than incidental. Web renders with `maplibre-gl` and native with
`@maplibre/maplibre-react-native` — different packages with similar APIs. A shared
package can import neither.

So map behaviour is expressed as **data and pure functions**: style references, camera
derivation, marker geometry. Each app binds that to its own renderer. If code you want
to add to `@pinpoint/map` needs a dependency, it almost certainly belongs in an app.

No package under `packages/` may import a renderer, a DOM API, or a native module.

## Configuration

Every value an app reads has a declared visibility, and each app has exactly one config
module (`apps/<name>/lib/config.ts`). **Nothing else reads `process.env`** — a direct
read at a call site skips validation and reintroduces the failure this prevents.

- `NEXT_PUBLIC_*` / `EXPO_PUBLIC_*` are **inlined into shipped bundles**. Anyone with
  the site or the installed app can read them. Only publishable values get the prefix.
- The Supabase **secret (service_role)** key bypasses row-level security entirely. It
  must never carry a public prefix, and must never be read from code that can reach a
  client bundle.
- Required values are validated at startup and fail naming the variable. Never write
  `process.env.X!` — the `!` defers a missing variable into an unrelated-looking error
  somewhere downstream.

`.env*` is ignored except `.env.example`, which is committed with shape-carrying
placeholders.

## Gotchas that cost real time

- **`nodeLinker: hoisted` lives in `pnpm-workspace.yaml`, not `.npmrc`.** pnpm 11 no
  longer reads settings from `.npmrc` and ignores them *silently* — the install comes
  out isolated and you end up debugging a Metro "Cannot find module" instead. Do not
  move it.
- **No tsconfig `paths` for workspace packages.** They resolve through the pnpm symlink
  plus the package `main` field. `paths` replaces rather than merges when a config
  extends a parent, so it has to be restated per app and rots out of sync. `paths` is
  for in-app `@/*` aliases only. If Metro ever needs help, add it to
  `apps/mobile/tsconfig.json` alone.
- **`transpilePackages` in `next.config.ts` must list every shared package.** They ship
  TypeScript source, so a missing entry fails at build time with an unhelpful parse
  error.
- **React and React Native are pinned to exact versions in both apps.** Two copies of
  either crash the bundle in ways that look unrelated to dependencies. CI fails on
  duplicates; upgrade both apps in the same change.

## Styling

Web and mobile share **token values**, not styling code. There is no cross-platform
styling runtime and adding one is rejected by default — see `openspec/specs/styling`
for the revisit conditions. No token package exists yet; the first shared colour
creates it.

## Attribution

Tiles come from OpenFreeMap over OpenStreetMap data. Visible attribution is required
wherever the map renders. MapLibre shows it by default and it can be removed without
warning — don't.

## Workflow

Planning artifacts live in `openspec/changes/<name>/`; `openspec/specs/` holds the
rules in force. Run `openspec validate <change> --strict` before considering a change
done.
