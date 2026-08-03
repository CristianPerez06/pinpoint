# pinpoint

A map you can drop markers on. Built for trip planning — save the places you want to
go, see them all on one map, and share the map with whoever you're travelling with.

First trip is Japan, but nothing in it is Japan-specific.

## Status

Workspace skeleton. Both apps build and run, and neither renders a map yet — that's
the next change. What exists is the structure the map will be built on, with the
portability boundary enforced by the build rather than by memory.

## Layout

```
pinpoint/
├── apps/
│   ├── web/          Next.js App Router
│   └── mobile/       Expo + expo-router (runs under Expo Go)
└── packages/
    ├── map/          style references + pure camera/marker logic — zero dependencies
    ├── core/         domain types and validation
    └── supabase/     Supabase client factory and database types
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
pnpm dev:mobile   # Expo — press i for iOS, a for Android
```

## Checks

```bash
pnpm lint          pnpm lint:mobile
pnpm typecheck     pnpm typecheck:mobile
pnpm test          # shared package tests
pnpm check:cycles  # workspace dependency graph
```

All of these run in CI on every pull request, along with a web production build and a
gate that fails if two versions of React or React Native end up installed.

## Planned stack

Everything here is free at the scale this app will ever run at.

**Web (first)**

- [MapLibre GL JS](https://maplibre.org/) — open-source map renderer, no API key, no license fees
- [OpenFreeMap](https://openfreemap.org/) — free unlimited vector tiles, no signup
- [Supabase](https://supabase.com/) free tier — Postgres + auth + realtime, for syncing markers between people

**Mobile (later)**

- React Native + Expo, using a dev build (not Expo Go)
- [`@maplibre/maplibre-react-native`](https://github.com/maplibre/maplibre-react-native) — same style JSON and
  a near-identical marker/camera API as the web, so the map layer ports over instead of being rewritten

**Maybe**

- [Protomaps](https://protomaps.com/) — extract a country into a single `.pmtiles` file for offline maps.
  Useful underground or when data is unreliable.
- [Photon](https://photon.komoot.io/) or Nominatim for place search — free OSM geocoders

## Cost

$0 to build and run. The only paid thing is the Apple Developer Program ($99/yr) if the
iOS app ever needs to go through TestFlight or the App Store.

Tiles come from OpenFreeMap, which serves OpenStreetMap data. Attribution is required
wherever the map renders — it's the price of the free tiles, not a nicety.
