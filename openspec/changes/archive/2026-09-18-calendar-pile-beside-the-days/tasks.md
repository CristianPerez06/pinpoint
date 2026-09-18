## 1. The shared grouping

- [x] 1.1 Add `groupUndatedByCity(undated, cities)` to `packages/core/src/marker-day.ts`
  and export it from the package. Groups are ordered by city name, with places filed under
  no city (or under a city not in the list) last in one group, and places inside a group
  keep the order they arrived in. Verify with tests in `marker-day.test.ts`: several
  cities plus unfiled places, a place whose city is missing from the list, an empty input,
  and the same input read twice giving the same order. `pnpm --filter @pinpoint/core test`
  passes.

## 2. Web

- [x] 2.1 Replace `Waiting` in `apps/web/app/_components/trip-calendar.tsx` with a
  waiting list that has no collapse: a heading "No day yet" with the total count, one
  group per city headed by its name and count ("Unassigned" for the no-city group), and
  "Nothing waiting for a day" when empty. Verify it renders open, with the groups and
  counts, on a trip with undated places in two cities and some unfiled.
- [x] 2.2 Add the Days / No day yet tab control below the header, carrying the count
  badge (accent wash while places are waiting, muted when none), with the chosen view held
  in state starting at `days` and set as `data-view` on the screen root. Use
  `role="tablist"`/`tab`/`tabpanel` with `aria-controls`. Verify switching changes the
  view and does not change the day, and the address gains no view parameter.
- [x] 2.3 Rework `trip-calendar.module.css`: at 900px and up, hide the tabs and lay the
  waiting column (≈300px, scrolling by itself) beside the three days, with the width cap
  on the board. Below 900px, show only the chosen view, with the day band shown on Days
  only, and the tabs and day band pinned above the part that scrolls. Verify by measuring
  in the browser at 1440px and 1024px that the column and days sit side by side and a
  90-place list scrolls inside its column without moving the days, and at 390px and 800px
  that only one view shows.
- [x] 2.4 Confirm a cold load of `/calendar` at both widths reports no hydration mismatch
  in the console. Verify in the browser console.
- [x] 2.5 Draw thin scrollbars across the web app (`globals.css`), with an `ink-muted`
  thumb on a transparent track, so the calendar's side-by-side columns do not each carry
  a full-width gutter on a laptop. Verify the waiting column's computed
  `scrollbar-width` is `thin` and the thumb is drawn thin in the browser.

## 3. Mobile

- [x] 3.1 In `apps/mobile/components/trip-calendar.tsx`, add the tab control between the
  header and the day band, with `accessibilityRole="tablist"`/`"tab"` and the count badge,
  and the view held in `useState('days')`. Render the day band only on Days. Verify on
  the simulator that switching works, the day is kept, and the screen opens on Days after
  leaving it on No day yet and coming back from the map.
- [x] 3.2 Replace `Waiting` with the grouped list shown as the No day yet view, using
  `groupUndatedByCity`. Remove `WAITING_CAP` and the nested `ScrollView`, so the list
  scrolls in the body. Verify on the simulator with a long list that every row down to
  the last is reachable and nothing is clipped.
- [x] 3.3 Verify on the simulator that changing trip from the trip sheet while on No day
  yet opens the other trip's calendar on Days.

## 4. Looking at it

- [x] 4.1 Run the web app and check the calendar at laptop and phone widths, in both
  themes: the count badge is legible on both grounds, the day being read is still
  apparent among the three, and opening a place from the waiting column and from a day
  shows the same card as the map.
- [x] 4.2 Run the mobile app and check the same in both themes: tab labels and badge
  readable, the day controls stay put while a long day scrolls, and the "Back to the map"
  line is unchanged.
- [x] 4.3 On either app, give a place from No day yet a day and clear another place's
  day. Verify the first leaves the list and appears on its day, the second rejoins the
  list in its city's group, and every count updates without a reload.

## 5. Finishing

- [x] 5.1 Run `openspec validate calendar-pile-beside-the-days --strict` and `pnpm verify`.
  Both pass.
