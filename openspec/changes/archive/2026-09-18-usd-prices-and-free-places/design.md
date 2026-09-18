## Context

`markers.price` is `numeric(10, 2) check (price >= 0)`, nullable. `cities.currency` is a
nullable three-letter code, added in `20260810120000_city_currency_and_city_trip_integrity.sql`.
Both apps format prices through `formatPrice(amount, currency)` in `@pinpoint/core`, and
both workspaces and both calendars thread a `currencyOf(marker)` lookup down to the card.
Every update to a marker bumps `updated_at` through the `markers_touch_updated_at`
trigger, and that timestamp is what refuses a save based on a stale read.

## Goals / Non-Goals

**Goals:** one currency everywhere; a free place that cannot be confused with a blank
price; no stored amount left that was typed in another currency.

**Non-Goals:** other currencies, conversion, keeping the cleared amounts.

## Decisions

**Free is stored as a price of 0, not as a new column.** The user decided that saving 0
is the same as pressing Free, so 0 and free are one value, and storing them twice would
only create a way for them to disagree. `price` already allows 0 and nothing else
changes in the schema, the model, or the save path. The `Free` button is a form control
that writes 0. The card maps 0 to `Free`. The form, on opening, maps 0 to `Free` on with
an empty box.

**`formatPrice(amount)` takes one argument and owns both words.** It returns `Free` for
0, `USD 25` for a whole amount and `USD 32.50` otherwise, using `Intl.NumberFormat('en')`
for the number alone, so the fallback that guarded missing currency data on Hermes goes
away with the currency style. The `currencyOf` prop and its lookups are deleted from both
workspaces, both calendars, the phone's map and both cards.
`CURRENCY_CODE_PATTERN` is deleted.

**One migration clears prices, then drops the column.** `update public.markers set price
= null where price is not null;` then `alter table public.cities drop column currency;`.
The update is left to fire the `updated_at` trigger. That is truthful: the price did
change, and a form someone has open on one of those places should be told so rather than
save the old amount back over the clear.

**Order on release: deploy the code first, then push the migration.** Code that no
longer reads `currency` works against a database that still has it. The reverse, the
column dropped under a deployed web app that still selects it, breaks every city read
until the deploy lands. Between the two steps old amounts briefly show as USD, which is
the lesser failure and lasts minutes. Pushing to the live database is irreversible and is
confirmed with the user at that moment.

## Risks / Trade-offs

- **An installed phone build from before this change breaks once the column is gone**:
  its city query names `currency`. These are development builds only, and rebuilding
  fixes it.
- **A free place and a place priced at exactly 0 cannot be told apart.** This is
  intended, not a loss.
- **The clear cannot be undone.** Decided: no copy is kept.
