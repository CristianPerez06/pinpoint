## 1. The routing package

- [x] 1.1 Read the current terms at `routing.openstreetmap.de/about.html` and Valhalla discussion #3373, confirm the headers, credit and "fix the map" link in `design.md` still match, and record any difference in `design.md` before going on
- [x] 1.2 Create `packages/routing` (manifest, `typecheck` and `test` scripts, injected `Fetcher`, result union) and add it to both apps' dependencies and to `transpilePackages`; verify `pnpm install` and `pnpm check:cycles` pass
- [x] 1.3 Add the Valhalla and OSRM URL builders and answer parsers for the three modes, and verify with tests built from the spike's recorded Kiyomizu-dera → Fushimi Inari answers (4.42 km / 53 min, 4.37 km / 58 min)
- [x] 1.4 Add the precision-6 polyline decoder and verify with a test against a known encoded line
- [x] 1.5 Add `createRouter`: Valhalla then OSRM on failure only, 8 s total wait, a 1 s queue, an LRU of 50 keyed on a 50 m-rounded start, caching `ready` and `none` only; verify with fake-timer tests for spacing, fallback, abort and cache hits

## 2. Shared description and words

- [x] 2.1 Add the street form to `routeFeature` and `routeLayers` in `@pinpoint/map`, keeping the straight form's layers unchanged; verify with tests that both forms use only `ink` and `surface` and that only the straight form is dashed
- [x] 2.2 Add `formatTravelTime(language, minutes, mode)` to `@pinpoint/core`, and verify with tests for *53 min walk*, *18 min by bike*, *1 h 35 min drive*, a time under a minute, and Spanish
- [x] 2.3 Add `routeFigures({ km, mode, street, online, switched })` to `@pinpoint/core` and verify with a test for each `place-route` scenario on the details: estimate, street route, bike on the straight line, finding, none found, no connection, switched to walking
- [x] 2.4 Add the new sentences in English and Spanish (impersonal Spanish) together with the code that resolves them, update the snapshot, and verify with `pnpm check:wording`
- [x] 2.5 Add `Valhalla` and `OSRM` to `MAP_CREDITS` with their roles, add the "fix the map" link, and reword `credits.blurb` so it no longer counts; verify both credits surfaces list six entries

## 3. Laptop

- [x] 3.1 Add `apps/web/lib/connectivity.ts` with `useOnline()` and verify it flips when the browser's network is turned off in developer tools
- [x] 3.2 Build the router once in the app, grow the route state to `{ markerId, from, mode, street }`, and ask for the street route after the position is found; verify in the running app that the dotted line shows first and the solid street route replaces it
- [x] 3.3 Add the Walk · Bike · Car buttons under the figures, with filled-when-chosen, accessible names and the chosen state; verify that pressing each one reroutes and changes the figures and icon
- [x] 3.4 Remember the mode in a `pp-travel-mode` cookie, written only from a press; verify that a reload followed by a new route starts with the last mode chosen
- [x] 3.5 Frame the whole street route beside the card; verify on a route that bends away from the straight line that no part of it is under the card
- [x] 3.6 With the network off: verify Bike and Car are inert and say why, that switching off while driving changes to walking with the note, and that switching on again fetches the walking route and keeps walking chosen

## 4. Phone

- [x] 4.1 Move the `User-Agent` builder to `apps/mobile/lib/user-agent.ts`, used by place search and the router; verify search still works on the simulator
- [x] 4.2 Build the router once, grow the route state in `trip-map.tsx`, and draw the street route; verify on the simulator that the dotted line shows first and the solid route replaces it, above the sheet
- [ ] 4.3 Add the mode buttons to the details sheet, visible without scrolling; verify with the longest place name in the trip — left for the user to check on a phone (decided 2026-10-05)
- [x] 4.4 Add `TRAVEL_MODE_KEY` to `preferences.tsx`, read in the launch gate; verify that it survives a restart
- [ ] 4.5 With airplane mode on: verify the same three no-connection behaviours as 3.6 — left for the user to check on a phone (decided 2026-10-05)

## 5. Records

- [x] 5.1 Record in `PRODUCT.md` that street routes come from FOSSGIS Valhalla and OSRM under the withdraw-rather-than-bill rule, and that routing over the downloaded tiles was tested and rejected (spike, approach 3)
- [x] 5.2 Update the `place-route` Purpose in `openspec/specs/place-route/spec.md` at archive time so it no longer says the route is only a straight line; verify with `openspec validate --specs --strict`

## 6. Looking at it

- [x] 6.1 On both apps, in light and dark, compare against `mock/directions-mock.html`: the solid and dotted lines both read against the map and hide no pin, and in greyscale the chosen mode and the inert ones can still be told apart
- [x] 6.2 Route by car to a place more than 50 km away with a connection, and verify a driving time is shown
- [x] 6.3 Switch to Spanish and verify every new word on both apps is in Spanish
- [ ] 6.4 With a screen reader (VoiceOver on the simulator, the browser's on the laptop), verify the three modes are announced with the chosen and unavailable states — left for the user to check on a phone (decided 2026-10-05)
- [x] 6.5 Run `openspec validate street-routes-and-travel-modes --strict` and `pnpm verify`, and verify both pass
