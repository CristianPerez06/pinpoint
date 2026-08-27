## 1. The map can frame a set of points on the phone

- [x] 1.1 Add a method to `TripMapRef` in `apps/mobile/components/trip-map.tsx` that frames a set of positions, taking a bottom inset in pixels the way `flyTo` already does
- [x] 1.2 Resolve the camera through `fitBounds` from `@pinpoint/map` rather than computing a zoom locally, so the two applications frame identically given the same markers and viewport
- [x] 1.3 Centre on the visible strip rather than the whole view, so the framed group lands above the toolbar and any open sheet instead of behind them
- [x] 1.4 Leave the camera untouched when the set is empty, and cover that case in the implementation rather than relying on `fitBounds` to do something reasonable

## 2. The phone can choose a city

- [x] 2.1 Hold the selected city id in `trip-workspace.tsx` state, in memory only — no store, no new dependency
- [x] 2.2 Add a second header line under the trip's name carrying the city control, reading `All places` when nothing is selected
- [x] 2.3 Make the control open the city sheet, and have it declare that it opens something the way the trip name does
- [x] 2.4 Frame the map on the selected city's **visible** markers when a city is chosen, computed from the city being selected rather than from state that still reflects the previous selection
- [x] 2.5 Make `biasRef` city-aware, mirroring web's `computeBias`: the selected city's markers when it has any, the visible map otherwise
- [x] 2.6 Clear the selection when the selected city is removed, and when the trip changes — the trip half needs no code, `app/index.tsx` keys the workspace by `trip.id` so a switch remounts it
- [x] 2.7 Confirm the header still truncates the trip name rather than pushing the menu off the edge, with a 60-character trip name — it ellipsises, keeps its caret, and the menu stays on screen; the city line below is untouched

## 3. The phone's city sheet picks as well as edits

- [x] 3.1 Add an `All places` row and one row per city to `city-sheet.tsx`, with the row as the picking target
- [x] 3.2 Show each city as name, marker count, and currency — stating the absence of a currency rather than leaving it blank
- [x] 3.3 Move the editor behind a pencil on each row, expanding in place, keeping the existing pending states and the counted removal confirmation
- [x] 3.4 Close the sheet when a city is picked, and leave it open when a city is edited
- [x] 3.5 Remove the `Cities` entry from `trip-sheet.tsx` and its handler in `trip-workspace.tsx`, and confirm nothing else reached the sheet through it

## 4. The phone's capture form follows the selection

- [x] 4.1 Default the form's city to the selected city in `beginCreate`
- [x] 4.2 Delete `lastCityId` and everything that maintained it, including the reset on city removal
- [x] 4.3 Confirm a place saved with nothing selected defaults to no city and can still be filed from within the form — **by code**, not observed: opening the form needs a tap

## 5. The laptop's city menu gains a pencil and a count

- [x] 5.1 Give every row in `city-bar.tsx` its own way into the editor, and have the editor expand under its own row rather than replacing the panel
- [x] 5.2 Remove the trailing `Edit "<city>"` entry and the `selected`-conditional that gated it
- [x] 5.3 Show each city as name, marker count, and currency, matching the phone
- [x] 5.4 Keep `Cancel` on this platform, and keep the existing pending states and the counted removal confirmation
- [x] 5.5 Confirm a city can be renamed while `All places` is selected, and that editing a city other than the selected one moves neither the selection nor the camera

## 6. Specifications and the record

- [x] 6.1 Run `openspec validate give-the-phone-a-city-picker` and fix anything it reports
- [x] 6.2 Rewrite the paragraph in `openspec/ROADMAP.md` under "Either application is sufficient on its own" that records declining the phone's selected city — say it was reversed and why, rather than deleting it
- [x] 6.3 Note in `ROADMAP.md`'s "Not built yet" entry on remembering a preference that a third thing now wants one
- [x] 6.4 Check whether `AGENTS.md` needs anything: add only a gotcha that actually cost time during this change — nothing qualified. The one trap found (`fitBounds` answers an empty set with `DEFAULT_CAMERA`, so an unguarded frame call flies somewhere arbitrary) was caught while writing rather than by debugging, and is commented at the call site in `trip-map.tsx`

## 7. Look at both applications

> **How the phone was looked at.** The dev client on the simulator was a stale native
> binary and died on `TurboModuleRegistry.getEnforcing(...): 'PlatformConstants'`;
> `expo run:ios` rebuilt it and cleared that. `simctl` has no touch injection and
> `osascript` lacks assistive access on this machine, so states that need a tap were
> reached by seeding them in code, reloading, screenshotting, and restoring the files
> from backup — verified byte-identical by md5 afterwards. That exercises rendering and,
> where the seed called `selectCity`, the real framing path; it does not exercise the
> tap handlers themselves, which are covered by types and by web parity.

- [x] 7.1 Run `pnpm verify` — the root script that runs everything CI does, which exists because `typecheck` is web-only and `typecheck:mobile` is mobile-only
- [x] 7.2 Open the phone: pick a city and watch the camera frame it above the toolbar; pick one with no places and watch the camera stay put; pick `All places` and watch the whole trip come back
- [x] 7.3 On the phone, search for a place with a city selected and confirm the results are biased toward that city's markers rather than the visible map — **not observed end to end**: reaching the search screen needs a tap. `computeBias` mirrors web's and is covered by types; the branch is the one `place-search` already required
- [x] 7.4 On the phone, confirm selecting a city hides nothing — the other cities' pins are still drawn where they fall on screen — **partly**: with one city seeded the frame zooms past the trip's other marker, which is the mock's own finding. Nothing in `selectCity` touches the drawn set
- [x] 7.5 Open the laptop: rename a city while `All places` is selected, and rename one that is not the selected city, confirming the camera does not move either time — the editor opens under Kyoto while `All places` is selected, which is both cases at once and the state that previously offered no way in at all; camera unmoved
- [x] 7.6 Look at both applications in **both themes**, at a phone width and a laptop width, with a long trip name beside a long city name
- [x] 7.7 Rebuild the mock (`python3 openspec/changes/give-the-phone-a-city-picker/mock/build-mock.py`) and compare what shipped against it, recording any place they diverge and why
