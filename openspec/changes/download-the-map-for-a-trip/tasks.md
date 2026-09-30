## 1. Before building

- [x] 1.1 Spike the weekly tile address: create one small pack by hand on the simulator, go online long enough for the style and tile index to reload, then turn on airplane mode, relaunch, and check whether the area still draws. Record the result in design.md. If it goes blank, stop and bring the Update question in design.md's Risks back to the user before adding the pinning to these tasks

## 2. Areas and sizes

- [x] 2.1 Add `offlineAreas(places, cities)` to `@pinpoint/map`, with tests: two cities far apart make two areas and their bounds do not overlap, nearby places make one, a margin surrounds every place, an area is named by its majority city, places with no city are named by count, and the same places give the same keys
- [x] 2.2 Add the new-areas helper (places outside every given pack bounds, grouped with `offlineAreas`), with tests: no packs means every area is new, a place inside a pack is not, and a place far away makes one new area
- [x] 2.3 Add `pinnedStyle(document, edition)` and reading an edition from the tile index to `@pinpoint/map`, with tests: the vector source loses `url` and gains the edition's tiles, zooms and attribution, other sources and layers are untouched, and a document without that source comes back unchanged
- [x] 2.4 Add `estimateBytes(bounds, minZoom)` with a provisional constant and a test of the tile count against a hand-worked example
- [x] 2.5 Download real packs over two dense cities and one sparse one, set the constant from their sizes, and record the numbers in design.md

## 3. Downloading

- [x] 3.1 In `apps/mobile/lib/`, wrap `OfflineManager`: create a trip's packs one at a time from a pinned style file, tagged with trip, area key, name, day and edition (the trip's recorded one on Update, the tile index's on a first download), report progress per area and overall, cancel (delete what this run created), remove (delete every pack of the trip), and read a trip's state from `getPacks()` and `status()`
- [x] 3.2 Pause the active pack when the app goes to the background and resume it, then the remaining areas, on return; verify on the simulator that leaving mid-download continues from where it stopped without repeating finished areas
- [x] 3.3 Pin the trip map's style to the open trip's edition in `useThemedBasemap` while it has packs; verify on the simulator that the map still draws, and that the rendered source names the pinned week
- [ ] 3.4 Show a failed area as failed with Try again, keeping finished ones; verify by turning off the network mid-download

- [x] 3.5 Download one overview pack over the whole trip at low zoom with every download, left out of the area list and of new-area detection, counted in sizes, and replaced on an Update that reaches outside it; add `overviewArea` to `@pinpoint/map` with tests; verify with OpenFreeMap blocked that the whole-trip view draws the land

## 4. The screen and the line

- [ ] 4.1 Add the `offline-map` route with its states — not downloaded, downloading, downloaded, new areas, failed, and no signal — as in the mock, with sizes said as *about*; add every sentence in English and Spanish to `@pinpoint/wording`, and verify `pnpm check:wording` passes
- [ ] 4.2 Show the mobile-data line when the connection is cellular; check it on a device with Wi-Fi off
- [x] 4.3 Add the *Offline map* row under People in `trip-sheet.tsx`, showing not downloaded, the size, or the number of new areas, and opening the route
- [ ] 4.4 Look at the trip sheet line and every screen state in the running app, in both themes and both languages, against the mock

## 5. On a real phone

- [ ] 5.1 On a real Android phone: download a trip, turn on airplane mode, relaunch, and check that the streets around every place draw at street level, with the attribution visible; the same on the iOS simulator
- [x] 5.2 Add a place far from the downloaded areas and check the line and screen say one new area, and Update downloads only that one
- [ ] 5.3 Remove the download and check the space is freed and the line says not downloaded; sign out and in with a download present and check it still draws offline

## 6. Finishing

- [x] 6.1 Remove "Downloading the map around a trip's places ahead of time is not covered yet (#232)." from the Purpose of `openspec/specs/offline-use/spec.md`, and add the download to what it covers
- [ ] 6.2 Run `pnpm verify` and `openspec validate download-the-map-for-a-trip --strict`, and verify both pass
