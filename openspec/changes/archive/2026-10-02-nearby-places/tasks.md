## 1. Shared logic

- [x] 1.1 Add `orderByDistance`, `hasDrifted` and the 50 km far-away constant to `packages/map/src/nearby.ts`, exported from the package; verify with `nearby.test.ts` covering nearest-first, ties by name, drift within and beyond the tolerance, and an empty trip
- [x] 1.2 Add `formatWalkingDistance` to `packages/core/src/distance.ts` (metres rounded to 10 under 1 km, the kilometre form above); verify with tests at 0.004, 0.346, 0.999, 1.0, 9.94 and 34 km in both languages
- [x] 1.3 Add the `nearby.*` sentences to `english.ts` and `spanish.ts` (impersonal Spanish); verify `pnpm check:wording` passes once both apps resolve them

## 2. Position

- [x] 2.1 Add `permission` to `apps/mobile/lib/where-am-i.ts`, read without prompting and re-read on `useActiveAgain`; verify on the simulator that refusing, allowing in Settings and returning changes it without a relaunch
- [ ] 2.2 Add `permission` to `apps/web/lib/where-am-i.ts` via `navigator.permissions` with an `'unknown'` fallback; verify in Chrome and Safari that it reads granted, refused and unknown without a prompt
- [ ] 2.3 Extend the iOS prompt sentence in `apps/mobile/app.json` and `apps/mobile/locales/es.json` to mention distances; verify the prompt text in a fresh development build

## 3. Phone

- [x] 3.1 Add the Nearby tool (pin-beside-list glyph, `nearby.tool`) as the fourth tool in the bottom bar, inert until the trip has loaded; verify the four tools are one weight and one line each
- [x] 3.2 Build the Nearby sheet over the map: heading with reference point, count and filtered note, close control, rows, scrolling inside a definite height; verify with a trip of ~150 places that every row is reachable and nothing collapses
- [x] 3.3 Wire the offer, finding, refused, not-found and rough lines to `useWhereAmI`, suppressing the map's own note while the sheet carries it; verify each state on the simulator, including opening Nearby after a relaunch with location allowed
- [x] 3.4 Hold the order and show *Re-sort* on drift, with distances live from the watch or the camera; verify by simulating a walk on the simulator (Features → Location → City Walk) that rows hold and *Re-sort* appears and clears
- [x] 3.5 Open a place from a row (map moves to it) and return to the sheet at the same scroll and order on close; verify that opening the filter in between ends the return

## 4. Laptop

- [x] 4.1 Add the Nearby button beside Filter at the same weight; verify at laptop and phone widths
- [x] 4.2 Build the Nearby panel beside its button with the same heading, lines and rows as the phone; verify with ~150 places
- [x] 4.3 Wire location lines, held order with *Re-sort*, and open-and-return as on the phone; verify refused (browser blocking) and not-found in Chrome, and the panel's order following a pan when no position is known

## 5. Product record

- [x] 5.1 Remove *A list view on web* from `PRODUCT.md` § Explicitly undecided, and say in § Operating Context that both apps now list places by distance; verify by reading the section

## 6. Looking at it

- [x] 6.1 Open both apps on a real trip and walk through every state of the sheet on the light and the dark ground; verify that every line, row, dimmed name, dimmed distance and control is legible on both
- [x] 6.2 Switch both apps to Spanish and repeat the location states; verify no English remains in the sheet
- [x] 6.3 Run `pnpm verify` and `openspec validate nearby-places --strict`; verify both pass
