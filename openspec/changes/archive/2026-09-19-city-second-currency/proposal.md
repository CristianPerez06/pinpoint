## Why

Prices are often seen in the local currency, like a menu in yen or a ticket booth in won,
but every price is in US dollars today. So you either convert the price by hand or leave
it blank (#186). This change lets a city carry one extra currency, so its places can
hold the price as it was seen. Dollars stay the one currency every place shares, and #183
still holds: a place's dollar price never depends on its city.

## What Changes

- **A city can have a second currency.** It's optional, one at most, and chosen from a
  searchable list of world currencies shown as code and name (`JPY — Japanese yen`). USD
  is not in the list. It can be set, changed or removed in the city editor, and set in
  the quick "new city" box inside the place form, on web and on the phone. The list of
  cities does not show it. A city without one works exactly as today.
- **Places in that city get a second price box.** Under `Price (USD)` the form shows
  `Price (JPY)`, labelled from the city, with a hint that nothing is converted. Both boxes
  are optional and independent: either, both or neither can be saved, and changing one
  never changes the other.
- **`Free` clears both.** Turning it on empties and greys out both boxes, and typing into
  either one turns it off. A 0 typed in either box saves the place as free.
- **The card shows what was saved**, in the grey price pill: `USD 25 · JPY 3,800`,
  `JPY 3,800` alone, `USD 25` alone, or `Free`. The local amount uses the same format as
  dollars (`EUR 12.50`).
- **A local amount that no longer fits its city is cleared, never relabelled, and you
  are warned first.** Only the local amount is cleared; the dollar price is never touched.
  - Removing or changing a city's currency asks first, naming how many places lose their
    local price. It only asks when some place would actually lose one.
  - Removing a city says the same in its existing message: *"9 places stay on the trip
    and become unassigned. 4 of them lose their JPY price; their USD prices stay."*
  - Moving a place to another city shows a line under the price boxes (*"Moving to Seoul
    clears the JPY 3,800 saved for this place."*). Nothing is lost until Save.
- `PRODUCT.md`: the "Every price is in US dollars" line gains the second currency.

The layout was agreed on the mock in `mock/second-currency-mock.html`.

Not being done: converting between currencies, exchange rates, more than one extra
currency per city, a currency per place, a currency per trip, and sorting or totalling
by the local amount (nothing sorts or totals prices today).

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `markers`: *Every price is in US dollars, and a place can be free* gains the optional
  local amount, the card format and when a local amount is cleared. A new requirement
  gives a city its optional second currency.
- `marker-capture`: the place form gains the second price box and `Free` clears both.
  *A city can be renamed and removed* lets a city carry a second currency, and adds the
  warnings before local amounts are cleared.

## Impact

- Database: one migration adding a currency to cities and a local amount to places. It
  adds and clears nothing, and nothing that exists today changes.
- `@pinpoint/core`: the city and place models, the price formatter, and the list of
  currencies.
- `@pinpoint/data`: city and place reads and writes carry the new values.
- Web: the place form, the place card, the city editor, the calendar's edit form.
- Phone: the place form sheet, the place card, the city sheet, the calendar's edit form.
- `PRODUCT.md`.
