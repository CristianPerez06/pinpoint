# pinpoint

A map you can drop markers on. Built for trip planning — save the places you want to
go, see them all on one map, and share the map with whoever you're travelling with.

First trip is Japan, but nothing in it is Japan-specific.

## Status

Early. Nothing built yet.

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
