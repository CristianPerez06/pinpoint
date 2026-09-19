## ADDED Requirements

### Requirement: Every price is in US dollars, and a place can be free

A marker's price SHALL be an amount in US dollars. The system SHALL NOT offer any other
currency, SHALL NOT attach a currency to a city or a trip, and SHALL NOT convert an
amount.

A marker SHALL be able to be free. A free marker SHALL be one whose price is zero:
recording a price of 0 and marking a place free SHALL be the same act and SHALL produce
the same record. There SHALL be no separate "free" value that could disagree with the
price.

Wherever a price is shown, both applications SHALL present it the same way:

- a free marker as `Free`;
- a whole amount as `USD` followed by the amount with thousands separators and no
  decimals, for example `USD 25` or `USD 1,200`;
- an amount with cents as `USD` followed by the amount with two decimals, for example
  `USD 32.50`.

A marker with no price SHALL show neither an amount nor `Free`.

Rationale: one fixed currency is simpler to enter and to read than one that depends on
which city a place is filed under, and a trip crossing a border is not worth that extra
step. Free is a price of zero rather than a separate fact because nobody planning a trip
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

- **WHEN** a marker has no price
- **THEN** neither an amount nor `Free` is shown for it

#### Scenario: A marker changes city

- **WHEN** a marker with a price is moved to another city
- **THEN** its stored amount is unchanged
- **AND** it is still presented in US dollars

#### Scenario: Prices recorded before US dollars

- **WHEN** this rule takes effect
- **THEN** every marker that had a price, including a price of 0, has none
- **AND** no marker is shown as `Free` until someone marks it so

## REMOVED Requirements

### Requirement: A city declares the currency its markers' prices are in

**Reason**: Every price is now in US dollars. A currency that depends on the city a place
is filed under was an extra step when making a city and made prices harder to read at a
glance (#175).

**Migration**: Replaced by *Every price is in US dollars, and a place can be free*. The
city currency is deleted, and every stored price is cleared, because an amount typed in
another currency would otherwise be shown as dollars.
