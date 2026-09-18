## Why

Each city can carry its own currency today, so a trip that crosses a border can hold
prices in yen and won side by side. In practice that is an extra step every time a
city is made, and a price whose currency depends on which city the place is filed
under is harder to read at a glance. One fixed currency is simpler to enter and to
compare. This reverses the per-city decision on purpose (#175).

A free place also has no honest way to be saved today. Left blank, it reads as "price
not filled in yet". Saved as 0, it reads as an amount rather than as a fact.

## What Changes

- **Every price is in US dollars.** The price box is labelled `Price (USD)`, and the
  pill beside the type on a place's card reads `USD 25`: whole amounts show no decimals,
  amounts with cents show two (`USD 32.50`). Nothing is converted.
- **A place can be marked Free.** A `Free` button sits beside the price box, on web
  and on the phone. Pressing it empties the price box and greys it out. Pressing it
  again, or going into the box, turns Free off. Saving a price of 0 is the same as
  pressing Free. The pill reads `Free`, and it never shows a price and Free together.
  A place with neither shows no pill, as today.
- **BREAKING — cities no longer have a currency.** Creating or editing a city asks only
  for its name, on both apps, including the quick city form inside the place form. The
  city list no longer says `· JPY` or `· no currency` after the count. The currency is
  deleted from the database, not just hidden.
- **BREAKING — every saved price is cleared.** A price typed as 5000 under a city set to
  ARS would otherwise read as USD 5000. After the change ships, every place shows no
  pill. Existing 0 prices are cleared too, so nothing turns into `Free` that nobody
  chose. No copy is kept; that was decided.
- `PRODUCT.md` loses its two statements of the old rule: "Currency sits on the city"
  and "A price is never converted… a city with no currency shows a bare amount".

Not being done: currencies other than USD, converting prices, a per-trip currency, and
keeping the old amounts anywhere.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `markers`: *A city declares the currency its markers' prices are in* is replaced by a
  requirement that every price is in US dollars and that a place can be free.
- `marker-capture`: the place form gains the `Free` button beside the price.
  *A city can be renamed, given a currency, and removed* becomes *A city can be renamed
  and removed*, which keeps the rename, edit-without-selecting, count and removal rules
  and drops everything about currency.

## Impact

- Database: one migration that clears every marker's price and drops the city currency
  column. It cannot be undone, and it runs on the live database.
- `@pinpoint/core`: the price formatter, the city model and the marker price rule.
- `@pinpoint/data`: city reads and writes stop carrying a currency.
- Web: the place form, the place card, the city list and city editor, the calendar.
- Phone: the place form sheet, the place card, the city sheet, the calendar.
- `PRODUCT.md`.
