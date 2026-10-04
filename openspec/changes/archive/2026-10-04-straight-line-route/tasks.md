## 0. Before applying

- [x] 0.1 Confirm or overrule the five open questions in `proposal.md`, and update the specs where an answer changes them; verify with `openspec validate straight-line-route --strict`

## 1. Shared logic

- [x] 1.1 Add `walkingMinutes(km)` to `@pinpoint/map` and verify with tests for 120 m, 1.34 km, 35 km and 120 km against the spec's scenarios
- [x] 1.2 Add `ROUTE_SOURCE`, `routeFeature` and `routeLayers` to `@pinpoint/map` beside the location layers, and verify with tests that the layers use only `ink` and `surface` for both modes
- [x] 1.3 Add the walking-time sentences (`route.walkMinutes`, `route.walkHours`, `route.walkHoursMinutes`) to `english.ts` and `spanish.ts`, update the catalogue snapshot, and verify with `pnpm check:wording`. The button's sentences are added with the app tasks that use them (2.1, 2.3), because `check:wording` fails on a sentence nothing resolves
- [x] 1.4 Add `formatWalkingTime` to `@pinpoint/core` and verify with tests for minutes, hours and minutes, and Spanish
- [x] 1.5 Verify `pnpm typecheck:packages`, `pnpm test` and `pnpm check:cycles` pass

## 2. Laptop

- [x] 2.1 Add `route.calculate`, `route.calculateNamed` and `route.finding` in both languages, and the button under the name and tags in the place card, wired to the existing `locate()`, inert and busy while waiting; verify by pressing it in the running app
- [x] 2.2 Draw the line beneath the markers and frame both points clear of the card; verify in the running app that neither end sits under the card
- [x] 2.3 Add `route.straightLine` and `route.clear` in both languages, show the walking time, distance and *Clear*, and clear the route on *Clear*, on close and on selecting another place; verify each in the running app

## 3. Phone

- [x] 3.1 Add the button under the name and tags in the details sheet, visible without scrolling, wired to the existing `locate()`; verify on the simulator
- [x] 3.2 Draw the line beneath the markers and frame both points above the sheet with `frameAround`; verify on the simulator that neither end is behind the sheet
- [x] 3.3 Show the figures and *Clear*, and clear on *Clear*, close and another selection; verify on the simulator
- [x] 3.4 Turn the network off and verify the route still works

## 4. Looking at it

- [x] 4.1 On both apps, in light and dark, check the line reads against the map and hides no pin
- [x] 4.2 Refuse location on both apps and verify the existing note shows and the button stays
- [x] 4.3 Route to a place over 50 km away and verify no walking time is shown
- [x] 4.4 Switch to Spanish and verify every new word is in Spanish
- [x] 4.5 Run `pnpm verify` and verify it passes
