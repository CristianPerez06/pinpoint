## Context

See proposal.md for why. The rules are in `specs/offline-use` and the `data-freshness`
delta; this file is how.

What exists on the phone today:

- Every list is read through `useQuery` (`apps/mobile/lib/use-query.ts`): the trips list in
  `app/index.tsx` and `app/calendar.tsx`, and markers, cities, interest and members in
  `trip-workspace.tsx` and `trip-calendar.tsx`. It already keeps rows on screen when a
  re-read fails, and exposes `set` for writes and `refetch({ force })` for re-reads.
- `markVisited`, `answer` and `unanswer` are optimistic through `set` and roll back on
  failure. `setMarkerVisited` sends an absolute boolean, and interest is an upsert or a
  delete keyed on `(marker_id, member_id)`. None of them checks `updated_at`, so none can be
  refused as changed by somebody else.
- The style document is fetched from OpenFreeMap on each launch (`lib/basemap.ts`), cached
  only in memory, and handed to MapLibre as inline JSON.
- Nothing on the phone knows whether it is online.
- Sign-out is `signOut(supabase)` and clears only the session.

## Goals / Non-Goals

**Goals:**
- One mechanism for keeping and restoring every trip list, inside `useQuery`, so no screen
  decides it again.
- Taps made offline go through the same `set` path as online ones, so the screen cannot
  tell them apart except by the waiting line.

**Non-Goals:**
- Any change to `packages/data` reads or writes, or to the database.
- The calendar gaining a manual reload control.

## Decisions

### Kept copies are JSON files, one per trip

A folder under the app's document directory, via `expo-file-system`, with one file per list:
`trips.json`, and `markers-<trip id>.json`, `cities-…`, `interest-…` and `members-…` for each
trip, each holding its rows and the time of its last read. `style.json` holds the map's style
document, and `waiting.json` the waiting taps. One file per list rather than per trip, because
each list is held and re-read on its own, so each can be written on its own.

The preferences store (`@react-native-async-storage/async-storage`) is capped at 6 MB in
total on Android, and a single value there cannot exceed about 2 MB. A trip with several
hundred places and long notes, times a handful of trips, reaches that. Files have neither
limit, and deleting the folder is the whole of the sign-out cleanup. `expo-file-system` is
already installed as part of Expo; it becomes a declared dependency of `apps/mobile`.

### `useQuery` takes a kept copy and writes through to it

`useQuery` gains an optional `keep` argument: a key, and functions to read and write the
file for it. When given:

- The kept rows are read synchronously while the first render is worked out, so the list is
  drawn from them in that render rather than after a loading frame. They stand in for the
  entry until a read or a write makes one. `readAt` stays 0, so the floor never declines the
  read that follows. A file of a few hundred kilobytes reads in well under a frame.
- The first read runs as it does now. Success replaces the entry. Failure leaves the kept
  rows in place — the existing "a re-read that failed leaves what is on screen alone" rule
  already does this once the entry is not `null`.
- Whenever the entry changes (a read or a `set`), it is written to the file, debounced so
  a burst of taps writes once.

This is the only place the copy is read or written, which is what the `data-freshness`
delta asks for.

### Online or not comes from `expo-network`

`expo-network`'s state listener, wrapped in a `ConnectivityProvider` mounted in
`app/_layout.tsx` beside the preferences, and read with `useOnline()`. Offline means
`isInternetReachable === false`, or `isConnected === false`. It is an Expo module
versioned with the SDK, so it needs no separate compatibility checking. It is native code,
so the development build has to be rebuilt.

Every control listed in the spec reads `useOnline()` and passes `disabled` plus the
"needs a connection" line. There is no global overlay intercepting presses, because the
spec requires the controls to say why.

### Waiting taps are a small queue, collapsed by target

`waiting.json` holds entries of the form `{ kind: 'visited', markerId, visited }` or
`{ kind: 'interest', markerId, memberId, interested: true | false | null }`, where `null`
means withdraw. Adding an entry replaces any entry with the same target, so only the last
choice per place, or per place and member, is kept, in order of first appearance.

`markVisited`, `answer` and `unanswer` check `useOnline()`. Offline, they `set` the rows
exactly as now, add to the queue, and skip the call and the rollback. The waiting line under
a control is shown when the queue holds an entry for its target.

