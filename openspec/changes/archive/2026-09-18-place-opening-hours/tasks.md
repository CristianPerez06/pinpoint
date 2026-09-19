## 1. Database

- [x] 1.1 Add a migration that adds `hours jsonb` (nullable) to `public.markers`, with a
      check that it is null or a non-empty JSON object. Give it a header saying why hours
      are stored per day and why the ranges are validated in `@pinpoint/core` rather than
      here (#176). Verify with a rolled-back `do $$ … raise exception 'RESULT: %' … $$`
      probe on the live data that every existing marker reads `hours = null`, that `'{}'`
      and a JSON array are refused, and that a valid object saves. Do **not** push it yet
      (see 6.1).
- [x] 1.2 Add `hours` to `markers` in `packages/supabase/src/database.types.ts` by hand.
      `pnpm db:types` can only confirm it after 6.1.

## 2. Shared packages

- [x] 2.1 `packages/core/src/opening-hours.ts`: the hours schema (days `mon`…`sun`, one or
      two `HH:MM` ranges per open day, in order, only the second crossing midnight, equal
      times meaning all day and alone, at least one open day), `splitHours` / `joinHours`
      for the form, `describeHours` for the card (Monday first, runs of consecutive
      identical days, `Every day`, `24 hours`, a last `Closed …` line), and
      `normaliseTime` (`9`, `900`, `0900`, `09:00` → `09:00`). Export them from the index.
      Add `opening-hours.test.ts` covering every scenario in the three delta specs, the
      worst case line by line, the tie rule, and `joinHours(splitHours(h))` equal to `h`
      over a set of generated valid hours. Verify `pnpm --filter @pinpoint/core test`
      passes.
- [x] 2.2 `packages/core/src/marker.ts`: add `hours` to `markerSchema` and
      `writableMarkerFields`, with `default(null)` in `newMarkerSchema` only, as
      `plannedOn` has. Add `hours: 'No hours yet'` to `EMPTY_FIELD_WORDING`. Extend
      `marker.test.ts` so that a new marker without `hours` validates, and a patch without
      `hours` leaves the key absent (it doesn't clear it). Verify the core tests pass.
- [x] 2.3 `packages/data/src/markers.ts`: add `hours` to `MARKER_COLUMNS`, the row type,
      `toMarker`, `toInsertRow` and `toUpdateRow`. A stored value that fails the schema
      reads as `null` instead of failing the whole trip's read. Extend `markers.test.ts`
      and `writes.test.ts`, and verify the data package's tests pass.

## 3. Web

- [x] 3.1 Place card (`marker-details.tsx`, `.module.css`): an `Hours` field between Day
      and Note, drawn from `describeHours` as a two-column grid with tabular figures, the
      `Closed` line muted, and `No hours yet` in the existing absent style. A range never
      breaks across two lines. Verify the calendar's card shows it too.
- [x] 3.2 Place form (`marker-form.tsx`, `.module.css`): the `Hours (optional)` part after
      the day, as in the mock. It has the seven toggles (`aria-pressed`, full day names as
      their labels), the line naming the picked days, `Usual hours`, `Different on some
      days` with one box per day set apart, `Add a second range`, typed time fields that
      normalise on blur, and the `next day` / `Open all day` hints. It is wired through
      `splitHours` / `joinHours`, with the refusal shown against the field.
- [x] 3.3 Verify `pnpm typecheck` and `pnpm lint` pass.

## 4. Phone

- [x] 4.1 Place card (`marker-details.tsx`): the same `Hours` field between Day and Note,
      from `describeHours`. Check the sheet still measures itself and scrolls correctly
      with the worst case, which adds four lines.
- [x] 4.2 Place form sheet (`marker-form.tsx`): the same hours part as 3.2. Day toggles
      are at least 44 points, with `accessibilityRole="button"`, `accessibilityState`
      selected and full day names. Time fields use the number keypad and `fieldRole`
      (not `role`; see the `lineHeight` gotcha). Nothing is raised over the sheet.
- [x] 4.3 Verify `pnpm typecheck:mobile` and `pnpm lint:mobile` pass.

## 5. Product record

- [x] 5.1 `PRODUCT.md`: add hours to the fields a place records, and add a line under the
      structural constraints: no hours means "not filled in", never "closed", and hours
      are local time, never converted. Verify with `grep -n -i hours PRODUCT.md`.

## 6. Release the column, then look at it

- [x] 6.1 **Ask the user before pushing the migration** to the live database. It only
      adds an empty column, so the deployed web app and installed phone builds keep
      working. The new code can't be looked at against the live database until it's
      there. Once they confirm, push it, run `pnpm db:types` (no diff against 1.2), and
      check that every existing marker has `hours = null`.
- [x] 6.2 Run both apps against the live database. On web and phone, in light and dark,
      compare against `mock/opening-hours-mock.html` and check:
      - the worst case reads exactly as the spec's four lines, on both apps;
      - `Every day 09:00–18:00`, `Mon–Fri …` / `Closed Sat, Sun`, `Every day 24 hours`;
      - a place saved before the change reads `No hours yet` and saves normally;
      - no time fields appear until a day is picked, and turning every day off saves no
        hours;
      - the `next day` and `Open all day` hints appear;
      - a half-entered range is refused, with everything kept;
      - reopening a place with mixed hours shows the right usual hours and days set
        apart, and saving without touching them changes nothing;
      - on the phone, typing times with the keypad feels acceptable one-handed. If it
        doesn't, stop and bring it back to the user before swapping to a picker;
      - the calendar's card shows the hours.
      Remove any hours added for testing from real places afterwards.
- [x] 6.3 Run `pnpm verify` and `openspec validate place-opening-hours --strict`, and
      verify both pass.
