## 1. Database

- [x] 1.1 Add a migration that runs `update public.markers set price = null where price is
      not null;` and then `alter table public.cities drop column currency;`, with a header
      saying why the prices are cleared (#175). Verify with a rolled-back `do $$ … raise
      exception 'RESULT: %' … $$` probe on the live data that, after both statements, no
      marker has a price, the column is gone, and markers still read under their cities.
      Do **not** push it yet (see 6.2).
- [x] 1.2 Remove `currency` from `cities` in `packages/supabase/src/database.types.ts` by
      hand. `pnpm db:types` reads the live database, so it can only confirm this after 6.2.

## 2. Shared packages

- [x] 2.1 `packages/core/src/price.ts`: `formatPrice(amount)` returns `Free` for 0, `USD 25`
      for a whole amount, `USD 1,200` with separators, `USD 32.50` with cents. Delete
      `CURRENCY_CODE_PATTERN` and its export. Rewrite `price.test.ts` to cover those four
      cases plus the largest storable amount (`USD 99,999,999.99`), and verify it passes.
- [x] 2.2 `packages/core/src/city.ts`: remove `currency` from `citySchema`, `newCitySchema`
      and `cityPatchSchema`, and rewrite the comments that explain it. Fix
      `marker-day.test.ts` fixtures. Verify `pnpm --filter @pinpoint/core test` passes.
- [x] 2.3 `packages/data/src/cities.ts`: drop `currency` from the selected columns, the row
      mapping, create and patch, and the comments. Fix `writes.test.ts`. Verify the data
      package's tests pass.

## 3. Web

- [x] 3.1 Place card (`marker-details.tsx`): the pill uses `formatPrice(marker.price)`.
      Delete the `currency` / `currencyOf` props and their lookups in `trip-workspace.tsx`
      and `trip-calendar.tsx`, with the calendar comment that cites the currency.
- [x] 3.2 Place form (`marker-form.tsx`): label `Price (USD)`, and a `Free` toggle beside the
      box styled like the interest choice pill (`aria-pressed`, accent wash when on). On:
      empties and greys out the box, placeholder `Free`, saves 0. Focusing the box or
      pressing again turns it off. A place opened with price 0 opens with Free on and an
      empty box. Remove the currency field and hint from the quick new-city form, and
      `onCreateCity` takes a name only. Update the comment about a typed zero.
- [x] 3.3 City list and editor (`city-bar.tsx`, `city-bar.module.css`): the row reads only
      the count, with no `· JPY` or `· no currency`. The editor asks for the name only, and
      `onSave` / `patchCity` / `addCity` in `trip-workspace.tsx` stop carrying a currency.
- [x] 3.4 Verify `pnpm typecheck` passes and `grep -rni currency apps/web` finds nothing.

## 4. Phone

- [x] 4.1 Place card (`marker-details.tsx`): the pill uses `formatPrice(marker.price)`.
      Delete `currencyOf` from `trip-workspace.tsx`, `trip-map.tsx` and `trip-calendar.tsx`,
      with the calendar comment that cites the currency.
- [x] 4.2 Place form sheet (`marker-form.tsx`): the same `Price (USD)` label and `Free`
      toggle as 3.2, at least 44 points tall, styled like the phone's interest choice.
      Remove the currency field and hint from the quick new-city form.
- [x] 4.3 City sheet (`city-sheet.tsx`): the row reads only the count, and the editor asks
      for the name only. Remove its currency comments and hint. `trip-workspace.tsx`'s
      `addCity` / `patchCity` stop carrying a currency.
- [x] 4.4 Verify `pnpm typecheck:mobile` passes and `grep -rni currency apps/mobile` finds
      only generated native folders, if anything.

## 5. Product record

- [x] 5.1 `PRODUCT.md`: replace "A trip crosses borders. Currency sits on the city…" and
      "A price is never converted… a city with no currency shows a bare amount…" with the
      new rule: every price is in US dollars, and a free place is a price of 0 shown as
      `Free`. Verify `grep -ni currency PRODUCT.md` returns only the new wording.

## 6. Look at it, then release

- [x] 6.1 Run both apps against the live database (the column is still there, so nothing
      breaks yet). On web and phone, in light and dark, check:
      - a price shows as `USD 25` and `USD 32.50`;
      - Free shows as `Free` on the card and in the calendar's card;
      - Free and a price never show together;
      - typing 0 saves as Free;
      - reopening a free place shows Free on;
      - a place with neither shows no pill;
      - creating and editing a city asks only for a name;
      - the city list shows no currency.
- [ ] 6.2 Run `pnpm verify` and `openspec validate usd-prices-and-free-places --strict`.
      After the web deploy has landed, **ask the user before pushing the migration**. It
      clears every price on the live database and cannot be undone. Once they confirm, push
      it and run `pnpm db:types`, which must produce no diff against 1.2. Confirm on the
      live database that no marker has a price and `cities` has no `currency` column.
      Reopen both apps and verify every place shows no pill.
      **Prices already cleared** on the live database on 2026-09-18, at the user's request,
      by running the migration's `update` directly: 20 places cleared, 0 priced left, 103
      places intact. The column drop still waits for the deploy. The migration's `update`
      will run again on push, clearing only prices entered between now and then.
