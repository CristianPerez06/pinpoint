## 1. The shared dim

- [x] 1.1 Add `scrim: { light: '#00000063', dark: '#00000063' }` to the UI colours in `packages/tokens/src/colour.ts`, with a comment saying what it is for (behind anything raised over a screen that steps back), run the derive script, and verify `pnpm check:tokens` passes and `--pp-scrim` and `colour.scrim` appear in the generated output
- [x] 1.2 Replace both `#00000063` literals in `apps/web/app/_components/ui.module.css` with `var(--pp-scrim)` and verify `grep -rn 00000063 apps/web` finds nothing

## 2. Laptop

- [x] 2.1 Change `.panel`'s background in `apps/web/app/_components/trip-calendar.module.css` from the ground wash to `var(--pp-scrim)`, update its comment, and verify the fade-in/out rules beside it are untouched

## 3. Phone

- [x] 3.1 Give `DayField`'s `dayBackdrop` in `apps/mobile/components/ui.tsx` the `scrim` colour, and fix the stale header comment that still calls the iOS picker "the platform's own control". Verify by typecheck
- [x] 3.2 Add an optional `dimBehind` prop to `MarkerDetails` (`apps/mobile/components/marker-details.tsx`) that draws a full-screen `scrim` `Pressable` behind the sheet, calling `onDismiss` and entering/leaving with the sheet. Without the prop, nothing changes on the map. Verify by typecheck
- [x] 3.3 Add the same prop to `MarkerFormSheet` (`apps/mobile/components/marker-form.tsx`). The dim swallows presses and does nothing. Keep the `KeyboardAvoidingView` a bare positioner (see `AGENTS.md`). Verify by typecheck
- [x] 3.4 Pass `dimBehind` to both from `apps/mobile/components/trip-calendar.tsx` only, and verify `grep -rn dimBehind apps/mobile` shows no other caller

## 4. Looking at the running apps

- [x] 4.1 Laptop, light and dark: open a place from a day and from the waiting list. The calendar darkens rather than fading white, clicking the dark area closes it without opening the row under it, and Escape closes it
- [x] 4.2 Laptop, light and dark: edit a place from the calendar with a change made, click the dark area, and confirm it asks before discarding. Open its day field and confirm the form darkens behind the date calendar while the screen behind stays readable
- [x] 4.3 Phone (iOS), light and dark: open a place from the calendar. The calendar darkens, a tap on the dark area closes it and doesn't open the place underneath, and the dim slides away with the sheet
- [x] 4.4 Phone (iOS), light and dark: edit a place from the calendar. The calendar darkens and a tap on the dark area does nothing. Open the day field: the form darkens behind the date calendar, and a tap outside the date calendar closes it
- [x] 4.5 Phone (iOS): open each of the other three date fields (trip dates in the trips sheet, trip dates when creating a trip, the day band on the calendar) and confirm each darkens behind the date calendar
- [x] 4.6 Phone (iOS): on the map, open a place and start saving one, and confirm neither dims the map and the map still takes taps above the sheet
- [ ] 4.7 Android: open a date field and confirm the system dialog still dims on its own, and open a place from the calendar and confirm it darkens — not done: no Android emulator or build was available; archived without it at the user's request
- [x] 4.8 On the dark ground on both apps, judge whether the dim is enough to separate the layers. If not, deepen only the `dark` half of `scrim` and re-run 1.1's check

## 5. Done

- [x] 5.1 Run `openspec validate dim-behind-calendar-overlays --strict` and `pnpm verify`, and both pass
