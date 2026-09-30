## Context

See proposal.md for why; the rule is *The map around a trip's places can be downloaded ahead
of time* in `specs/offline-use`. This was designed inside `the-trip-works-without-signal` and
held back for permission, which OpenFreeMap's maintainer gave on 2026-09-30 with no
conditions: a download the person starts, of the areas around one trip's places, at zoom 14
at most.

What exists on the phone today:

- `lib/basemap.ts` fetches `styleUrl()`, keeps the document on the phone for offline launches,
  and hands MapLibre the themed copy as inline JSON. `themeStyle` repaints layers and leaves
  `sources` alone, so the themed document asks for exactly the same tile addresses.
- The style's vector source is `url: https://tiles.openfreemap.org/planet`, a tile index that
  today answers `tiles: [".../planet/20260927_080001_pt/{z}/{x}/{y}.pbf"]`. The dated part
  changes every week.
- `@maplibre/maplibre-react-native` 11.3.6 has `OfflineManager`: `createPack({ mapStyle,
  bounds, minZoom, maxZoom, metadata })`, `getPacks()`, `deletePack(id)`, and on each pack
  `status()`, `pause()` and `resume()`. It is already in the development build.
- `lib/connectivity.tsx` gives `useOnline()`; `expo-network` also reports the connection type.
- `lib/use-active-again.ts` runs a handler on the return from `background`.
- `app/calendar.tsx` is a route reached from the trip sheet's `otherView` row, reading its
  lists through `useQuery` with `keep`.
- `signOutHere` in `lib/sign-out.ts` forgets the kept trip files and nothing else.

## Goals / Non-Goals

**Goals:**
- Which areas, how big, and which are new are pure functions in `@pinpoint/map`, tested there.
- The screen's state comes from the packs MapLibre holds, not from a second record of them.

**Non-Goals:**
- Downloading with the app closed.
- Refreshing a downloaded trip to OpenFreeMap's newer streets. Remove and download again
  does that.

## Decisions

### Areas are a pure function in `@pinpoint/map`

`offlineAreas(places, cities)` returns `{ key, bounds, cityId | null, placeCount, minZoom }[]`:

- A place joins a group when it is filed under the same city as a place already in it and
  within 25 km of it, or, with no city, within 5 km. A group follows a city's shape instead
  of boxing two cities together.
- Each group's bounds get a 1 km margin.
- The group is named by its city; with none, by its count.

The first version joined any places within 5 km, whatever their city. On the real Japan trip
that listed Osaka seven times and Hiroshima twice — a theme park and an island shrine are
still the city to the person — so places now join only their own city, with a city-sized
reach.
- `minZoom` is the zoom at which the bounds fill a phone screen, minus one, so the area can be
  seen whole with a little around it.
- `key` comes from the rounded bounds, and is what a pack is tagged with.

It lives beside `boundsOf` and `distanceKm`, and honours the no-renderer rule.

**New areas** are worked out from places, not keys: the places not inside any downloaded
pack's bounds are passed to `offlineAreas` again, and whatever comes back is what Update
downloads. Comparing keys would call an area new the moment one place inside it moved its
bounds by a few metres, and download the whole city again.

### One overview pack for the whole trip, at low zoom

Testing with OpenFreeMap blocked showed the cities drawing and the whole-trip view — what the
map opens on — empty: the area packs start at city zoom. So each download also makes one
**overview** pack over all of the trip's places with a 10 km margin, from zoom 0 to one
above the zoom at which they all fit a phone screen. For Japan that is zoom 0–6, a few dozen
tiles. Decided with the user on 2026-09-30. Measured over the Japan trip on the 0927
edition: zoom 0–7 is 22 tiles and 3.2 MB, 150 KB a tile, which is
`AVERAGE_OVERVIEW_TILE_BYTES`.

It is not an area: it is not listed, and its bounds are never used to decide what is new —
it covers everything, so it would make every new place look downloaded. It is counted in
the sizes. When an Update adds places outside it, the Update also downloads a new overview
over the whole trip and deletes the old one when it finishes.

