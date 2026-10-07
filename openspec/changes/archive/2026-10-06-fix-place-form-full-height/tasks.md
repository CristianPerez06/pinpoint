## 1. The height

- [x] 1.1 Add a pure `fullHeight` to `apps/mobile/lib/sheet-height.ts` — the full height capped by the room in the space the sheet stands in less the gap, never below the lower height — with cases in `sheet-height.test.ts` for a room that fits, a room that does not, an iPhone SE, and no measurement yet; verify with `pnpm --filter mobile test`
- [x] 1.2 In `marker-form.tsx`, take the full detent from `fullHeight` using the measured host frame and `SPACE.lg`, so the drag clamp, `settle`, and the return from the keyboard all use it; verify with `pnpm typecheck:mobile` and lint

## 2. On the device

- [x] 2.1 iOS simulator, regular phone (iPhone 17, dark): Drop → *Use this spot*, drag to full height; the handle and title are below the header and the handle drags it back down. (The simulator's mouse drag did not reach the handle here, so the full height was checked by opening the form at it with a temporary local edit, since reverted. Editing a place from the calendar uses the same form and was not opened separately.)
- [x] 2.2 iPhone SE simulator (light): the same check, by real drags up and down
- [x] 2.3 Android emulator (Medium Phone, light): the same check, by real swipes up and down

## 3. Done

- [x] 3.1 `pnpm verify` passes and `openspec validate fix-place-form-full-height --strict` passes
