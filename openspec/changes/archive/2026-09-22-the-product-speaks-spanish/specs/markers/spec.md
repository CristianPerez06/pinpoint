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

- a free marker as the word for free in the language being read — `Free` in English,
  `Gratis` in Spanish — which SHALL be a named sentence held with every other sentence the
  product says;
- a whole amount as its currency's three-letter code followed by the amount with
  thousands separators and no decimals, for example `USD 25`, `USD 1,200` or `JPY 3,800`;
- an amount with cents as the code followed by the amount with two decimals, for example
  `USD 32.50` or `EUR 12.50`;
- a marker with both a price in US dollars and a local price as the two joined by ` · `,
  US dollars first, for example `USD 25 · JPY 3,800`;
- a marker with only one of the two as that one alone.

The three-letter code SHALL be the same in every language. A currency code is not a word
and SHALL NOT be translated, and the code SHALL precede the amount in every language.

How the amount itself is written SHALL follow the language being read, in that language's
own convention rather than by substituting one mark for another:

- In English the thousands separator SHALL be a comma and the decimal separator a full
  stop, as the examples above show.
- In Spanish the decimal separator SHALL be a comma, so `USD 32.50` reads `USD 32,50`.
- In Spanish a four-digit amount SHALL carry **no** thousands separator, so `USD 1,200`
  reads `USD 1200` and `JPY 3,800` reads `JPY 3800`. From five digits the separator SHALL
  be a full stop, so `USD 12,000` reads `USD 12.000`.

A marker with no price and no local price SHALL show neither an amount nor the word for
free.

Rationale: one fixed currency is simpler to enter and to read than one that depends on
which city a place is filed under, and a trip crossing a border is not worth that extra
step. That is why the price every place shares stays in US dollars. The local price is
an addition beside it rather than a replacement, for the price seen on a menu or a ticket
booth, which is known exactly in the local currency and only approximately in dollars.
Free is a price of zero rather than a separate fact because nobody planning a trip
means anything different by the two.

Rationale for the separators following the language rather than being pinned: `USD 1,200`
read by somebody reading Spanish is one dollar and two tenths, not twelve hundred, and it
is a price — the one number on the screen where being wrong by a factor of a thousand
matters. What is pinned is not the punctuation but the agreement: the phone and the laptop
SHALL produce the identical string from the identical stored amount **and the identical
language**, and neither SHALL ask the device what it prefers. A laptop set to one language
and a phone set to another, both being read in Spanish, still show the same price.

Rationale for the four-digit rule being written down rather than left to follow from the
others: it does not follow from them. Spanish omits the thousands separator entirely at
four digits and takes it up again at five, which reads as a bug to anybody who has only
seen the rule stated as *comma becomes full stop* — and `1200` and `3800` are the sizes
an actual price on this product lands on, so the exception is the common case here and the
rule is the rare one.

#### Scenario: A price is shown

- **WHEN** a marker has a price of 25
- **THEN** it is presented as `USD 25` on both applications

#### Scenario: A price with cents is shown

- **WHEN** a marker has a price of 32.5
- **THEN** it is presented as `USD 32.50` on both applications reading English
- **AND** as `USD 32,50` on both applications reading Spanish

#### Scenario: A four-digit price is shown

- **WHEN** a marker has a price of 1200
- **THEN** it is presented as `USD 1,200` on both applications reading English
- **AND** as `USD 1200` on both applications reading Spanish, with no separator

#### Scenario: A five-digit price is shown

- **WHEN** a marker has a price of 12000
- **THEN** it is presented as `USD 12,000` on both applications reading English
- **AND** as `USD 12.000` on both applications reading Spanish

#### Scenario: A free place is shown

- **WHEN** a marker has a price of 0
- **THEN** it is presented as `Free` on both applications reading English
- **AND** as `Gratis` on both applications reading Spanish
- **AND** no amount is shown beside it

#### Scenario: Two devices set to different languages

- **WHEN** a phone and a laptop are set to different device languages
- **AND** both are being read in the same language
- **THEN** the same stored amount is presented as the identical string on both

#### Scenario: A place with no price

- **WHEN** a marker has no price and no local price
- **THEN** neither an amount nor the word for free is shown for it

#### Scenario: Both amounts are shown

- **WHEN** a marker in a city whose second currency is JPY has a price of 25 and a local
  price of 3800
- **THEN** it is presented as `USD 25 · JPY 3,800` on both applications reading English
- **AND** as `USD 25 · JPY 3800` on both applications reading Spanish

#### Scenario: Only the local amount is shown

- **WHEN** a marker in a city whose second currency is JPY has no price and a local price
  of 3800
- **THEN** it is presented as `JPY 3,800` on both applications
- **AND** nothing is said about US dollars

#### Scenario: A currency code under another language

- **WHEN** a price in Japanese yen is shown to somebody reading Spanish
- **THEN** the code reads `JPY`
- **AND** it precedes the amount

#### Scenario: A free place with a local amount cannot be recorded

- **WHEN** a marker is recorded as free
- **THEN** it carries no local price
- **AND** it is presented as the word for free alone

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
- **AND** no marker is shown as free until someone marks it so