### The size estimate is tiles × a measured average

`estimateBytes(bounds, minZoom)` counts the tiles from `minZoom` to 14 over the bounds and
multiplies by one constant, measured while building this from real packs over two dense
cities and one sparse one, with the numbers recorded here. Planning measured 140–420 KB for
a zoom-14 tile over central Tokyo. The screen says *about*; once downloaded it shows the real
size from `status()`.

Measured 2026-09-30 over the 0927 edition, gzip as served, sampling six zoom-14 tiles and
three at each lower zoom from each area's `minZoom`, weighted by how many tiles each zoom has:

| Area | Tiles | Size | Per tile |
| --- | --- | --- | --- |
| Central Tokyo (0.12° × 0.09°, from zoom 10) | 61 | ~18 MB | 295 KB |
| Central Kyoto (0.08° × 0.09°, from zoom 11) | 45 | ~7.4 MB | 165 KB |
| Hakone (0.08° × 0.08°, from zoom 11) | 32 | ~0.7 MB | 20 KB |

`AVERAGE_TILE_BYTES` is 200 KB: about a third low for the densest city, generous for
countryside, where the absolute numbers are small either way. It is one constant because the
screen says *about*, and density cannot be known before downloading.

The first real download (the Japan trip, seven areas, 2026-09-30) came to 111 MB on the
phone: 93 MB of streets and **18 MB of fonts and icons that every pack references** — the
renderer stores every range of every font the style names. Status reports them in each
pack's `completedResourceSize`, so summing packs said 219 MB. An area's own size is
`completedTileSize`; a trip's total adds the shared part once, and the first download's
estimate adds `STYLE_ASSETS_BYTES` once. Per area, the estimate against the real streets:
Osaka 61 → 42 MB, Tokyo 22 → 27, Kyoto 15 → 11, Hiroshima 25 → 5.5 (much of its box is
sea), Nara 12 → 4.6, Hakone 9.4 → 1.0. The total, 145 against 111, is inside what *about*
promises; a single constant cannot do better per area.

### Each area is one MapLibre offline pack, downloaded one at a time

`createPack({ mapStyle: styleUrl(), bounds, minZoom, maxZoom, metadata: { kind, tripId,
areaKey, cityId, placeCount, downloadedOn, edition, maxZoom } })`, with `maxZoom` 14 for an
area — the most OpenFreeMap serves; MapLibre enlarges it to street level. The pack also
stores the fonts and icons the style names. Packs are stored by address, not by trip, so two
trips over the same city in the same edition share tiles on disk.

