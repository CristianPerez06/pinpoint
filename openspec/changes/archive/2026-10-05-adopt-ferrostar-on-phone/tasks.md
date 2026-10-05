## 1. Build Ferrostar's packages

- [x] 1.1 Write `.github/scripts/build-ferrostar.sh`: check for `rustup` (with the iOS and Android targets), `cargo-ndk`, the Android NDK, Xcode and `bun`, and stop naming whatever is missing; check out `stadiamaps/ferrostar` at tag `0.57.0` into a temporary directory; build the bindings for iOS and Android in release mode and both packages' JavaScript; `npm pack` `uniffi` and `core`; print each archive's path and SHA-512. Verify by running it with one tool hidden from `PATH` (it names it and builds nothing), then for real (two `.tgz` files).
- [x] 1.2 Check that the `uniffi` archive contains `FerrostarRN.xcframework`, the Android `jniLibs` for every architecture, and the generated `src/`; and that the `core` archive contains `lib/` and `src/` and lists the bindings under `peerDependencies`, not `dependencies`. Verify with `tar -tzf`.
- [x] 1.3 Create the GitHub release `ferrostar-rn-0.57.0` on this repository, marked as a pre-release, with both archives attached and a note naming the source tag and the script. Ask before creating it. Verify by downloading both URLs with `curl` and no token.

## 2. Install them in the phone app

- [x] 2.1 Add both archives to `apps/mobile/package.json` by release URL, with a `comment:` explaining why and when they go; core's archive asks for the bindings as a peer, so the app supplies them and no override is needed. Verify `pnpm install` succeeds on a machine without Rust and the lockfile records both integrity hashes.
- [x] 2.2 Run `pnpm install --frozen-lockfile`, `pnpm check:duplicate-deps`, `pnpm check:cycles` and `pnpm check:root-prebuild`. Verify all pass, with one React and one React Native.
- [x] 2.3 Uninstall any old Pinpoint build from the simulator (`xcrun simctl listapps booted | grep -i pinpoint`), then `pnpm --filter mobile exec expo prebuild --clean` and build for iOS. Verify the build succeeds and the app opens to the map as before. If it cannot be made to build, go to 5.2 with the reason.
- [x] 2.4 Build for Android. Verify the build succeeds and the app opens to the map on an emulator.

## 3. The trial screen

- [x] 3.1 Add the `trial.follow.*` sentences to `@pinpoint/wording` in English and Spanish (impersonal): next turn, distance to it, finding a new route, simulate, real position, leave the route, start, stop. Verify `pnpm check:wording` passes once 3.3 uses them.
- [x] 3.2 Add `apps/mobile/app/dev/follow.tsx`, returning `<Redirect href="/" />` first when `__DEV__` is false. It reads `to` and `mode` from the link and nothing else in the app links to it. Verify by `grep` that no other file references `dev/follow`.
- [x] 3.3 On that screen, set up Ferrostar's core with its Valhalla adapter pointed at Stadia's `/route/v1` (key from `config.stadia.apiKey`, the mode's profile, the app's language), recalculation spaced at least 5 seconds apart, and a `ManualLocationProvider` fed from an `expo-location` watch that runs only while the screen is open. Add a switch to Ferrostar's `SimulatedLocationProvider` and a control that moves the simulated position 150 m off the line. Verify `pnpm typecheck:mobile` and `pnpm lint:mobile` pass.
- [x] 3.4 Draw Pinpoint's map with the route as `@pinpoint/map`'s street-route line and the person's dot as *where am I* draws it, the camera following the position, and a panel with the next instruction, the distance to it, and whether a new route is being found. Verify `pnpm typecheck:mobile` and `pnpm lint:mobile` pass.

## 4. Look at it running

- [x] 4.1 iOS simulator, development build, simulated position: open `pinpoint://dev/follow?to=…&mode=walking`. Verify the dot moves along the line, the instruction and distance change as turns pass, and the camera keeps the dot in view.
- [x] 4.2 Same screen: press the control that leaves the route. Verify the panel says a new route is being found, then a new line is drawn from the new position, and Stadia was asked once for it (network log).
- [x] 4.3 Same screen with the device's real or simulator-set position instead of the simulation. Verify the dot follows the position updates.
- [x] 4.4 Check 4.1 on the light and the dark ground, and in Spanish. Verify the line, the dot and the panel are readable on both, and the panel's words are Spanish.
- [x] 4.5 Android emulator: repeat 4.1 and 4.2. Verify the same behaviour.
- [x] 4.6 Build a release configuration for iOS and open the same link. Verify the map opens and nothing of the trial screen is drawn.
- [x] 4.7 In the normal app, *Calculate route* to a place on foot, by bike and by car. Verify it behaves exactly as before.

## 5. Record the outcome

- [x] 5.1 Look up Stadia's current free allowance and work out the cost of an hour of following on foot with a few dozen recalculations. Verify the figure and its source are in the comment for 5.2.
- [x] 5.2 Comment on #279 with the verdict: Ferrostar works under Pinpoint's map (or why it does not, and which alternative comes next), the request cost from 5.1, how to open the trial screen, and what #279 still has to decide, including that Valhalla's Spanish addresses the reader. Verify the comment is posted.
- [x] 5.3 Add a gotcha to `CLAUDE.md` only if the build in 2.3 or 2.4 hit something that cost real time, in the file's existing form. Verify the entry names the symptom and the fix.
- [x] 5.4 Run `pnpm verify` and `openspec validate adopt-ferrostar-on-phone --strict`. Verify both pass.
