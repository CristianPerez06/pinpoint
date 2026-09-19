## Context

`markers.price` is `numeric(10, 2) check (price >= 0)`, nullable, and always US dollars
since `20260918120000_usd_prices.sql`, which also dropped `cities.currency`. Both apps
format prices through `formatPrice(amount)` in `@pinpoint/core`, which owns `Free` and
the `USD` prefix. Every update to a marker bumps `updated_at` through the
`markers_touch_updated_at` trigger, and that timestamp is what refuses a save based on a
stale read. `markers_city_id_fkey` is `(city_id, trip_id) references cities (id,
trip_id) on delete set null (city_id)`, so removing a city is an update to its markers.

## Goals / Non-Goals

**Goals:** the database itself guarantees that a local amount is never shown under a
currency other than the one it was typed in, whichever app or path wrote it.

**Non-Goals:** exchange rates; a currency list that updates itself; translated currency
names.

## Decisions

**A place stores the currency beside its local amount, not just the amount.**
`markers` gains `local_price numeric(10, 2) check (local_price > 0)` and
`local_currency text`, with a check that both are set or both are null. Storing the
amount alone would leave its currency implied by the city, so a form opened on a Tokyo
place, refiled to Seoul and saved with the old number would write `3800` into a KRW
city, and nothing could tell it had been yen. With the code stored beside it, a mismatch
is detectable.

**One `before insert or update` trigger on `markers` enforces the rule.** If
`local_currency` is not the marker's city's current `currency` (including no city, or a
city with none), or `price = 0`, it sets both local columns to null. It clears rather
than refuses, because two of the paths that reach it cannot be refused: a city removal
arriving through the foreign key's `set null`, and a currency change arriving through
the trigger below. For a client write the only way to hit it is a stale form, and that
save is already refused by `updated_at`. Alternative considered: rejecting mismatches
and clearing in the client. It was rejected because the removal path would still need
the trigger, and two mechanisms for one rule drift apart.

**A city's currency change clears its markers through one `after update of currency`
trigger on `cities`**, which updates the markers whose `local_currency` differs. That
update goes through the marker trigger above and bumps `updated_at`, which is truthful:
a form someone has open on one of those places is told the place changed rather than
saving the old amount back.

**`cities.currency text`, nullable, checked against `^[A-Z]{3}$` and `<> 'USD'`.**
The check keeps the column honest. Whether a code is a real currency is decided by the
list the apps offer, not by the database, so that retiring or adding a code never needs
a migration.

**The currency list is static data in `@pinpoint/core`**: active ISO 4217 codes with
English names, as a plain array. `Intl.supportedValuesOf` and `Intl.DisplayNames` would
avoid carrying it, but `price.ts` and `day-wording.ts` already record that `Intl` is
thinner on the phone's runtime than in a browser, and a picker that lists nothing on one
platform is worse than a list that is a year stale.

**`formatPrice(amount)` stays as is. `formatMoney(amount, code)` does the number
formatting, and `formatPrices(marker)` builds the pill.** `formatPrices` returns `Free`,
the joined `USD 25 · JPY 3,800`, either amount alone, or null for no pill. Both cards
call it, so the joining rule lives in one place like the rest of the price wording.

**The warnings count from the markers already loaded.** Each workspace already holds
every marker on the trip for the city counts, so "4 of them lose their JPY price" is a
filter over the same list. That count can be one save out of date if another member is
editing at the same moment. That is acceptable for a warning, and the clear itself
happens in the database either way.

**The form keeps the local amount per city while it is open.** It remembers the amount
the place was opened with and shows it again if the original city is chosen again. It
sends `local_price: null` when the chosen city's currency differs from the one the
amount was typed in. The trigger would clear it anyway, but sending the right value
keeps a mismatch from being normal traffic.

## Risks / Trade-offs

- **An installed phone build from before this change keeps working, but can clear a
  local price without saying so.** An old form sends no local columns, so an edit leaves
  them untouched. A city removal from an old build clears them without the new warning.
  These are development builds only, so rebuilding fixes it.
- **A code could leave the static list while a city still carries it.** The picker would
  not offer it again, but the card still shows the stored code, so nothing breaks.

## Migration Plan

One additive migration: the two marker columns and their check, the city column and its
check, and the two triggers. It clears nothing that exists today, because no marker has
a local price yet. Order on release: **migration first, then code**. Old code never
names the new columns, so it works against the new schema, and new code needs them to
exist. Rolling back is dropping the triggers and the three columns. Pushing to the live
database is confirmed with the user at that moment.

The trigger behaviour is verified with rolled-back `do $$ … raise exception` probes
before pushing, including that `on delete set null (city_id)` fires the marker trigger.
