## 1. The shared draft

- [x] 1.1 Add `allDay` to `HoursDraft` and `EMPTY_HOURS_DRAFT` in `packages/core/src/opening-hours.ts`. `splitHours` sets it when the stored times are equal and keeps the stored range. Verify with a test in `opening-hours.test.ts` that 09:00–09:00 on Mon–Fri opens with `allDay` on and range `['09:00','09:00']`.
- [x] 1.2 Make `joinHours` with `allDay` on write the draft's range when it is already two equal times, and `00:00–00:00` otherwise. Verify with tests that a 09:00–09:00 place round-trips unchanged, that `allDay` over `['09:00','17:00']` saves 00:00–00:00, and that no day on still saves null.
- [x] 1.3 Add `setAllDay(draft, on)`. Turning it off gives back the range unless that range is two equal times, in which case both fields are emptied. Add `setEveryDay(draft)`: all seven days on, or all off when all seven are already on. Export both from `packages/core/src/index.ts`. Verify with tests covering each scenario in the spec delta.
- [x] 1.4 `pnpm --filter @pinpoint/core test` and `pnpm typecheck` pass. Any site that builds a `HoursDraft` by hand now includes `allDay`.

## 2. Words

- [x] 2.1 Add `hoursField.everyDay` (`Every day` / `Todos los días`) and `hoursField.allDay` (`24 hours` / `24 horas`) to `packages/wording/src/english.ts` and `spanish.ts`. Update the `say.test.ts` snapshot. Verify with `pnpm check:wording`.

## 3. The phone

- [x] 3.1 In `apps/mobile/components/hours-field.tsx`, put the hint line and an `Every day` pill in one row: the hint takes the remaining width and wraps, the pill is drawn like a selected day letter when all seven are on, 32 tall with `hitSlop` to 44, and `accessibilityState.selected`. Tapping it calls `setEveryDay`.
- [x] 3.2 Add React Native's `Switch` labelled `24 hours` at the right of the times row (track `accent` on, `lineStrong` off), shown only once a day is on. While it's on, replace the two `TimeInput`s and `to` with `Open all day` and hide the next-day hint. Toggling calls `setAllDay`.

## 4. The laptop

- [x] 4.1 In `apps/web/app/_components/hours-field.tsx` and its stylesheet, add the `Every day` pill beside the hint (`aria-pressed`, the same on-state as `.day[aria-pressed='true']`) wired to `setEveryDay`.
- [x] 4.2 Add a `button role="switch" aria-checked` labelled `24 hours`, with a 44×26 track in `accent` / `line-strong`, wired to `setAllDay`. It replaces the times with `Open all day` while on. Give the times row `flex-wrap: wrap` so the switch drops below the times on the narrow card instead of squeezing them.

## 5. Checking it

- [x] 5.1 `pnpm lint` passes (no literal words in either field) and `pnpm verify` passes.
- [x] 5.2 In the running phone app, in English and Spanish, on both grounds, check each spec scenario:
  - Every day on and off.
  - 24 hours on, saved, reopened.
  - Typed times given back when 24 hours is turned off.
  - Nothing typed gives empty fields.
  - The switch and times fit on one line in Spanish on a 375-point phone.
- [x] 5.3 In the running laptop app, at the narrow and the wide card, on both grounds, in both languages, run the same checks. Confirm the switch wraps below the times on the narrow card rather than overlapping them, and that the switch can be reached and toggled with the keyboard.
- [x] 5.4 On both apps, a place saved before this change with 09:00–09:00 opens with 24 hours on, and saving it after changing only its note leaves 09:00–09:00 in the database.
- [x] 5.5 `openspec validate hours-in-one-tap --strict` passes.
