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
- **MapLibre's tile worker cannot find itself under a bundler.** `maplibre-gl` v6 parses
  tiles in a module worker whose URL it derives from its own `import.meta.url`.
  Turbopack emits that worker as a content-hashed asset under `/_next/static/media/`
  while the library asks for it beside its own chunk, so the request 404s. Fixed by
  copying it into `public/maplibre/` (`apps/web/scripts/copy-maplibre-worker.mjs`, run
  from `dev` and `build`) and calling `setWorkerUrl` with a literal path. **Learn the
  shape of this failure**: the main thread still owns the camera and mounts markers as
  DOM, so pins appear in exactly the right places over a blank canvas. It reads as a
  CSS problem and never is. The only clue is one console line about a module script
  with a `text/html` MIME type.
- **`maplibre-gl` v6 has no default export.** `import maplibregl from 'maplibre-gl'`,
  which is what most published examples still show, is v4 advice and fails to
  typecheck. Use named imports; alias `Map` and `Marker`, which collide with the global
  and with our own domain type.
- **Building the mobile app needs Xcode 26 or newer, plus a separate platform
  download.** Expo SDK 57 builds `expo-modules-jsi` from source through SwiftPM, and
  its `Package.swift` declares `swift-tools-version: 6.2` — which ships with Xcode 26,
  not 16.x. Xcode 26 then installs *without* the iOS platform bundle: `xcodebuild
  -downloadPlatform iOS` (or Settings → Components), or every destination is
  ineligible. After a major Xcode upgrade the licence must be re-accepted for the new
  version (`sudo xcodebuild -license accept`); until it is, `xcrun` exits 69, `pod`
  refuses, and Expo misreads that as a broken CocoaPods and tries to reinstall it. All
  three symptoms are one cause.
- **Xcode 26.2 is a hole in that floor — it cannot build this app.** Its SDK's libc++
  `stdlib.h` declares `abs` for `float`/`double`/`long double` in the global namespace,
  and `expo-modules-jsi` compiles with C++ interop on, so Swift sees them beside its own
  generic `abs` and calls the expression ambiguous — inside a package nobody here wrote,
  on a line that is correct. 26.6 (Swift 6.3.3) is fine. Verify a toolchain in one line
  rather than by version number: `swiftc -typecheck -cxx-interoperability-mode=default`
  over `func f(_ ms: Double) { let e: Double = abs(ms); _ = e }`. **The wider lesson is
  about the cache**: that module is built once into an xcframework, keyed on a hash of
  its sources, `RN_ROOT` and the toolchain version, so a machine holding a valid slice
  never compiles the file and never meets the bug. "It builds on the other laptop" is
  evidence about a cache, not about a toolchain. Anything that moves `RN_ROOT` — a
  second React Native, a worktree — re-exposes whatever the slice was hiding.
- **A write that cannot resolve to an existing membership goes through a
  `SECURITY DEFINER` function, not a widened policy.** Creating a trip is the only
  such case: the membership an insert policy would resolve to is the one being
  created. `public.create_trip()` writes the trip and the creator's membership in
  one block, takes the account from `auth.jwt()` rather than from an argument, and
  is the reason `trips` has no insert policy at all. Doing it as two client
  statements leaves a trip with no members if the second fails — unreachable by
  every select policy and unremovable, since there is no delete policy either.
- **`is_trip_member` is `SECURITY DEFINER` so that policies on `trip_members` can
  consult `trip_members`.** Without it the insert policy added for inviting would
  re-enter its own policy and recurse. The initial schema says this about the
  select policy; it applies to every policy on that table, and it is why the
  invite policy is a one-liner rather than a problem.
- **Centring the camera on a point is how to hide it, once anything covers the map.**
  A map with a sheet over its lower half is not being looked at whole, so the middle
  of the *view* — which is what `center` means to both renderers — is behind the
  sheet. Centring on a place therefore puts it exactly where it cannot be seen. Use
  `offsetCenter` from `@pinpoint/map` to shift the centre by half the covered height;
  do **not** reach for MapLibre's camera `padding`, which persists in the camera state
  and then changes what `center` reports, which is the one thing the mobile drop
  sight depends on being geometrically true. **Learn the shape of this one**: the
  camera animates, something visibly happens, and the pin is simply not there — it
  reads as the marker failing to render and never is.
