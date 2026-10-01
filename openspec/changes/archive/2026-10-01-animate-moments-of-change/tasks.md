## 1. Shared values and the globe's frames

- [x] 1.1 Add `turn: 4000` to `DURATION` in `packages/tokens/src/motion.ts`, documented as the one duration that is a period, and add a non-themed `MARK_LAND = '#B8741A'` beside the mark's values; regenerate and verify `pnpm check:tokens` passes and `tokens.css` carries `--pp-duration-turn: 4000ms`
- [x] 1.2 Make `apps/mobile/lib/splash/scene.ts` read `MARK_LAND` instead of its own literal; verify `pnpm typecheck:mobile` and the land tests pass
- [x] 1.3 Add a globe renderer, `.github/scripts/icon-globe.mjs` beside `icon-mark.mjs`, (72 frames of one turn, orthographic, the opening's tilt, the mock's light; 9 × 8 grid of 144px frames; sphere `accent.light`, continents `MARK_LAND`, no pin) reading the land mask from `land.generated.ts`; verify with a unit test in `icon-mark.test.mjs` that frame 0's centre pixel is land or sphere colour as the mask says, and that the corners are transparent
- [x] 1.4 List `apps/web/public/globe.png` (96px frames, 2×, 211 KB) and `apps/mobile/assets/globe.png` (144px frames, 3×, 365 KB) in `icon-assets.mjs`, run `build-icons.mjs`, and verify `pnpm check:icons` passes; drop to 48 frames if either is over 400 KB

## 2. Laptop: surfaces open and close

- [x] 2.1 Add `usePresence(open)` in `apps/web/lib/use-presence.ts` (mounted, `data-surface` open/closing, `data-entered` after the first frame, cleared on `transitionend` with a timeout of the closing duration as a backstop, `inert` while closing, reopening from where it is) and `Presence`/`useSurface` in `ui.tsx`; the laptop has no unit-test runner, so verify in the browser: close, reopen while closing, and a panel never stuck on the page
- [x] 2.2 Add the surface styles to `ui.module.css` (`@starting-style` entry, 16px rise, direction by one custom property, opening `arrive`/`settle`, closing `standard`/`standard`, all through the tokens) and apply them to `overlayPanelClass`; verify in the browser that details and the add/edit form rise into the corner and leave, in the workspace and the calendar
- [x] 2.3 Put the bar's shared `Menu` panels and the search results on the same presence and styles, hanging downward (the currency list is left alone: it sits inside the form and pushes it down rather than opening over the screen); verify in the browser that the filter panel, account menu and search results each open and close with the motion, and that a click where a closing panel was reaches what is beneath it
- [x] 2.4 Make the `drop` keyframes in `pin.module.css` read `--pp-duration-arrive` and `--pp-ease-overshoot` instead of literals; verify the draft pin still drops as before

## 3. Phone: one sheet, and the details sheet

- [x] 3.1 Spike: inside a v11 `Marker`, scale and fade a `Pin` view with Reanimated, on the iOS simulator and the Android emulator; verify it is drawn as it changes on both. If it is not, stop and report it as a blocker before 5.2 and 5.3
- [x] 3.2 Add `components/sheet.tsx`: a `Modal` with `animationType="none"`, edge and floating placements, Reanimated slide (edge) or rise-and-fade (floating) with the tokens, a fading backdrop, kept visible until its closing animation ends, opacity only over `brief` under `useReducedMotion()`; verify `pnpm typecheck:mobile` and `pnpm lint:mobile` pass
- [x] 3.3 Move the filter, search, trip, city, people, menu, attribution and currency sheets onto `Sheet` (edge), keeping each one's `KeyboardAvoidingView` as a bare positioner with the surface inside it; verify each on the device opens, closes, and with the keyboard up keeps its bottom padding
- [x] 3.4 Move the date picker in `ui.tsx` onto `Sheet` (floating); verify it rises and fades in and out
- [x] 3.5 Give the details sheet `entering`/`exiting` built from the same tokens by the helper `Sheet` uses; verify on the device that it slides up from the edge and leaves, in the workspace and the calendar

## 4. The turning globe

- [x] 4.1 Laptop: draw the globe in `LoadingState` in place of the spinner (`globe.png` stepped through by two `steps()` animations over `--pp-duration-turn`, the pin drawn on top from `MARKER_PATH` and `MARKER_HOLE` in `inkOnAccent.light`), keeping the words and `role="status"`; verify in the browser on both grounds, and that it stands still with reduce motion forced
- [x] 4.2 Phone: the same in `LoadingState` with a clipped `Image` of `globe.png` stepped by a Reanimated value over `DURATION.turn`, still under `useReducedMotion()`; verify on the device on both grounds and with reduce motion on
- [x] 4.3 Verify the small spinners inside controls (saving, signing in, the reread button) are unchanged on both apps

## 5. Pins arriving and leaving

- [x] 5.1 Phone: give `DraftPin` the drop through Reanimated `entering` (`arrive`, `overshoot`, 14px), keyed so moving it or saving the place does not replay it; verify on the device beside the laptop in slow motion that the two drop alike
- [x] 5.2 Pass the id of a successfully deleted place from each workspace to its map as `departing`, and on the laptop keep a vanished group that contained it for `standard` with a `leaving` class (fade, scale to 0.6 from the bottom centre) while every other vanished group goes at once; verify in the browser: deleting a lone place fades it, deleting one of two sharing a point lowers the count, a refused deletion leaves the pin, and filtering hides pins without a fade
- [x] 5.3 Phone: the same rule in `trip-map.tsx`, fading and scaling the `Pin` view with Reanimated; verify the same four cases on the device

## 6. Looking at the running apps

- [x] 6.1 Laptop, light and dark, reduce motion off and on: compare each moment with `mock/index.html` side by side, including dismissing a panel while it is still opening
- [x] 6.2 iOS simulator and Android emulator, light and dark, reduce motion off and on: the same comparison, with every sheet opened once and the keyboard raised in the ones that type
- [x] 6.3 Run `pnpm verify` and `openspec validate animate-moments-of-change --strict`; verify both pass