Packs are created one after another, so one area downloads while the rest say *Waiting*, as
in the mock. Leaving the app (`AppState` → `background`) pauses the active pack; returning
(`useActiveAgain`'s rule, `background` → `active`) resumes it and carries on with the rest.

A lost connection is not reported by the renderer at all: on Android, with airplane mode
turned on mid-download, the pack simply stopped receiving and the screen went on saying
*Downloading…* (2026-09-30). So the module watches the connection itself (`expo-network`),
pauses the active pack when it goes and resumes when it returns, and the screen shows
*Download stopped* meanwhile.

Cancel deletes the packs created by that press. Remove deletes every pack tagged with the
trip. Both then clear the renderer's general cache, which is where a deleted pack's streets
otherwise stay. The screen's state — nothing, downloading, downloaded, new areas — is read
from `getPacks()` filtered by `tripId`, plus each pack's `status()`, so nothing else has to
be kept in step with it. The trip sheet line reads the same.

### A trip with a download is pinned to its edition

The spike showed a pack that follows the tile index goes blank the week after. So a download
never goes through the index:

- **The edition** is what the index answered at the trip's first download — its `tiles`
  template, `minzoom`, `maxzoom` and `attribution` — kept in every pack's metadata.
- **`pinnedStyle(document, edition)`** in `@pinpoint/map` replaces the vector source's `url`
  with those fields inline. Keeping `maxzoom: 14` matters: without it MapLibre would ask for
  zoom 15 tiles that do not exist and street level would be blank.
- **Downloading** hands `createPack` the style's own address, and records as the edition
  what the tile index answers just before. Both platforms fetch the style through the
  network and store it by address, so the pack's tiles are keyed by that week's template.
  The first version wrote the pinned document to a `file://` style instead, which worked on
  iOS and failed on Android: its downloader only takes web addresses (`Mbgl-HttpRequest:
  Unable to parse resourceUrl file:///…`, 2026-09-30). OpenFreeMap has no index per past
  week to point at instead — `…/planet/<old week>` answers the current one.
- **Update** therefore downloads only the new areas while the index still answers the
  trip's edition, and **every area again, with a new overview, once it answers a newer
  one** — decided with the user on 2026-09-30, after the Android failure. The old packs
  stay, and the map stays pinned to them, until the new run finishes; then they are
  deleted.
- **Drawing**: when the open trip has packs, `useThemedBasemap` pins the document to their
  edition before theming it, online and offline. Online, that trip shows streets as of its
  download, which is the price of the rest drawing offline.

OpenFreeMap answers any week's tile address, including one it no longer publishes, from
its current data (`x-ofm-debug: wildcard PBF planet`, checked 2026-09-30), so a trip pinned
to an old week keeps drawing online. It does not answer an old week's *index*, which is why
Update cannot add an area in the old week.

### The screen is a route, like the calendar

`app/offline-map.tsx`, taking the trip id, reading markers and cities through `useQuery` with
`keep` as the calendar does, so it opens offline and can still offer Remove. The trip sheet
gains the *Offline map* row under People; it is navigation, so it is never disabled offline.

Mobile data is `useNetworkState().type === NetworkStateType.CELLULAR`, read on this screen
only; it is the one place that asks, so it does not go into `ConnectivityProvider`.

### Signing out leaves the packs

`signOutHere` stays as it is. The packs hold streets and a trip id, nothing about the person;
the next account to sign in on the phone sees them only if it opens that same trip.

## Spike: the weekly tile address (task 1.1, 2026-09-30)

**A download would go blank.** Airplane mode on the simulator is the Mac's own network, so
instead of toggling it the spike read MapLibre's database on the booted simulator
(`Library/Application Support/ar.com.pinpoint.app/.mapbox/cache.db`), which packs and the
ordinary cache share:

- `tiles` is keyed by `url_template`, the dated address. It held 110 tiles under
  `…/planet/20260913_164504_pt/…` and 35 under `…/planet/20260927_080001_pt/…`.
- `resources` holds **one** row for the tile index `https://tiles.openfreemap.org/planet`,
  modified 2026-09-28 and now answering the 0927 week. It was overwritten in place when the
  week changed; it is not versioned, and a pack's reference to it is a reference to that
  same row.
- The index is served with `max-age=86400`, so any day the phone is online, it is re-read.

So the 110 tiles from the 0913 week are on the phone and unreachable: offline, the map asks
for 0927 addresses. A pack downloaded one week would be in exactly that state after the
phone is online the next. Tiles from the 0913 week are still served (`200`, 2026-09-30), but
how long OpenFreeMap keeps an old week is not published.

## Risks / Trade-offs

- **[OpenFreeMap re-publishes the planet weekly under a new address]** Confirmed by the
  spike; handled by pinning, above.
- **[The wildcard answer for a retired week is undocumented]** If OpenFreeMap ever refused an
  old edition, Update would fail per area with Try again, visibly, and the areas already
  downloaded would keep drawing. Remove and download again would recover.
- **[Sizes are estimates]** → Said as *about*; the real size replaces it once downloaded.
- **[A download of several hundred MB on a small phone]** → The total is on the button before
  anything starts. MapLibre reports a full disk as a pack error, which the screen shows
  as the download failing, with Try again and what finished kept.
- **[The mock shows sizes without *about*]** → The issue's decision wins; sizes read *about
  96 MB*.

## Migration Plan

None. No new dependency, no database change, no new development build.
