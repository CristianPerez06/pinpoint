## 1. Database

- [x] 1.1 Add one migration: `cities.currency text` nullable with a check for
      `^[A-Z]{3}$` and `<> 'USD'`, and `markers.local_price numeric(10, 2) check
      (local_price > 0)` plus `markers.local_currency text`, with a check that both
      are set or both are null. Header says why the currency sits beside the amount (see
      design). Verify it with the probes in 1.2.
- [x] 1.2 In the same migration, add the `before insert or update` trigger on `markers`
      that nulls both local columns when `local_currency` is not the marker's city's
      current `currency`, or when `price = 0`. Add the `after update of currency` trigger
      on `cities` that updates its markers whose `local_currency` differs. Verify with
      rolled-back `do $$ … raise exception 'RESULT: %' … $$` probes on the live database
      that run the migration's statements and then check that:
      - a local price on a JPY city is kept;
      - one written against a city with no currency, or no city, is cleared;
      - changing JPY to KRW, and removing JPY, clear it and bump `updated_at`;
      - deleting the city clears it through `on delete set null (city_id)`;
      - `price = 0` clears it;
      - the USD price is untouched in every case.
      Do **not** push it yet (see 6.1).
- [x] 1.3 Add the three columns to `packages/supabase/src/database.types.ts` by hand.
      `pnpm db:types` confirms it after 6.1.

## 2. Shared packages

- [x] 2.1 `packages/core`: a currency list as plain data (active ISO 4217 codes with
      English names, no USD), and a search over it that matches the code or any part of
      the name, ignoring case. Test that `yen` and `JPY` both find `JPY — Japanese yen`,
      `ma` matches `MAD` by its code, and USD is never returned.
- [x] 2.2 `packages/core/src/price.ts`: `formatMoney(amount, code)`, with `formatPrice`
      built on it unchanged, and `formatPrices(marker)`. `formatPrices` returns `Free`,
      `USD 25 · JPY 3,800`, `JPY 3,800` alone, `USD 25` alone, or null. Extend
      `price.test.ts` with those cases plus `USD 1,250.50 · IDR 18,500,000`, and verify it
      passes.
- [x] 2.3 `packages/core`: `citySchema`, `newCitySchema` and `cityPatchSchema` gain
      `currency` (nullable, three capitals, not USD). The marker schema gains
      `localPrice` (positive, nullable) and `localCurrency`, refusing one without the
      other. Test both.
- [x] 2.4 `packages/data`: cities and markers read and write the new columns. Fix
      `writes.test.ts` and `markers.test.ts`, and verify the data package's tests pass.

## 3. Web

- [x] 3.1 Place card (`marker-details.tsx`): the pill uses `formatPrices(marker)`.
- [x] 3.2 Place form (`marker-form.tsx`), matching the mock:
      - a `Price (JPY)` field under `Price (USD)` whenever the chosen city has a currency,
        with the "typed as seen; nothing is converted" hint;
      - `Free` empties and greys out both fields, and focusing either one turns it off;
      - a 0 in either field saves as free;
      - the field follows the chosen city;
      - the warning line when the chosen city would clear a saved local amount, and
        choosing the original city again brings the amount back.
      The quick new-city box gains the optional currency picker, and `onCreateCity`
      takes a name and a currency. Check the calendar's edit form, which has no new-city
      box, still passes the local price through.
- [x] 3.3 City editor (`city-bar.tsx`): the optional currency field under the name, with
      a searchable picker and a way to remove it. The browser confirm appears on change
      or removal only when some place has a local amount, naming the count. The existing
      "Remove city" confirm gains the "N of them lose their JPY price; their USD prices
      stay." sentence when N > 0. The city list stays unchanged.
- [x] 3.4 Verify `pnpm typecheck` passes.

## 4. Phone

- [x] 4.1 Place card (`marker-details.tsx`): the pill uses `formatPrices(marker)`.
- [x] 4.2 Place form sheet (`marker-form.tsx`): the same behaviour as 3.2, with the
      second field lined up under the USD box. `PriceField` in `ui.tsx` gains the second
      field rather than a copy of itself. Check the calendar's edit form as in 3.2.
- [x] 4.3 City sheet (`city-sheet.tsx`): the same as 3.3. The currency picker is a sheet
      with a search field. The confirmations use `Alert`, like the existing remove.
- [x] 4.4 Verify `pnpm typecheck:mobile` passes.

## 5. Product record

- [x] 5.1 `PRODUCT.md`: the "Every price is in US dollars" line says a city may add one
      second currency for a local amount beside the dollars, typed and never converted.
      Verify it still says why per-city currency was reversed (#175).

## 6. Release the database, look at it, then ship

- [x] 6.1 **Ask the user before pushing the migration** to the live database. It is
      additive, and the deployed app never names the new columns, so it can go first (see
      design). Once they confirm, push it, run `pnpm db:types`, and verify there is no
      diff against 1.3.
- [x] 6.2 Run both apps locally against the live database. On web and phone, in light and
      dark, check against `mock/second-currency-mock.html`:
      - setting, changing and removing a city's currency from the city editor, and
        setting one from the new-city box in the place form;
      - the second field appears only in a city with a currency;
      - both, either or neither amount saves, and editing one leaves the other;
      - `Free` clears both, and 0 in either field saves as `Free`;
      - the card pill in all five shapes, including the longest;
      - the in-form warning when refiling a place, and that switching back restores the
        amount;
      - the three confirmations appear only when something would be lost, with the right
        count;
      - after each clear, the USD price is still there;
      - a city without a currency looks exactly as it does today.
      Use a throwaway city for the clearing checks, and remove it afterwards.
- [x] 6.3 Run `pnpm verify` and `openspec validate city-second-currency --strict`.
