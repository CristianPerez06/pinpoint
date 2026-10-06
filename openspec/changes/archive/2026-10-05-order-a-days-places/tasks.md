## 0. Look first

- [x] 0.1 Build an HTML mock of a calendar day with drag handles (laptop and phone widths, a long name, a run row, a visited row) and of numbered pins (1, 9, 12, 24) across several types, solid and visited, on both themes. Show it to the user and wait for approval before section 4. (Approved: handle at the start of the row; pin style A, the number straight on the pin's colour.)

## 1. Database

- [x] 1.1 Add the migration from design decisions 1–2: `day_orders` table, policies for members, grant, the trigger on `markers` (join appends and creates the row, leave removes, delete removes), and the backfill in name order. Verify `pnpm check:tables` passes.
- [x] 1.2 Regenerate `packages/supabase/src/database.types.ts` and verify it typechecks.
- [x] 1.3 Probe the trigger with a rolled-back `do $$ … raise exception 'RESULT: %'` block: give a place a day (it goes last), move it to another day (gap closes, last there), extend a run (last on the new days), shorten it, clear its day, delete it. Verify each result matches the scenarios in `specs/trip-calendar`.
- [x] 1.4 Probe the backfill against the seed data: verify every day holding places has a row, and that its order equals the order `groupMarkersByDay` gives today.

## 2. Shared logic

- [x] 2.1 `@pinpoint/core`: `groupMarkersByDay` takes day orders and orders each day by them, with unlisted places after by name then id (design decision 3); add `positionsOnDay`. Verify with unit tests: no row = today's order, unlisted goes last, ids not on the day ignored, a run with different positions on different days.
- [x] 2.2 `@pinpoint/data`: `fetchTripDayOrders` and `saveDayOrder` (one upsert), returning the usual write outcome. Verify with tests alongside `writes.test.ts`.
- [x] 2.3 `@pinpoint/map`: optional `position` on `MarkerViewInput`/`MarkerView`. Verify with a `marker-view` test that it is carried, and absent when not given.
- [x] 2.4 `@pinpoint/wording`: handle label, move up, move down, the position announcement, the drag announcements web needs, "the order could not be saved", "reordering needs a connection", and a pin's spoken name with its position — English and Spanish (impersonal). Verify `pnpm check:wording`.

## 3. Reading and keeping the order

- [x] 3.1 Web: read day orders with the trip's other lists on the calendar and the map pages, refreshed by the same rules. Verify the calendar shows a day in its stored order.
- [x] 3.2 Mobile: read day orders in `trip-calendar.tsx` and `trip-workspace.tsx` with `keep: \`day-orders-${trip.id}\``, so they are in the kept copy and refreshed like the rest. Verify that with the device offline a reopened trip shows the kept order.

## 4. Calendar

- [x] 4.1 Web: add `@dnd-kit/core` and `@dnd-kit/sortable`; make each day column sortable from a handle only, with keyboard sorting and announcements from wording. Verify a drag reorders immediately and pressing the name still opens the place.
- [x] 4.2 Mobile: `pnpm --filter mobile exec expo install react-native-gesture-handler`, wrap the root in `GestureHandlerRootView`, and make each day's list sortable from a handle, with `moveUp`/`moveDown` accessibility actions and announcements. Verify a drag reorders immediately, a swipe over a name still scrolls, and a tap still opens.
- [x] 4.3 Both: a pending order per day — saved one second after the last change, saved immediately on leaving the day or the calendar, kept on screen over re-reads until it settles, and reverted with `the order could not be saved` in the status line on failure (design decision 4). Verify with a test of the debounce, and by forcing a failed save in each app.
- [x] 4.4 Mobile: with no signal, handles and move actions are disabled with the "needs a connection" line, as other trip changes are. Verify in airplane mode.

## 5. Map

- [x] 5.1 Both apps: when the filter is exactly one day, pass `positionsOnDay` positions into the markers, and pass the day's places to `groupCoincident` in day order. Verify one day shows numbers, and two days, no day and "no day" show icons.
- [x] 5.2 Both `Pin` components: draw the number in the glyph's place and colour (style A from the mock — bold, tabular figures, a size step down at two digits), fitting two digits; include the position in the pin's spoken name. Verify on every type colour, solid and visited, on both themes.

## 6. Product and checks

- [x] 6.1 `PRODUCT.md`: narrow "Wishlist, not itinerary" — a day may have an order, never times — and point to #283. Verify it reads correctly next to the paragraph around it.
- [x] 6.2 Build a new mobile development build (native module added), and verify on the simulator with `xcrun simctl listapps booted | grep -i pinpoint` that only `ar.com.pinpoint.app` is installed.
- [x] 6.3 Look at the running apps on both themes: reorder a day on the laptop and see it on the phone after a re-read; reorder a run's middle day and check its other days; give a place a day and see it last; narrow the map to that day and match the pin numbers to the calendar. Verify each against the spec scenarios.
- [x] 6.4 Run `pnpm verify` and `openspec validate order-a-days-places --strict`, and verify both pass.
