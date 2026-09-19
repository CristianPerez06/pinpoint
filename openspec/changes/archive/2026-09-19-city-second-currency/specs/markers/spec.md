## MODIFIED Requirements

### Requirement: Every price is in US dollars, and a place can be free

A marker's price SHALL be an amount in US dollars. The system SHALL NOT attach a currency
to a trip, and SHALL NOT convert an amount from one currency to another.

A marker SHALL additionally support an optional local price: an amount in the second
currency of the city it is filed under. A marker SHALL be able to carry a local price
only while it is filed under a city that has a second currency, and the local price SHALL
always be in that city's current second currency. The price in US dollars and the local
price SHALL be independent: either, both or neither MAY be recorded, and neither SHALL be
derived from the other.

A marker SHALL be able to be free. A free marker SHALL be one whose price is zero:
recording a price of 0 and marking a place free SHALL be the same act and SHALL produce
the same record. There SHALL be no separate "free" value that could disagree with the
price. A free marker SHALL NOT carry a local price, and a local price of 0 SHALL NOT be
recorded: a place whose only cost is 0 in any currency is free.

Wherever a price is shown, both applications SHALL present it the same way:

- a free marker as `Free`;
- a whole amount as its currency's three-letter code followed by the amount with
  thousands separators and no decimals, for example `USD 25`, `USD 1,200` or `JPY 3,800`;
- an amount with cents as the code followed by the amount with two decimals, for example
  `USD 32.50` or `EUR 12.50`;
- a marker with both a price in US dollars and a local price as the two joined by ` · `,
  US dollars first, for example `USD 25 · JPY 3,800`;
- a marker with only one of the two as that one alone.

A marker with no price and no local price SHALL show neither an amount nor `Free`.

Rationale: one fixed currency is simpler to enter and to read than one that depends on
which city a place is filed under, and a trip crossing a border is not worth that extra
step. That is why the price every place shares stays in US dollars. The local price is
an addition beside it rather than a replacement, for the price seen on a menu or a ticket
booth, which is known exactly in the local currency and only approximately in dollars.
Free is a price of zero rather than a separate fact because nobody planning a trip
means anything different by the two.

#### Scenario: A price is shown

- **WHEN** a marker has a price of 25
- **THEN** it is presented as `USD 25` on both applications

#### Scenario: A price with cents is shown

- **WHEN** a marker has a price of 32.5
- **THEN** it is presented as `USD 32.50` on both applications

#### Scenario: A free place is shown

- **WHEN** a marker has a price of 0
- **THEN** it is presented as `Free` on both applications
- **AND** no amount is shown beside it

#### Scenario: A place with no price

- **WHEN** a marker has no price and no local price
- **THEN** neither an amount nor `Free` is shown for it

#### Scenario: Both amounts are shown

- **WHEN** a marker in a city whose second currency is JPY has a price of 25 and a local
  price of 3800
- **THEN** it is presented as `USD 25 · JPY 3,800` on both applications

#### Scenario: Only the local amount is shown

- **WHEN** a marker in a city whose second currency is JPY has no price and a local price
  of 3800
- **THEN** it is presented as `JPY 3,800` on both applications
- **AND** nothing is said about US dollars

#### Scenario: A free place with a local amount cannot be recorded

- **WHEN** a marker is recorded as free
- **THEN** it carries no local price
- **AND** it is presented as `Free` alone

#### Scenario: A local price without a second currency is refused

- **WHEN** a local price is submitted for a marker that is filed under no city, or under
  a city with no second currency
- **THEN** the marker is not recorded with a local price

#### Scenario: A marker changes city

- **WHEN** a marker with a price is moved to another city
- **THEN** its stored amount in US dollars is unchanged
- **AND** it is still presented in US dollars

#### Scenario: A marker with a local price changes city

- **WHEN** a marker with a local price is moved to a city whose second currency is
  different, or to a city with none, or to no city
- **THEN** its local price is cleared
- **AND** its price in US dollars is unchanged

#### Scenario: Prices recorded before US dollars

- **WHEN** this rule takes effect
- **THEN** every marker that had a price, including a price of 0, has none
- **AND** no marker is shown as `Free` until someone marks it so

## ADDED Requirements

### Requirement: A city may carry a second currency

A city SHALL support an optional second currency. A city SHALL have at most one. A city
without one SHALL behave as a city did before second currencies existed.

The second currency SHALL be chosen from a fixed list of world currencies, each known by
its three-letter code and its English name, and SHALL NOT be free text. US dollars SHALL
NOT be offered, because every place's price is already in US dollars.

A city's second currency SHALL be able to be set, changed and removed. When it is changed
or removed, every local price recorded on the markers filed under that city SHALL be
cleared, and their prices in US dollars SHALL be unchanged. A local price SHALL NOT be
relabelled into the new currency.

When a city is removed, the markers it held become unassigned and SHALL lose their local
prices, for the same reason.

Rationale: a local amount means nothing once it is no longer in the currency it was
typed in. Showing `JPY 3,800` as `KRW 3,800` would present a wrong price as a right one,
which is worse than showing none. The currency is set on the city rather than on each
place so that every place in Tokyo gets a yen box without anyone choosing yen sixty
times. This differs from the per-city currency reversed in #175: there the city decided
what the one price meant, and here the dollar price means the same everywhere and the
city only adds a second box beside it.

#### Scenario: A city is given a second currency

- **WHEN** a member sets a city's second currency to JPY
- **THEN** the city carries JPY
- **AND** the markers filed under it can each record a local price in JPY

#### Scenario: A city without a second currency

- **WHEN** a city has no second currency
- **THEN** no marker filed under it carries a local price

#### Scenario: A city's second currency is changed

- **WHEN** a member changes a city's second currency from JPY to KRW
- **THEN** every local price on the markers filed under it is cleared
- **AND** their prices in US dollars are unchanged

#### Scenario: A city's second currency is removed

- **WHEN** a member removes a city's second currency
- **THEN** every local price on the markers filed under it is cleared
- **AND** their prices in US dollars are unchanged

#### Scenario: A city with local prices is removed

- **WHEN** a member removes a city whose markers carry local prices
- **THEN** those markers remain on the trip, unassigned
- **AND** their local prices are cleared
- **AND** their prices in US dollars are unchanged

#### Scenario: US dollars is not a second currency

- **WHEN** a member chooses a city's second currency
- **THEN** US dollars is not among the choices
