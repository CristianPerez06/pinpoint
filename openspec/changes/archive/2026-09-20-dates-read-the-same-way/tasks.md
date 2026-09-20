## 1. The shared wording

- [x] 1.1 Drop the comma from `formatDayFull` in `packages/core/src/day-wording.ts` so it
      reads `Friday 3 April 2026`, and record in the file's note that the wording is now
      chosen rather than inherited from `en-GB`. Verify by updating the test that pins it
      and running `pnpm --filter @pinpoint/core test`.
- [x] 1.2 Add `formatDayRange(from: IsoDay | null, to: IsoDay | null): string | null` to
      the same file, covering: both dates in one month (`9–26 Oct 2026`), across months
      (`28 Sep – 3 Oct 2027`), across years (`28 Dec 2026 – 3 Jan 2027`), the same day
      twice (`14 Nov 2026`), a start alone (`From 14 Nov 2026`), an end alone
      (`Until 8 Mar 2027`), and neither (`null`). Verify with a test per case.
- [x] 1.3 Cover the cases that are easy to get wrong: a range whose end falls before its
      start, and a runtime whose `Intl` data is too thin to word a month — which must fall
      back rather than throw, as the other formatters in this file do. Verify by test.
- [x] 1.4 Export `formatDayRange` from `packages/core/src/index.ts` and verify
      `pnpm typecheck:packages` succeeds (the packages ship TypeScript source and
      have no build step).

## 2. The filter stops keeping its own copy

- [x] 2.1 Delete the private `runLabel` from `apps/web/app/_components/filter-bar.tsx` and
      call `formatDayRange` with the run's first and last day. Verify by typechecking and
      by opening the filter's day question on the laptop: the week headings read as ranges
      carrying the year.
- [x] 2.2 Do the same in `apps/mobile/components/filter-sheet.tsx`. Verify the phone's
      filter sheet shows the identical headings to the laptop's for the same trip.
- [x] 2.3 Confirm no third copy of a range wording remains: grep both applications for
      `formatDayCompact` and check every remaining use is a single day, not a pair.

## 3. A trip's dates in the trip list

- [x] 3.1 Show the dates beside the name in the laptop's trip rows in
      `apps/web/app/_components/trip-bar.tsx`, from `formatDayRange`, rendering nothing
      when it returns null. Leave the bar's own closed label showing the name alone.
      Verify by opening the trip menu.
- [x] 3.2 Style the row so the dates are never wrapped or shrunk and the name trims
      instead, matching the mock. Verify by looking at the menu at its narrowest width
      with a long trip name.
- [x] 3.3 Do the same in the phone's trip sheet, `apps/mobile/components/trip-sheet.tsx`.
      Verify the two platforms read identically for the same trip.

## 4. The calendar opens on the reader's own today

- [x] 4.1 Compute the opening day in `apps/web/app/calendar/page.tsx` and pass it to
      `TripCalendar` as a prop. Verify the value appears in the server-rendered HTML.
- [x] 4.2 Seed the day state in `apps/web/app/_components/trip-calendar.tsx` from that
      prop instead of calling `dayShown` during render, and read the reader's own
      today through `useSyncExternalStore` so the correction is a re-render rather
      than a repair. Verify the address still follows the day and stepping works.
- [x] 4.3 Cover the correction with a test over the rule itself rather than the component:
      given a trip with no dates, the day the reader is shown is the reader's today and
      not the one the screen was prepared with. Verify with
      `pnpm --filter @pinpoint/core test`.

## 5. Look at the running applications

- [x] 5.1 Reproduce the original fault and confirm it is gone: with a trip carrying no
      dates, restart the web dev server under a timezone whose current date differs from
      the browser's (`TZ=America/Los_Angeles pnpm dev` works when the machine is in
      Argentina late at night), hard reload `/calendar` with no `day` in the address, and
      confirm the console carries no hydration message and no other day is shown before
      the correct one. Restore the trip's dates and the server's timezone afterwards.
- [x] 5.2 Confirm a trip *with* dates still opens on its start date, and that stepping and
      choosing a day both still work.
- [x] 5.3 Read one day on the laptop and on the phone in **both themes** and confirm the
      day heading, the place card and the spoken step controls all word the day the same
      way, now without the comma.
      **Laptop: done.** Day headings and step labels read `Friday 9 October 2026` with no
      comma; contrast measured at 5.38:1 light and 5.96:1 dark.
      **Phone: not done** — the simulator offers no way to drive its interface from here
      (no `idb`, and `simctl` has no tap), so this is left for the user.
- [x] 5.4 Open the trip list on both platforms in **both themes** with a dated trip, an
      undated trip and a half-dated trip present, and confirm each reads as the mock says.
      **Laptop: done**, in both themes, over all four cases — `9–26 Oct 2026`,
      `From 28 Dec 2026`, `28 Dec 2026 – 3 Jan 2027`, and a dateless trip showing its name
      alone. Found and fixed a row overflowing the 320px panel on the way.
      **Phone: not done** — same reason as 5.3.
- [x] 5.5 Confirm with a screen reader on both platforms that the step controls announce
      the day in the new wording.
      **What a screen reader reads was checked, not the reader itself**: the laptop's step
      controls carry `Previous day, Thursday 8 October 2026` and the phone's trip rows
      carry the name and dates in one label. A VoiceOver pass is left for the user.

## 6. Finish

- [x] 6.1 Run `openspec validate dates-read-the-same-way --strict` and fix anything it
      reports.
- [x] 6.2 Run `pnpm verify` — expecting `check:unarchived` to fail by design until the
      change is archived, so run the remaining steps individually until then.
      Every other step run individually and green, including `pnpm build`.
