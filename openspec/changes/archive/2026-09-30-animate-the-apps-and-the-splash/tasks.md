## 1. Shared values

- [x] 1.1 Add `packages/tokens/src/motion.ts` with `DURATION`, `EASING` (four control points each) and `SPRING` (`damping`, `stiffness`, `mass`), export them from `index.ts`, and choose the durations from the ones the laptop already uses; verify with `pnpm typecheck:packages`
- [x] 1.2 Extend `packages/tokens/scripts/derive.ts` to emit `--duration-*` (ms) and `--ease-*` (`cubic-bezier(...)`) into `src/generated/tokens.css`, run the derive, and verify `pnpm check:tokens` passes on the regenerated output
- [x] 1.3 Move the hole to `MARKER_HOLE` in `packages/tokens/src/layout.ts`, make `.github/scripts/icon-mark.mjs` read it with the same fail-loudly reader as `MARKER_PATH`, and verify `pnpm check:icons` passes with every committed icon unchanged

## 2. Phone dependencies and still launch image

- [x] 2.1 Install `react-native-reanimated`, `react-native-worklets`, `expo-gl` and `expo-splash-screen` with `pnpm --filter mobile exec expo install …`, plus `three` pinned exactly; the worklets Babel plugin is added by `babel-preset-expo` itself once the package is installed; verify `pnpm check:duplicate-deps` and `pnpm check:root-prebuild` pass and the root `package.json` is unchanged
- [x] 2.2 Add `splash-icon.png` (the drop on an amber circle, transparent outside) to `.github/scripts/icon-assets.mjs`, cut it with `node .github/scripts/build-icons.mjs`, and verify `pnpm check:icons` covers and passes it
- [x] 2.3 Configure the `expo-splash-screen` plugin in `apps/mobile/app.json` (light and dark background from `ground`, the new image, `imageWidth` from `SPLASH_SPHERE_WIDTH`), add the check that the two agree, and verify it fails when either is changed alone
- [x] 2.4 Uninstall any stale `com.pinpoint.app` from the simulator, rebuild the dev client from `apps/mobile`, and verify the still icon shows at launch on iOS and Android in light and dark appearance

## 3. The 3D scene

- [x] 3.1 Spike: render the amber sphere and a spinning camera in a `GLView` with `three` on a device, while the launch gate loads; verify it holds 60 fps on the Android emulator, or move the frame loop to a worklet before continuing — done on the Android emulator: steady frames in the release build, first frame 400–500 ms; the frame loop was not moved to a worklet. iOS: the simulator does not show the frames while the loop runs, and no physical iPhone was available; shipped unverified on iOS by decision (design.md, Risks)
- [x] 3.2 Write `apps/mobile/scripts/build-splash-land.mjs` (Natural Earth 1:110m land → 1024 × 512 run-length-encoded mask) and commit `apps/mobile/lib/splash/land.generated.ts`; verify a unit test that decodes it and finds land at Buenos Aires and sea at the middle of the Pacific
- [x] 3.3 Parse `MARKER_PATH` and `MARKER_HOLE` into the flat frame's shape and the 3D pin's proportions (head centre, head radius, hole radius, height); verify with a unit test that the head centre comes out at (16, 17.47) and the hole radius at 6/13 of the head's
- [x] 3.4 Build the scene from the mock (`mock/splash.html`): sphere, continents skin, flat pin, 3D pin with the hole drilled through, lights, rising camera; verify its first frame matches the still image by screenshot comparison on both platforms — Android: the handover from the still icon to the first 3D frame shows no jump in the recordings, light and dark. iOS: not comparable in the simulator (see 3.1)
- [x] 3.5 Put the full and short sequences' timings in one `SPLASH_TIMING` table, with the hard-stop bounce from `SPRING`; verify with a unit test that full steps 1–5 total at most 2.5 s, the exit at most 0.3 s, and the short version at most 0.7 s before the exit

## 4. Launch

- [x] 4.1 Add `openingPlayed` to `apps/mobile/lib/preferences.tsx`, read in the existing `multiGet`; verify it survives an app restart and a fresh install starts without it
- [x] 4.2 Replace `Blank` in `_layout.tsx` with the opening: `preventAutoHideAsync` at load, `hideAsync` after the first GL frame, the app mounted underneath once the gate opens, the globe holding still if the app is not ready, and step 6 when it is; verify on a device that the app's loading is not delayed and nothing loops while waiting — built with a two-step handover instead (design.md §7); verified on Android that the app loads underneath, the globe holds still, and nothing loops. iOS unverified (see 3.1)
- [x] 4.3 Choose full, short or still from `openingPlayed` and `useReducedMotion()`, and record `openingPlayed` only after the full version's last spin settles; verify that closing the app mid-opening plays the full version again next time
- [x] 4.4 Give the opening the accessibility label `app.name` through `useSay()`, and verify `pnpm check:wording` and `pnpm lint:mobile` pass

## 5. Laptop

- [x] 5.1 Confirm `apps/web/app/globals.css`'s reduced-motion rule covers every animation, including keyframes on pseudo-elements, and verify by turning on reduce motion in the browser and opening the filter bar, a pin and the calendar (verified by loading the real `globals.css` in Chrome with reduce motion forced: an infinite animation, one on a pseudo-element and a transition all collapse to 0.01ms and one iteration; the signed-in screens were not opened, since that needs an account)

## 6. Looking at the running apps

- [x] 6.1 iOS simulator, light and dark, first launch and second launch: compare against the mock side by side in slow motion, including the pin turning 3D, the hole staying visible, the three hard stops and the fade into the app — iOS simulator: the still image, dark appearance, reduce motion and the dark-app-on-light-phone handover are right; the 3D animation itself does not show in the simulator (see 3.1). Shipped unverified on iOS by decision
- [x] 6.2 Same on the Android emulator, and with reduce motion on in both: the icon stays still and fades
- [x] 6.3 Android 12+ emulator: confirm the system's launch-screen circle and the animated sphere coincide, with no jump at the handover
- [x] 6.4 Set the app to dark with the device on light, relaunch, and confirm the handover shows the expected background change and nothing else
- [x] 6.5 Remove "No splash screen" from `apps/mobile/EAS_SETUP.md`'s "Deliberately not configured" list, run `pnpm verify`, and run `openspec validate animate-the-apps-and-the-splash --strict`