When `useOnline()` turns true, and on launch when online, the queue is sent in order with
the existing `setMarkerVisited`, `recordInterest` and `withdrawInterest`. A write's outcome
does not say whether a failure was the connection's or the database's, so after a failure the
device is asked: with no connection the flush stops and keeps the rest for next time; with
one, the failure was a refusal and the entry is dropped, never retried. After the last one,
`rereadEverything({ force: true })` runs on whichever trip screen is showing.

The pure parts — collapsing, reading and writing the queue, and what counts as a readable
kept list — are in `@pinpoint/data` (`waiting.ts`, `kept.ts`), where they are unit-tested.
The phone has no test runner, and adding one is not this change.

### Areas are a pure function in `@pinpoint/map`

`offlineAreas(markers, cities)` returns
`{ key, bounds, cityId | null, placeCount, minZoom }[]`:

- Places are joined into a group when within 5 km of any place already in it.
- Each group's bounds get a 1 km margin.
- The group is named by the city most of its places are filed under.
- Its `minZoom` is the zoom at which its bounds fill a phone screen, minus one.
- Its `key` is derived from the rounded bounds, so an unchanged group keeps its key between
  runs.

It is plain arithmetic over coordinates, next to `boundsOf` in `camera.ts`, and it honours
the no-renderer rule.

The size estimate is `tileCount(bounds, minZoom..14) × average bytes per tile`. The average
is a constant measured once from real cities while building this. Over central Tokyo a
compressed tile at zoom 14 is 140–420 KB. The screen says *about*.

### Each area is one MapLibre offline pack

`OfflineManager.createPack({ mapStyle: styleUrl(), bounds, minZoom, maxZoom: 14,
metadata: { tripId, areaKey, downloadedAt } })`. Zoom 14 is the highest zoom OpenFreeMap
serves; MapLibre draws street level by enlarging those tiles. Pointing the pack at the
style URL makes MapLibre also store the sprites, fonts and tile index the style references.
The themed document we render uses the same addresses, so it finds them offline.

`getPacks()` filtered by `tripId` gives the screen its state: a missing area means Update,
and `status()` gives progress and the size on disk. Leaving the app calls `pause()` on the
active pack through the existing `AppState` hook, and coming back calls `resume()`. Remove
is `deletePack` for each of the trip's packs.

### The trip copy is cleared on the Sign out button, not on a session event

The sign-out handler deletes the folder, then calls `signOut`. It does not listen for
Supabase's `SIGNED_OUT` event. That event can also fire when a token refresh fails, and a
phone offline for days is exactly when that might happen. Clearing on it would erase the
trip at the moment it is needed.

## Risks / Trade-offs

- **[OpenFreeMap's terms forbid collecting data "in automated ways without permission"]**
  → Ask the maintainer before building the download: a user-triggered download of the areas
  around one trip, zoom 14 at most. It costs nothing. The rest of the change does not depend
  on the answer, so tasks put the download last. If the answer is no, the download is
  dropped and the rest ships.
- **[OpenFreeMap re-publishes the planet weekly under a new address]** (the tile index
  currently points at `…/planet/20260927_080001_pt/{z}/{x}/{y}.pbf`). If the phone goes
  online after downloading, MapLibre may refresh the stored tile index to the new week, whose
  tiles were never downloaded, and the map would be blank offline. → The first task is a
  spike that reproduces this. If it happens, the fix is to hand the renderer the week the
  pack was downloaded while a pack exists, and to show *Update* on the Offline map screen
  when a newer week is out.
- **[Opening offline with an expired access token signs the person out]** → Verify with
  airplane mode after more than an hour. Clearing only on the button means that even if
  this happens the copy survives until the person signs in again.
- **[Sizes are estimates]** → Labelled *about*. After downloading, the real size on disk is
  shown.
- **[A copy of every trip ever opened accumulates]** → Kept deliberately. Trips are small,
  and the person expects the trips they opened to open. Archiving does not delete a copy.

## Migration Plan

None. A phone with no kept files behaves exactly as today until its first read. Adding
`expo-network` and declaring `expo-file-system` needs a new development build.
