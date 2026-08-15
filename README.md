# pinpoint

A map you can drop markers on. Built for trip planning — save the places you want to
go, see them all on one map, and share the map with whoever you're travelling with.

First trip is Japan, but nothing in it is Japan-specific.

## Status

Both apps render a read-only map of a trip's markers, driven by the same shared
camera, style and marker logic. That was the founding risk: one zero-dependency
package producing the same map through two bundlers and two renderers. It holds —
`@maplibre/maplibre-react-native` accepts the same style **URL** as `maplibre-gl`, so
there is one style source rather than two.

No writing yet. Adding, editing and deleting markers, place search, cities and
filtering are the changes after this one — see `openspec/ROADMAP.md`.

## Layout

```
pinpoint/
├── apps/
│   ├── web/          Next.js App Router
│   └── mobile/       Expo + expo-router (needs a development build)
└── packages/
    ├── tokens/       shared literals — colours, spacing. No dependencies at all
    ├── map/          style references + pure camera/marker logic. No renderer
    ├── core/         domain types and validation
    ├── supabase/     Supabase client factory and database types
    ├── auth/         sign in, sign up, sign out — takes a client, returns a result
    └── data/         reads of trips and markers — same shape as auth
```

Both apps import `@pinpoint/map` and render the same `fitBounds()` result. That's
deliberate: web and mobile use different bundlers with different resolution rules, so
a package resolving under one proves nothing about the other.

## Prerequisites

- **Node** — version pinned in `.nvmrc`. With a version manager: `nvm use`.
- **pnpm** — version pinned via `packageManager` in `package.json`. `corepack enable`
  will honour it.

## Getting started

```bash
pnpm install

cp apps/web/.env.example apps/web/.env
cp apps/mobile/.env.example apps/mobile/.env
# then fill both in
```

Each app validates its configuration at startup and fails naming the variable that's
missing, so a half-filled file tells you exactly what it needs.

```bash
pnpm dev          # web at http://localhost:3000
```

**Mobile no longer runs under Expo Go.** `@maplibre/maplibre-react-native` contains
native code, and Expo Go ships a fixed set of native modules that does not include it
— scanning the QR code gets you an app that fails when the map screen renders. The
first run now builds the app natively:

```bash
pnpm --filter mobile ios       # or: android — builds and installs a dev build
pnpm dev:mobile                # afterwards: attaches to the installed dev build
```

The native build takes minutes the first time; after that `pnpm dev:mobile` is as fast
as it was. `ios/` and `android/` are generated and not committed — `pnpm --filter
mobile prebuild` regenerates them from `app.json`.

**A new native dependency means another native build.** `pnpm dev:mobile` reloads
JavaScript and nothing else, so installing a package that contains native code —
`react-native-svg`, say — leaves the dev build on the device without it. The app then
fails at the first component that needs it, with a message about a missing native
component that reads like a JavaScript error and is not one. Rebuild:

```bash
rm -rf apps/mobile/ios            # its Pods are stale, and it is generated anyway
pnpm --filter mobile prebuild
pnpm --filter mobile ios
```

**Run these through `pnpm --filter mobile`, not a bare `npx expo`.** A bare `npx expo
run:ios` uses whatever directory you are standing in, and from the repository root
Expo finds a `package.json` with no `main`, falls back to `expo/AppEntry.js`, and
fails with `Unable to resolve "../../App"` — a file nobody has ever written here. The
root looks enough like an Expo project to get several steps in before saying so.
`pnpm --filter` sets the working directory, so it cannot happen.

```bash
node -e "require('expo/scripts/resolveAppEntry')" apps/mobile ios absolute
# should print expo-router/entry.js — anything else means the wrong root
```

**If the build hangs at "Installing CocoaPods…"**, suspect CocoaPods rather than the
project, and check it on its own:

```bash
pod --version                     # should answer in about a second
```

If that hangs — with no arguments, and nothing to wait on — CocoaPods is broken. The
usual cause is Homebrew's Ruby being upgraded after `cocoapods` was built against it:

```bash
brew upgrade cocoapods            # or: brew reinstall cocoapods
pod --version                     # confirm it answers before building again
pod --version --verbose           # if it still hangs, this shows where
```