- **A `ScrollView` inside a content-sized container collapses.** React Native's
  `ScrollView` has no intrinsic content height, so a parent that sizes to its children —
  a sheet pinned to the bottom with `maxHeight` and no fixed height, say — asks how tall
  it is and is told almost nothing. The parent closes up and everything past the first
  row is clipped. **Learn the shape of this one too**: the children render perfectly and
  are simply given nowhere to draw, so it reads as a data problem and never is. Either
  give the container a definite height or do not scroll. Note the actual condition:
  a container sizing to its *children*. A sheet whose height is a fraction of the
  window is definite and does not have this problem — reading the rule more broadly
  than it says is how the capture form was first built as a full screen when it
  should have been a sheet.
- **`KeyboardAvoidingView` overwrites the `paddingBottom` you give it.** With
  `behavior="padding"` it renders `StyleSheet.compose(style, { paddingBottom:
  bottomHeight })`, and `bottomHeight` is 0 whenever the keyboard is down — so a sheet
  that hands it the surface's own style loses that padding on almost every render.
  **Learn the shape of this one**: the padding is declared, is correct, and is identical
  to the sheets that look right, so comparing the styles finds nothing and it reads as a
  value someone set differently here. Three sheets sat on the bottom of the screen for
  as long as they existed. Keep the `KeyboardAvoidingView` a bare positioner and put the
  surface — background, radius, `maxHeight`, padding, and the press-swallowing responder
  — on a `View` inside it. Move `maxHeight` with the surface, or the fix walks straight
  into the entry above.
- **`lineHeight` on a `TextInput` pushes the text down inside it.** React Native gives
  iOS `paragraphStyle.minimumLineHeight = maximumLineHeight` (`RCTTextAttributes.mm`),
  and a line box forced taller than the font asks for grows upward from the baseline —
  so glyphs sit low in a field whose height comes from its own padding. An empty field
  looks right, which is why this survived: it only appears once somebody types. Use
  `fieldRole` rather than `role` for anything typed into; it is the same role with that
  one property withheld. A field has no paragraph.
- **A composite foreign key needs `on delete set null (column_list)`.** A bare `on delete
  set null` nulls *every* referencing column, so `(city_id, trip_id) references cities
  (id, trip_id)` would also null `markers.trip_id` — which is `not null`, making the
  delete fail outright rather than unassigning anything. The column-list form is
  Postgres 15+; this database is 17.
- **Verify database behaviour with a rolled-back probe, not by reasoning.** A `do $$ …
  raise exception 'RESULT: %', … $$` block does the work, reports through the error
  message, and rolls back everything it touched. That is how the constraint above was
  caught doing the right thing on real data instead of being assumed to.
- **Two tokens can be the same value on one theme, and a composition that pairs
  them is invisible there.** `accentInk` and `accent` are different on the light
  ground and **identical** on the dark one — the pair converges deliberately, because
  once the bright amber is already the readable one there is nothing to take down. So
  `Clear`, which fills with `accent` on hover and kept its `accentInk` lettering,
  painted `#F0AE4A` on `#F0AE4A` and the word vanished under the pointer on exactly
  one theme. **Learn the shape of this one**: at 1:1 the text is not thin, it is
  absent, so it reads as the label failing to render and never is. Neither token was
  wrong and no rule about choosing values against a ground was broken — the failing
  text was drawn on a *fill*. Anything that fills with a themed colour letters itself
  in the same rule; text on the accent is `inkOnAccent`.
- **Two flex defaults quietly decide how wide a control in the bar is, and neither
  is the one you wrote.** A flex item with a `min-width` floor does not wrap when it
  runs out of room — it **overflows** its container, so `min-width: 200px` on the
  search wrapper drew the field underneath the drop button from about 1080px down.
  And a flex container sized `flex: 0 1 auto` takes its width from its content, where
  an `<input>`'s content width is the browser's twenty-character default of roughly
  167px regardless of any `width: 100%` on it — so the row holding search sized itself
  to 167px and the field's own `flex-basis` was never reached at any viewport from
  900px to 2560px. **Learn the shape of both**: neither throws, neither logs, and both
  produce a layout that looks deliberate — one control simply sits on top of another,
  or a field is inexplicably the same size on a laptop and a 5K display. Measure the
  computed width of the item *and* of its container before believing either.

- **A token described by how it should feel gets used past the contrast floor.**
  `inkFaint` said "placeholders, and text that is deliberately hard to notice" and
  ended up carrying every uppercase label, every placeholder and every dismiss glyph
  on both platforms, at 2.78:1 and 4.02:1. Every one of those was a correct reading of
  the sentence. Describe a colour token by what it may be used *for*, not by the
  impression it should leave, or the description licenses the defect and every reviewer
  after that sees intent.

