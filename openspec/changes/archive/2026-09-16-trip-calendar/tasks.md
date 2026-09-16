## 1. Database

- [x] 1.1 Add a migration creating `trips.starts_on date null`, `trips.ends_on date null`
      and `markers.planned_on date null`, with a check constraint that `ends_on` does not
      precede `starts_on` when both are present. Verify with a rolled-back `do $$ … raise
      exception 'RESULT: %' … $$` probe that a valid pair is accepted, a reversed pair is
      refused, and one date without the other is accepted.
- [x] 1.2 In the same migration, replace `public.create_trip` with a version taking the
      two dates, both defaulting to null. Not foreseen when the tasks were written and
      not optional: `trips` has no insert policy, so this function is the only route by
      which a trip row can be written, and a trip created with dates has to carry them
      through it. Drop before creating — a differing parameter list overloads rather than
      replaces — and restate the revoke/grant, which the drop removes. Verify with a probe
      that a trip is created with dates, without them, and that a reversed pair is refused.
- [x] 1.3 Confirm no policy changes are needed: verify with a probe that a member can read
      and write the new columns on their own trip and that a non-member still reads no rows.
- [x] 1.4 ~~Write `supabase/backfill-trip-dates.sql`~~ — **dropped, not run.** It existed to
      put dates on trips that predated the column, and the dates were set through the
      application instead, so it had no work left to do. The file is deleted.

## 2. Shared packages

- [x] 2.1 Add `startsOn` and `endsOn` to `tripSchema` in `packages/core/src/trip.ts` as
      `z.iso.date().nullable()`, add them to `newTripSchema` and `tripPatchSchema`, and add
      the cross-field refusal of an end before a start. Verify the new cases in
      `trip.test.ts`, including one date present without the other.
- [x] 2.2 Add `plannedOn` to `markerSchema` in `packages/core/src/marker.ts` as
      `z.iso.date().nullable()`, flowing into `newMarkerSchema` and `markerPatchSchema`.
      Verify in `marker.test.ts` that a date outside a trip's dates is accepted and that
      a blank is stored as `null` rather than `''`.
- [x] 2.3 Add the day grouping to `packages/core` — markers in, a day-keyed grouping plus
      the undated set out, with a stable order within a day. Verify with tests covering an
      empty day, a day holding several places, undated places, and a date outside the
      trip's dates. It must not import a renderer, a DOM API, or a native module.
- [x] 2.4 Read and write the three columns in `packages/data` (`trips.ts`, `markers.ts`).
      Verify the existing suites still pass and that a date round-trips as the same
      `YYYY-MM-DD` string it went in as.

## 3. Web — a place's day

- [x] 3.1 Add the date field to `apps/web/app/_components/marker-form.tsx` as a native
      `<input type="date">` beside the city, clearable back to no date. Verify by saving a
      place with a date, editing it to another date, and clearing it.
- [x] 3.2 Show the date in `apps/web/app/_components/marker-details.tsx`, with a place
      carrying no date stated as carrying none rather than left blank, as the other
      optional fields already are.
- [x] 3.3 Verify a date change is refused when it is based on a stale read, and that what
      was entered survives the refusal — the same path an edit to any other field takes.

## 4. Web — a trip's dates

- [x] 4.1 Offer a start and end date while creating a trip, both skippable. Verify a trip
      is created with neither, with both, and that a reversed pair is refused naming the
      field.
- [x] 4.2 Offer changing and clearing a trip's dates from the trip's name menu in
      `trip-bar.tsx`, where the other actions on a trip already live. Verify the edit
      leaves the trip's name, cities, markers and members unchanged, and changes no
      marker's date.

## 5. Web — the calendar screen

- [x] 5.1 Add the `/calendar` route reading `?trip=`, `?city=` and `?day=`, with a visible
      way back that returns to the workspace carrying the trip and the city it arrived
      with. Verify by leaving from a trip with a city selected and confirming the same city
      is selected on return.
- [x] 5.2 Reach the calendar from the trip's name menu. Verify it is among the actions that
      act on the trip, and that no separate permanent control was added beside the name.
- [x] 5.3 Open on the right day — today when the trip's dates contain it, otherwise the
      trip's start date, otherwise today. Verify all three, including a trip with no dates.
- [x] 5.4 Render the day being read with its places, an empty day stating it holds nothing,
      and each place opening the same details panel the map opens. Verify a place opened
      here offers the same fields and the same actions, and that changing its date moves it
      to the new day without the page being reloaded.
- [x] 5.5 Add the date picker and the previous/next day controls, fixed above the scrolling
      region, each naming the day it leads to in words. Verify with a screen reader that
      stepping is announced, and that stepping past the trip's start or end date still
      shows those days.
- [x] 5.6 Add the collapsed group of places with no date above the day, stating its count,
      and present when the count is zero. Verify the count changes as a place is dated and
      cleared, and that the group does not disappear when it empties.
- [x] 5.7 Show the previous, current and next day together on a wide screen and the current
      day alone on a narrow one, with the undated group shown once rather than per day.
- [x] 5.8 Verify the calendar ignores any filter applied on the workspace: narrow the map to
      one member, open the calendar, and confirm every place is on its day and that the
      undated count counts every undated place on the trip.

## 6. Looking at it running

- [x] 6.1 Open the calendar in a browser at 1024px, 1440px and 2560px and measure the
      computed width of a day column and of its container at each. `AGENTS.md` records two
      flex defaults that produce a layout which looks deliberate and is not — a `min-width`
      floor overflows instead of wrapping, and a `flex: 0 1 auto` container sizes to its
      content regardless of a child's `width: 100%`.
- [x] 6.2 Scroll a day holding more places than fit, on a narrow window and a wide one, and
      confirm the day being read does not change and the stepping controls stay reachable.
- [x] 6.3 Set the device clock to a timezone west of UTC, then east of it, and confirm a
      place dated Thursday reads as Thursday in both and that the screen opens on the right
      day. This is the drift the `date` column exists to prevent and it is invisible to
      every static check.
- [x] 6.4 Read the calendar in both themes and confirm no surface presents one theme's
      colours over the other's, including the date input and the undated group.
- [x] 6.5 Open a trip on the phone application after dating places on web and confirm
      nothing is broken by a column it does not present, and that no partial version of the
      calendar is reachable there.

## 7. Closing out

- [x] 7.1 Run `pnpm verify` and confirm it passes.
- [x] 7.2 Run `openspec validate trip-calendar --strict` and confirm it passes.
- [x] 7.3 Open a GitHub issue for bringing the calendar to the phone application, naming
      this change as what it completes and the requirement in `trip-calendar` that it
      replaces.
