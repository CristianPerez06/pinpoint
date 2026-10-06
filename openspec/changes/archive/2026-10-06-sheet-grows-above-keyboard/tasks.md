## 1. The shared height

- [x] 1.1 Add `lib/sheet-height.ts` with the pure "room above the keyboard" function and a `sheet-height.test.ts` covering keyboard down, a typical phone, an iPhone SE (667 pt window, 216 pt keyboard) and a sheet resting taller than the room (it comes down to the room); verify with `pnpm --filter mobile test`
- [x] 1.2 Add `useKeyboard` and `useSheetHeight(resting, open)` to `components/sheet.tsx`: will-events on iOS, did-events on Android, listeners removed on unmount; verify with `pnpm typecheck:mobile`

## 2. The fixed-height sheets

- [x] 2.1 Cities, people, trips: take the height from `useSheetHeight`, drop `insets.bottom` from the bottom padding while the keyboard is up, animate with the keyboard's duration; keep the `KeyboardAvoidingView` bare. Verify with `pnpm typecheck:mobile` and lint
- [x] 2.2 Currency picker: the same, its own 0.8 resting height fed through `useSheetHeight`; verify with `pnpm typecheck:mobile`

## 3. The place form

- [x] 3.1 While the keyboard is up, lift the form by its measured keyboard overlap and animate the form's height to the grown height over the keyboard's duration, and back to `heights[detent]` when it goes down, without calling `onHeight` for the grown height; verify the camera does not move when typing starts (task 4.2)
- [x] 3.2 Dismiss the keyboard when a drag starts on the grabber, then settle as now; verify by dragging while typing on the device

## 4. On the device

- [x] 4.1 iOS simulator (dark; light covered on Android): open cities (new city), people (invite), trips (name), the currency picker from a new city; press into each field and check the sheet fills the room above the keyboard and returns to half the screen when it goes down. (Checked from still screenshots, so whether it moves in step with the keyboard is not judged; the picker opened from the place form was not opened separately.)
- [x] 4.2 Place form: open it at its lower height, press into the name, check it grows, the map behind does not move, and it returns to the lower height afterwards; repeat from the full height
- [x] 4.3 iPhone SE simulator (light): people sheet, press into the email field; the field, the title and Add are visible. If the field is hidden, add scroll-into-view for that form and note it in `design.md`. (Visible without it; Trips and the place form also checked there.)
- [x] 4.4 Android emulator: repeat 4.1 for one sheet and 4.2, checking the grown height is correct under edge-to-edge

## 5. Done

- [x] 5.1 `pnpm verify` passes and `openspec validate sheet-grows-above-keyboard --strict` passes
