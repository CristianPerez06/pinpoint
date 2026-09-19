## 1. Confirm the live data before touching anything

- [x] 1.1 With `pnpm exec supabase db query --linked`, list every marker whose `hours` has
      a day with more than one range, or whose open days carry different ranges. Record
      the count here. **If it is not zero, stop and bring those places to the user as a
      question.** Change no code until they answer. *Checked 2026-09-19: one marker has
      hours; 0 have a day with more than one range; 0 have different ranges on different
      days.*

## 2. Shared rules and wording

- [x] 2.1 `packages/core/src/opening-hours.ts`: `openingHoursSchema` requires exactly one
      range per open day and the same range on every open day, and drops the
      second-range checks. Refusals still name the hours field. Update the module's doc
      comments to match. Verify with tests for the `markers` delta's scenarios, including
      two ranges refused and different days refused.
- [x] 2.2 Same file: the form draft becomes `{ days, range }`. `splitHours` and
      `joinHours` are rewritten for it, and `setDayApart`, `rejoinDay` and `daysNotApart`
      are deleted, along with their exports and tests. Verify that `joinHours(splitHours(h))`
      equals `h` over generated valid hours, and that no days still gives `null`.
- [x] 2.3 Same file: `describeHours` returns one open line (days in week order,
      neighbours as a span, the rest comma-separated, `Every day` for all seven) plus the
      `Closed` line. Verify with tests for every `map-rendering` delta scenario, the new
      worst case included, line by line.
- [x] 2.4 Verify `pnpm --filter @pinpoint/core test` and `pnpm --filter @pinpoint/data test`
      pass. The data layer should need no edit; if its tests use two-range fixtures,
      change those fixtures to one range.

## 3. Web

- [x] 3.1 `apps/web/app/_components/hours-field.tsx` and `.module.css`: remove `Usual
      hours`, `Different on some days`, the boxes for days set apart and `Add a second
      range`. Keep the day letters, the line naming the days, one opening and closing
      time and the hints. Delete the CSS that is no longer used. Check that
      `marker-form.tsx` still wires the draft through `splitHours` / `joinHours`.
- [x] 3.2 Verify `pnpm typecheck` and `pnpm lint` pass.

## 4. Phone

- [x] 4.1 `apps/mobile/components/hours-field.tsx`: the same removals as 3.1. Keep
      `fieldRole` on the time fields, and keep the day toggles at least 44 points.
- [x] 4.2 Verify `pnpm typecheck:mobile` and `pnpm lint:mobile` pass.

## 5. Product record

- [x] 5.1 `PRODUCT.md`: the hours line under the structural constraints says a place has
      one range, the same on every open day (#190). Verify with
      `grep -n -i hours PRODUCT.md`.

## 6. Look at the running apps

- [x] 6.1 Run both apps against the live database. On web and phone, in light and dark,
      check:
      - the hours part shows the day letters, the line naming the days, and one opening
        and closing time, with no `Usual hours`, `Different on some days` or `Add a
        second range`;
      - no time fields appear until a day is on, and turning every day off saves no hours;
      - the `Closes 02:00 the next day` and `Open all day` hints still appear;
      - a range missing a time is refused against the hours field, and nothing entered is
        lost;
      - a place saved before the change with hours opens with its days and times, shows
        them on its card, and saves again unchanged;
      - saving Mon, Wed, Fri 09:00–17:00 and reopening keeps the days and the range, and
        the card reads `Mon, Wed, Fri 09:00–17:00` then `Closed Tue, Thu, Sat, Sun`;
      - the worst case, `Mon, Wed, Fri, Sun 19:00–02:00`, fits the card on the phone
        without breaking the range, and the calendar's card reads the same.
      *Web, dark and light: done. Form shows letters, days in words, one range, hints;
      Amerikamura (every day 10:00–19:00) opened and read correctly, then was saved as
      Mon, Wed, Fri 19:00–02:00 (with the user's OK), stored as three identical one-range
      days, and read `Mon, Wed, Fri 19:00–02:00` / `Closed Tue, Thu, Sat, Sun` in both
      themes. Phone: checked by the user. Amerikamura set back to every day 10:00–19:00
      afterwards, and confirmed in the database.*
- [x] 6.2 Verify `pnpm verify` and `openspec validate opening-hours-one-range --strict`
      pass. *Every step passes except `check:unarchived`, which fails until the archive
      on this branch, as intended.*
