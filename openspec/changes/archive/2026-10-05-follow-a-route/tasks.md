## 1. The reload from #282

- [x] 1.1 Import Ferrostar eagerly from a route file in a development build, press *Calculate route* repeatedly, and read the log around any reload. Done on the Android emulator (the iOS simulator could not be driven from here): no reload, same process throughout. Verify by the result being in `findings.md` and `AGENTS.md`.
- [x] 1.2 Act on 1.1 as `design.md` says. No crash to report, so no blocker: lazy loading stays, and the gotcha in `AGENTS.md` now names where to look if it returns. Verify the eager import is reverted (no `@stadiamaps` import outside `components/following/`).

## 2. Shared pieces

- [x] 2.1 Add `handoffUrl(app, to, mode, name?)` to `@pinpoint/routing` with tests for Google (three modes), Apple (walk, car, and bike with no `dirflg`), and `geo:` with an encoded name. Verify `pnpm --filter @pinpoint/routing test` passes.
- [x] 2.2 Add `formatTimeLeft(language, minutes)` to `@pinpoint/core` with tests (rounding, never under 1, minutes / hours / hours-and-minutes, Spanish). Verify the core tests pass.
- [x] 2.3 Add the `follow.*`, `route.openIn*` and `handoff.*` sentences in English and Spanish (impersonal), and remove `trial.follow.*`. Verify `pnpm check:wording` passes once the apps use them.

## 3. Open in another maps app

- [x] 3.1 Phone: add *Open in…* to the route card (beside where *Start* will go, alone with the straight line), opening a `sheet.tsx` choice of Google Maps plus Apple Maps (iOS) or *Another maps app* (Android), and a close. Each choice opens via `Linking.openURL(handoffUrl(...))`. Verify `pnpm typecheck:mobile` passes.
- [x] 3.2 Laptop: add *Open in Google Maps* to the route card as a new-tab link with an accessible name naming the place. Verify `pnpm typecheck` passes and the link's `href` carries the destination and travel mode.

## 4. Following on the phone

- [x] 4.1 Add `expo-keep-awake` to `apps/mobile/package.json` and a `no-restricted-imports` rule allowing `@stadiamaps/*` only under `components/following/`. Verify `pnpm install` and lint pass, and lint fails on a test import placed elsewhere.
- [x] 4.2 Create `components/following/route-provider.ts`: the custom route provider (Stadia, then FOSSGIS Valhalla with headers), each bounded by `ROUTE_TIMEOUT_MS`, with "no route" stopping the chain. Verify with a unit test over a fake fetch covering the fallback, the timeout and the no-route cases.
- [x] 4.3 Create `components/following/follow-view.tsx`: the Ferrostar provider, `expo-location` feeding positions (paused in the background via `use-active-again`), keep-awake, the turn card (maneuver glyph record, distance, the router's instruction, announced on change), the bottom bar (time and distance left, place name, arrival time, *Stop*), and the off-route states. Verify `pnpm typecheck:mobile` and lint pass.
- [x] 4.4 Wire it into `trip-map.tsx`: *Start* in the route card (street route only, busy while waiting, a line when it cannot start), `following` state, `FollowView` loaded with `lazy()`, details and chrome hidden, pin presses ignored, Ferrostar's line drawn in place of the calculated one, the camera following with `offsetCenter`, the recentre control after a drag, and one `endFollowing` for *Stop* and arrival (route cleared, details reopened, arrival note). Verify `pnpm typecheck:mobile` passes.
- [x] 4.5 Delete `app/dev/follow.tsx` and `components/follow-trial.tsx`. Verify no file references them (`grep -r follow-trial apps/mobile` is empty).

## 5. Check the running apps

- [x] 5.1 Android emulator development build, light ground, English: calculate a walking route, press *Start*, and move the emulator's location along the route (`adb emu geo fix`). Verify the camera follows, the turn card and bar update, and the dot is not under the card or bar.
- [x] 5.2 Same run: move about 150 m off the line. Verify a new line replaces the old one. Then turn the network off and leave the route again; verify the "no new route found" line and the old line staying, and a new route once back online.
- [x] 5.3 Same run: drag the map, verify the recentre control appears and works; press *Stop*, verify the details are back with *Calculate route*; start again and reach the place, verify the arrival note and the details coming back with the place in view.
- [x] 5.4 Dark ground and Spanish: start following again. Verify the card and bar are legible and every product word is Spanish, with the router's instruction in its own Spanish.
- [x] 5.5 Verify no reload: open a place and press *Calculate route* repeatedly, clearing and changing the way of travelling between, without starting. The app does not restart (Android emulator).
- [x] 5.6 iOS simulator, by hand (it could not be driven from here): calculate a route a few times without starting (no reload); press *Start* and see the card and bar; *Open in…* → Google Maps (the website, on the simulator) and Apple Maps (opens on the place).
- [x] 5.7 Android emulator: *Open in…* → *Another maps app* hands the place to the device's maps app, named; → *Google Maps* opens directions to it. Screen-on cannot be checked in a development build (`findings.md`).
- [x] 5.8 Laptop: *Open in Google Maps* opens a new tab with the destination and mode, and the route stays drawn. Verify in the browser on both grounds.

## 6. Finish

- [x] 6.1 Run `pnpm verify` and `openspec validate follow-a-route --strict`. Verify both pass.