- **Two states that have never co-occurred get depended on silently, and the first
  thing that makes them co-occur breaks code that reads correctly.** Selecting a
  marker by pointing at it necessarily puts it in view, so an open details card and
  "N places match, none of them in view" could not both be true — and two separate
  pieces of code quietly relied on that, neither of them saying so. Drawing one pin
  outside the filtered set, so a card could open on a place the filter hides, made
  the pair possible for the first time: the notice appeared beside the place that had
  just been found and its `Show it` framed the filter's matches, a *different* place,
  one click from the one being read. Nothing was wrong with the notice's condition or
  with `anyInView`; the condition had always meant "there is nothing on the map to
  look at" and `!anyInView` had always been the same thing as that, until it wasn't.
  **Learn the shape of this one**: every part reads correctly in isolation, the diff
  that breaks it does not touch either part, and no type or test can see it because
  the invariant was never written down. Before drawing anything outside a set that
  something else counts, go and find what reads that count.

- **A type predicate on a zod `refine` narrows the inferred type through every
  consumer of the schema.** `markerTypeSchema` is `z.string().refine(isMarkerType)`,
  and changing `isMarkerType` from `(id: string): boolean` to `(id: string): id is
  MarkerType` silently retyped `Marker.type` from `string` to the union — which broke
  the data layer, where a row's type is deliberately *not* validated because the
  column is unconstrained text and a value written by an older build must still
  render. The error surfaced in `packages/data/src/markers.ts`, three packages away
  from the edit, and named neither zod nor the predicate. **Learn the shape of this
  one**: the change was a strictly-more-precise signature, which is the kind of edit
  nobody expects to break anything, and the failure appears somewhere that does not
  mention the thing that caused it. Reads and writes want different strictness here
  on purpose — `isMarkerType` answers "may this be written", `markerTypeOf` answers
  "what does this stored value mean" — so keep the predicate off the one the schema
  refines on.

- **A `MODIFIED` spec delta deletes every sentence you do not carry forward.** The
  delta replaces the whole requirement at archive time, so a paragraph left out is
  removed from the specification silently and the diff looks like the change you
  meant. Rewriting *A place is filed under a city chosen as it is saved* nearly took
  out "Every application SHALL offer a way to select the city being worked on" — which
  exists in that requirement and nowhere else, so archiving would have dropped the
  obligation to have a city selector at all, in a change about defaults. Rewrite a
  requirement by editing a full copy of it, and grep the specifications for any
  sentence you drop to check it is stated somewhere else.

- **"It is a different kind of thing, so it must cover a different amount" is a
  category argument, and the constants are right there.** The match branch on the
  phone passed no camera inset, reasoning that a details sheet is not the capture form
  and does not take as much of the map. The form opens at `DETENTS[0] = 0.52` of the
  window and the details sheet is capped at `SHEET_CAP = 0.5`: the same thing at every
  size that matters. The sheet sat on top of the pin. Two greps would have settled it
  before the argument was written down. Where something covering the map is involved,
  read the number rather than reasoning from what the thing is.

## Styling

Web and mobile share **token values**, not styling code. There is no cross-platform
styling runtime and adding one is rejected by default — see `openspec/specs/styling`
for the revisit conditions.

The values live in `@pinpoint/tokens`. Every colour is declared once as a
`{ light, dark }` pair and derived by `packages/tokens/scripts/derive.ts` into two
representations: custom properties for web, literals for native. **Edit the source
modules, never `src/generated/`** — `pnpm check:tokens` regenerates and fails CI on
the diff. A value the host resolves (`var()`, `color-mix()`, `currentColor`) is
rejected by the script, because native cannot render it.

## Attribution

Tiles come from OpenFreeMap over OpenStreetMap data. Visible attribution is required
wherever the map renders. MapLibre shows it by default and it can be removed without
warning — don't.

## Workflow

Planning artifacts live in `openspec/changes/<name>/`; `openspec/specs/` holds the
rules in force. Run `openspec validate <change> --strict` before considering a change
done.

## Merging to `main`

**Squash and merge, one commit per pull request.** `main` keeps a linear history with
no merge commits, so each unit of work is a single commit that can be read, reverted
or bisected on its own.

The squash commit's subject is the pull request title in conventional-commit form —
`type(scope): subject` — and the body is left empty. GitHub offers the branch's
commit messages as a default body; delete them. They are the record of how the work
was arrived at, which the pull request already preserves, and repeating them in
`main` makes every entry a wall of text.

Branch commits are for the branch. Write them for a reviewer reading the diff, and
let the squash discard the ones that only mattered on the way.
