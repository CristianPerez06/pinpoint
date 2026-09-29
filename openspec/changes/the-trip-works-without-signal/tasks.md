## 1. Before building

- [ ] 1.1 Ask the OpenFreeMap maintainer whether a user-triggered download of the areas around one trip (zoom 14 at most, stored with MapLibre's offline packs) is acceptable; record the answer in design.md. Group 7 waits on a yes; everything else proceeds
- [ ] 1.2 Spike the weekly tile address: create one pack by hand on the simulator, go online long enough for the style to reload, then turn on airplane mode and check whether the area still draws. Record the result in design.md and, if it goes blank, add the pinning described there to group 7's tasks

## 2. Knowing whether the phone is online

- [x] 2.1 Add `expo-network` and declare `expo-file-system` in `apps/mobile/package.json`; rebuild the development build and verify `pnpm verify` passes
- [x] 2.2 Add `ConnectivityProvider` and `useOnline()` in `apps/mobile/lib/`, mounted in `app/_layout.tsx`; verify on the simulator that toggling the Mac's network flips it within a few seconds

## 3. Keeping each trip on the phone

- [x] 3.1 Add the kept-copy files module in `apps/mobile/lib/` (read, write debounced, delete all), with what counts as a readable copy in `@pinpoint/data` and unit tests there for a missing file, a malformed file and a round trip
- [x] 3.2 Give `useQuery` the optional `keep` argument: seed from the file before the first render, leave `readAt` at 0, write through on every change; verify on the simulator that a successful read replaces the seed and a failed one leaves it (the phone has no test runner)
- [x] 3.3 Pass `keep` for the trips list in `app/index.tsx` and `app/calendar.tsx`, and for markers, cities, interest and members in `trip-workspace.tsx` and `trip-calendar.tsx`; verify with airplane mode that a trip opened before reopens with every list after the app is killed
- [ ] 3.4 Keep the style document in `lib/basemap.ts` and fall back to it when the fetch fails; verify the map draws its colours offline after a relaunch
- [ ] 3.5 Delete the kept folder from the Sign out button before signing out; verify that after signing out and back in offline no trip opens from a copy
- [ ] 3.6 Verify that opening the app offline more than an hour after the last launch does not sign the person out

## 4. The offline note

- [x] 4.1 Show *Offline · the trip as of HH:MM* on the map while offline, naming the day when it is not today; add the sentences in English and Spanish to `@pinpoint/wording`; verify `pnpm check:wording` passes and the note appears and goes on the simulator in both themes and both languages

## 5. Visited and who wants to go offline

- [x] 5.1 Add the waiting-tap queue in `apps/mobile/lib/`, with collapsing, order and reading back in `@pinpoint/data` and unit tests there
- [x] 5.2 Route `markVisited`, `answer` and `unanswer` in `trip-workspace.tsx` and `trip-calendar.tsx` through the queue when offline, and show the *sends when you are back online* line under the control while its target is waiting; verify on the simulator
- [ ] 5.3 Send the queue when the connection returns and at launch when online, then force a re-read; verify with two devices that an offline *visited* is not flipped back by the other device's untick, and that a tap on a place removed meanwhile disappears silently

## 6. Greying out what needs a connection

- [x] 6.1 Disable, with the *needs a connection* line, Edit and Remove in `marker-details.tsx`, Search and Drop in `workspace-chrome.tsx`, and every write in `city-sheet.tsx`, `marker-form.tsx`, `trip-sheet.tsx`, `people-sheet.tsx`, `trip-setup.tsx` and the calendar's editing controls; add the sentences in both languages
- [x] 6.2 Walk every screen offline on the simulator and check that nothing that writes is still pressable, that Filter and city choice still work, and that everything comes back without a tap when the connection returns

## 7. The Offline map screen

- [ ] 7.1 Add `offlineAreas(markers, cities)` and the size estimate to `@pinpoint/map`, with tests: two cities far apart make two areas, nearby places make one, places with no city are named by count, and an unchanged group keeps its key
- [ ] 7.2 Measure the average bytes per tile from real packs over two dense and one sparse city and set the estimate's constant; record the numbers in design.md
- [ ] 7.3 Add the `offline-map` route with its four states (not downloaded, downloading, downloaded, new areas) and the disabled state with no signal, as in the mock; add the sentences in both languages
- [ ] 7.4 Create, pause on leaving, resume on return, and delete packs through `OfflineManager`, keyed by trip and area; verify on the simulator that leaving the app mid-download continues from where it stopped
- [ ] 7.5 Add the *Offline map* line to `trip-sheet.tsx`, showing not downloaded, the size, or the number of new areas
- [ ] 7.6 Download a real trip, turn on airplane mode, relaunch, and verify the streets around every place draw at street level on iOS and Android; check the mobile-data warning on a device with Wi-Fi off

## 8. Finishing

- [ ] 8.1 Look at every new and changed screen in the running app, in both themes and both languages, against the mock
- [ ] 8.2 Run `pnpm verify` and `openspec validate the-trip-works-without-signal --strict`, and verify both pass
