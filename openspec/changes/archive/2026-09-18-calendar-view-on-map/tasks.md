## 1. Shared

- [x] 1.1 Move `CalendarView` (`'days' | 'waiting'`) into `@pinpoint/core` beside `dayShown`, with `calendarViewShown(asked)` that falls back to `'days'` for anything else; remove both apps' local copies. Verify with a unit test in `marker-day.test.ts` covering `'waiting'`, `'days'`, missing and junk values.

## 2. The card's extra action

- [x] 2.1 Web `marker-details`: an optional `extraAction: { label, onClick }` rendered as a quiet button in the right-aligned slot `← Others at this point` uses, replacing it when passed. Verify `pnpm typecheck` passes and the card is unchanged where it is not passed.
- [x] 2.2 Mobile `marker-details`: the same optional action, as the full-width outlined button beneath Edit and Remove, replacing `← Others at this point` when passed. Verify `pnpm typecheck:mobile` passes and the sheet is unchanged where it is not passed.

## 3. Web

- [x] 3.1 Calendar: write `view` into the address beside `day` (same `history.replaceState`) and seed the tab from it with `calendarViewShown`. Verify by switching to No day yet at phone width, reloading, and landing on that tab.
- [x] 3.2 Calendar: pass "View on map" to the card, pushing the workspace address plus `place=<id>&from=calendar`. Verify the address after pressing it.
- [x] 3.3 Workspace: on arrival with `place`, open it through the search path (`reveal: true`, same camera move), mark the panel as arrived from the calendar, then strip `place` and `from` with `history.replaceState`. Verify a place the filter hides opens, is drawn, and says so; the filter is unchanged; reloading afterwards shows the ordinary map.
- [x] 3.4 Workspace: while that panel is open, pass "← Back to Calendar" (`router.back()`) to the card; any change of panel drops it. Verify closing the card removes the button, and opening another pin shows none.

## 4. Mobile

- [x] 4.1 Calendar: seed day and tab from `day` / `view` route params via `dayShown` and `calendarViewShown`. Verify opening it from the trip menu still lands on the opening day and the Days tab.
- [x] 4.2 Calendar: pass "View on map" to the sheet — leave a note (place, trip, day, view) in `lib/calendar-detour.ts` and go back to the map. Verify the map shows that place's sheet with the pin above it.
- [x] 4.3 Workspace: take the note once, open it through the search path, and keep `day` / `view` on the details panel as "arrived from the calendar". Verify a place the filter hides opens, is drawn, and says so, with the filter unchanged.
- [x] 4.4 Workspace: while that panel is open, pass "← Back to Calendar", pushing `/calendar` with `day` and `view`; any change of panel drops it. Verify closing the sheet removes the button.
- [x] 4.5 Workspace: saving an edit started from the map's sheet closes the sheet, as the laptop does. Verify: edit a place on the phone's map, save, and the map is unobstructed; the calendar's own edit still returns to its card.

## 5. Look at the running apps

- [x] 5.1 Web at laptop width, both themes: from a day that is not the opening day, View on map → pin clear of the card → Back to Calendar → same day, no card open. Check the long-name worst case and how the action row wraps.
- [x] 5.2 Web at phone width, both themes: the same from the No day yet tab lands back on that tab.
- [x] 5.3 Mobile simulator, both themes: the same two round trips, from Days and from No day yet.
- [x] 5.4 Both apps: mark the place visited on the map, go back, and see it shown as visited without a manual re-read; saving an edit on the map closes the card and leaves no Back to Calendar.
- [x] 5.5 Both apps: a place sharing its point with another shows only `← Back to Calendar`; after closing, selecting the point offers every place there.
- [x] 5.6 Both apps: the calendar's "Back to the map", and opening a pin or search result on the map, behave as before and offer no Back to Calendar.

## 6. Finish

- [x] 6.1 `openspec validate calendar-view-on-map --strict` and `pnpm verify` pass.
