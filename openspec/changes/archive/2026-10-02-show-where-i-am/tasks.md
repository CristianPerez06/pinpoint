## 1. Shared pieces

- [x] 1.1 Add `accuracyRadiusPx(metres, latitude, zoom)` to `packages/map/src/camera.ts`, exported from the package index, with tests covering the equator, a high latitude, and doubling per zoom step; verify with `pnpm --filter @pinpoint/map test`
- [x] 1.2 Add the `WhereAmIStatus` type (`idle | finding | found | refused | notFound`) to `@pinpoint/map` and export it; verify with `pnpm typecheck` and `pnpm typecheck:mobile`
- [x] 1.3 Add the dot's size (22) to `packages/tokens/src/layout.ts` beside `MARKER_SIZE`, then regenerate; verify with `pnpm check:tokens`
- [x] 1.4 Add `map.whereAmI`, `map.locationOff`, `map.locationBlocked` and `map.locationNotFound` to `english.ts` and `spanish.ts`, written out and impersonal in Spanish; verify with `pnpm check:wording` once they are used (after groups 2 and 3)

## 2. Phone

- [x] 2.1 Install `expo-location` with `pnpm --filter mobile exec expo install expo-location`. Add its config plugin to `app.json` with the English `locationWhenInUsePermission`, and add `apps/mobile/locales/es.json` for the Spanish prompt sentence. Verify that `pnpm install --frozen-lockfile` passes and the root `package.json` is unchanged (`node .github/scripts/check-root-prebuild.mjs`)
- [x] 2.2 Write `apps/mobile/lib/where-am-i.ts`. It asks for permission on the first `locate()`, gets one fix with a 15 s bound, starts the watch after the first success, pauses the watch outside `active` and resumes it on return, and reports `refused` when permission is denied (including "can't ask again"). Verify with a unit test of the status transitions, with `expo-location` mocked
- [x] 2.3 In `trip-map.tsx`, add the round 44-point button between zoom and the re-read in `styles.edge`, styled like `styles.reread`. Use the crosshair and filled-crosshair glyphs from `lucide-react-native` (`locate`, `locate-fixed`), show an `ActivityIndicator` while finding, and set `accessibilityState.busy`. Verify the order and spacing by looking at it in the simulator
- [x] 2.4 On success, call the existing `flyTo(position)` and set "on you". Clear it on a camera move with `isUserInteraction`. Verify on the simulator by panning after a press and watching the glyph return to an outline
- [x] 2.5 Draw the dot, plus the accuracy circle when `accuracyRadiusPx` is larger than the dot's radius, as `MapLibreMarker`s rendered before the pins, with no press handling. Verify that a pin on top of the dot can still be pressed
- [x] 2.6 Show the refused note with `MarkersOverlayNote`'s own `onPress` → `Linking.openSettings()`, and the not-found note as dismissible. Both clear on success. Verify each on the simulator, refusing through Settings → Privacy → Location
- [x] 2.7 Build a fresh development build (`pnpm --filter mobile exec expo prebuild`, then run iOS). Before testing, check `xcrun simctl listapps booted | grep -i pinpoint` shows only `ar.com.pinpoint.app`

## 3. Laptop

- [x] 3.1 Write `apps/web/lib/where-am-i.ts` on `navigator.geolocation`, with the same status shape, the 15 s timeout, a pause on `visibilitychange`, and `PERMISSION_DENIED` mapped to `refused` and the other errors to `notFound`. Verify with unit tests of the shared `locate()` in `@pinpoint/map`, including a refusal raised from the position call (the web app has no test runner), and in the browser with a stubbed `navigator.geolocation`
- [x] 3.2 In `trip-map.tsx` and `trip-map.module.css`, add the round 34-pixel button above zoom in `.edge`, styled like `.reread` but always shown. It uses `aria-busy` while finding and `aria-disabled` rather than `disabled`, as zoom does. Verify by keyboard: Tab reaches it, and Enter presses it
- [x] 3.3 On success, move the camera through the existing `frameAround` path with the measured floor, and set or clear "on you" from user-started `dragstart`/`zoomstart`. Verify in the browser
- [x] 3.4 Draw the dot and accuracy circle as style layers from the shared `locationLayers`, re-added on `styledata`. Show the blocked and not-found notes through the workspace's existing note. Verify both notes in the browser

## 4. Rules and checks

- [x] 4.1 Run `openspec validate show-where-i-am --strict` and fix anything it reports
- [x] 4.2 Run `pnpm verify` and confirm it passes

## 5. Look at the running apps

- [x] 5.1 Phone, light and dark: at rest, first press with the prompt, finding, found, approximate (Precise Location off), refused with the note opening Settings, and not found (location services off). Compare each with the mockup's screens 1–7
- [x] 5.2 Phone: simulate a walk (Simulator → Features → Location → City Walk) and confirm the dot moves while the map stays still. Send the app to the background and back, and confirm it resumes
- [x] 5.3 Phone: set a simulated location far from the trip (for example Buenos Aires for a Kyoto trip), press, and confirm the map goes there
- [x] 5.4 Laptop, light and dark, at a laptop width and at a phone width (where the re-read shows and the order is zoom, "where am I", re-read): first press, found with its circle, and refused
- [x] 5.5 Both apps in Spanish: the label and all three notes read in Spanish
