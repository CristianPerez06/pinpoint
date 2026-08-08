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

The native build needs Xcode (iOS) or Android Studio (Android) and takes minutes the
first time; after that `pnpm dev:mobile` is as fast as it was. `ios/` and `android/`
are generated and not committed — `pnpm --filter mobile prebuild` regenerates them
from `app.json`.

## Checks

```bash
pnpm lint          pnpm lint:mobile
pnpm typecheck     pnpm typecheck:mobile
pnpm test          # shared package tests
pnpm check:cycles  # workspace dependency graph
pnpm check:specs   # OpenSpec specs and active changes
```

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