Note the misdirection, because it is the same one as the licence problem below: Expo
says *installing* CocoaPods when the truth is that `pod` will not answer. Both
symptoms point at a step that is fine, and neither names the step that is not.

**iOS needs Xcode 26 or newer**, because Expo SDK 57 builds a module that declares
`swift-tools-version: 6.2`, and Swift 6.2 ships with Xcode 26. A fresh Xcode 26 also
installs without the iOS platform bundle, and after a major upgrade the licence has to
be re-accepted:

```bash
sudo xcodebuild -license accept    # else xcrun exits 69 and CocoaPods refuses to run
sudo xcodebuild -runFirstLaunch
xcodebuild -downloadPlatform iOS   # else every build destination is "ineligible"
```

**Xcode 26.2 cannot build this app at all.** Its SDK ships a libc++ `stdlib.h` that
declares `abs` for `float`, `double` and `long double` in the global namespace.
`expo-modules-jsi` compiles with C++ interop enabled — it has to, it wraps JSI — so
Swift sees those overloads beside its own generic `abs` and refuses to choose:

```
JavaScriptCodable+Date.swift:53: error: type of expression is ambiguous
  guard milliseconds.isFinite, abs(milliseconds) <= maxJavaScriptDateMilliseconds else {
```

Nothing here is involved. The file belongs to a package nobody has opened, the line is
plainly correct, and the two candidates mean the same thing — the compiler simply will
not pick one. 26.6 (Swift 6.3.3) resolves it. Check a toolchain before trusting it:

```bash
printf 'func f(_ ms: Double) { let e: Double = abs(ms); _ = e }\n' > /tmp/t.swift
swiftc -typecheck -cxx-interoperability-mode=default /tmp/t.swift   # silence is good
```

**And do not conclude much from another machine building fine.** That module is
compiled once into an xcframework and cached against a hash of its sources, `RN_ROOT`
and the toolchain version. A machine whose cache is still valid never compiles the file
and so never meets the bug — it is reheating, not cooking. Ours only surfaced because a
stray root `dependencies` block installed a second React Native, which moved `RN_ROOT`,
which invalidated the hash. The dependency mistake did not cause the failure; it removed
the thing that had been hiding it.

## Checks

```bash
pnpm lint          pnpm lint:mobile
pnpm typecheck     pnpm typecheck:mobile
pnpm test          # shared package tests
pnpm check:cycles  # workspace dependency graph
pnpm check:specs   # OpenSpec specs and active changes
pnpm check:tokens  # the derived token files are current
pnpm check:fonts   # both apps bundle the same typeface
```

The last two exist because styling fails quietly. A hand-edit to a generated token
file survives forever without the first, and a missing or mismatched font file falls
back to a system face without the second — changing every measurement on screen while
no build, typecheck, lint or test has anything to say about it.

All of these run on every pull request, along with a web production build and a gate
that fails if two versions of React or React Native end up installed.

They run as two separate workflows. `CI` covers the code; `OpenSpec` covers the
planning artifacts, so a malformed spec fails under its own name instead of turning
the build red for a reason that has nothing to do with the build.

## Planned stack

Everything here is free at the scale this app will ever run at.

**Web**

- [MapLibre GL JS](https://maplibre.org/) — open-source map renderer, no API key, no license fees
- [OpenFreeMap](https://openfreemap.org/) — free unlimited vector tiles, no signup
- [Supabase](https://supabase.com/) free tier — Postgres + auth + realtime, for syncing markers between people

**Mobile**

- React Native + Expo, using a dev build (not Expo Go)
- [`@maplibre/maplibre-react-native`](https://github.com/maplibre/maplibre-react-native) — takes the same style
  URL and a near-identical marker/camera API, so the map layer ports over instead of being rewritten

**Maybe**

- [Protomaps](https://protomaps.com/) — extract a country into a single `.pmtiles` file for offline maps.
  Useful underground or when data is unreliable.
- [Photon](https://photon.komoot.io/) or Nominatim for place search — free OSM geocoders

## Cost

$0 to build and run. The only paid thing is the Apple Developer Program ($99/yr) if the
iOS app ever needs to go through TestFlight or the App Store.

Tiles come from OpenFreeMap, which serves OpenStreetMap data. Attribution is required
wherever the map renders — it's the price of the free tiles, not a nicety.
