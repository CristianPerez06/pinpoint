## 1. Find what depends on a place being on one day

- [x] 1.1 Read every caller of `groupMarkersByDay`, `markersOnDay` and `daysOffered` —
  `apps/web/app/_components/trip-calendar.tsx`, `apps/web/app/_components/trip-workspace.tsx`,
  `apps/mobile/components/trip-calendar.tsx`, `apps/mobile/components/trip-workspace.tsx`
  — and write down, in `findings.md`, anything that would be wrong once one marker appears
  on several days: a count read as "places on this trip", a list keyed across days, a
  lookup assuming a marker resolves to one day. Verified by that note existing before any
  code changes, with each caller named and marked safe or not.
- [x] 1.2 Check the two filter controls that draw a month grid from `daysOffered`
  (`apps/web/app/_components/filter-bar.tsx`, `apps/mobile/components/filter-sheet.tsx`)
  for anything that assumes a day maps to at most one place. Verified by reading both and
  recording the answer with 1.1.

## 2. The database

- [x] 2.1 Add a migration creating `markers.planned_until` as a nullable `date` with the
  single check from `design.md` (no end without a beginning; strictly after it; at most
  365 days). Comment it the way the neighbouring date migration is commented, including
  why `date` and not `timestamptz`. Verified by `supabase db push` succeeding.
- [x] 2.2 Verify the constraint with a rolled-back `do $$ … raise exception 'RESULT: %' …
  $$` probe covering all four refusals — an end with no beginning, an end before the
  beginning, an end equal to it, an end 366 days out — plus one legal three-day run.
  Verified by the probe reporting the expected result for each and leaving no rows behind.
- [x] 2.3 Confirm no policy or grant change is needed: `markers` is already granted and its
  policies resolve through `trip_id`. Verified by `pnpm check:tables` passing.

## 3. The shared model

- [x] 3.1 Add `plannedUntil` to `markerSchema` and to `writableMarkerFields` in
  `packages/core/src/marker.ts`; default it to `null` in `newMarkerSchema` only, never in
  `markerPatchSchema`. Verified by `pnpm --filter @pinpoint/core test` and by the build
  failing anywhere a write now omits the field (#210's check is what surfaces those).
- [x] 3.2 Add the pair rule as a `superRefine` beside `localPriceComesWithCurrency`: a last
  day needs a day, must fall after it, and no more than 365 days after. Normalise a last
  day equal to the day to `null`. Verified by unit tests covering each refusal and the
  normalisation.
- [x] 3.3 Map `planned_until` in `packages/data/src/markers.ts`, on the read, the insert
  and the patch, following how `planned_on` is handled in each. Verified by
  `pnpm --filter @pinpoint/data test`.

## 4. The shared day behaviour

- [x] 4.1 Make `groupMarkersByDay` in `packages/core/src/marker-day.ts` add a marker to
  every day of its run, and `daysOffered` offer every day a run covers. Keep `undated` as
  `plannedOn == null`. Read a pair that breaks the rules as a single day rather than
  failing. Verified by unit tests: a four-day run lands on four days, the waiting pile is
  unchanged, a broken pair reads as one day.
- [x] 4.2 Add the function answering which day of how many a place is on for a given day,
  returning nothing for a place that is not part of a run, and export it from
  `packages/core/src/index.ts`. Verified by unit tests covering the first, a middle and
  the last day of a run, and a single-day place.
- [x] 4.3 Teach `matchesDay` in `packages/core/src/marker-filter.ts` to match any day of a
  run — the one-line change its own comment anticipates. Verified by a unit test choosing
  a middle day of a run and getting the place.

## 5. The web application

- [x] 5.1 Add the reveal and the second date field to
  `apps/web/app/_components/marker-form.tsx`: the day field alone until a day is chosen,
  then a quiet "+ More than one day" beneath it, then a second field. Open it already
  shown for a place that has a last day; clearing it puts it away; clearing the day clears
  both. Verified against every scenario in the `trip-calendar` delta.
- [x] 5.2 Show `Day 2 of 4` beneath the name on each day of a run in
  `apps/web/app/_components/trip-calendar.tsx` — not as a pill beside it, which takes the
  room from `.placeName` — and stop a day whose only places are runs from reading as empty.
  Verified against the `trip-calendar` delta's scenarios, including a long name at the
  narrowest width and a place that is both visited and part of a run.
- [x] 5.3 Show the run on the place's card in
  `apps/web/app/_components/marker-details.tsx` wherever the day is shown today. Verified
  by opening a spanning place from the map and from the calendar.

## 6. The phone application

- [x] 6.1 Same as 5.1 in `apps/mobile/components/marker-form.tsx`, using `DayField` for
  both dates, in the form native to it. Verified against the same scenarios.
- [x] 6.2 Same as 5.2 and 5.3 in `apps/mobile/components/trip-calendar.tsx` and
  `apps/mobile/components/marker-details.tsx`. Verified against the same scenarios.

## 7. Look at it running

- [x] 7.1 On the web application, in the wide and the narrow shape and in both themes: save
  a hotel from the 3rd to the 6th, step through all four days, confirm one pin on the map,
  clear the end day, then clear the day and confirm it rejoins the places waiting. Verified
  by doing it and saying what was seen.
- [x] 7.2 On the phone, on a booted simulator, the same walk — including that the revealed
  field does not push the sheet's controls off the bottom, and that the day it saves is the
  day that was tapped. Check `xcrun simctl listapps booted | grep -i pinpoint` first if the
  build looks stale. Verified by doing it and saying what was seen.
- [x] 7.3 Confirm the two failures this change can produce but type-checks cannot catch:
  narrow the map to a middle day of a run and confirm the place is drawn, and confirm the
  count of places waiting for a day is unchanged by a run existing. Verified on both
  applications.

## 8. Finish

- [ ] 8.1 Run `openspec validate a-place-spans-several-days --strict` and `pnpm verify`.
  Verified by both passing.
