## ADDED Requirements

### Requirement: A city declares the currency its markers' prices are in

A city SHALL support an optional currency. A marker's price SHALL be interpreted
in the currency of the city it is filed under, and SHALL be presented with it
wherever the price is shown.

A marker with no city, or filed under a city that declares no currency, SHALL have
its price presented as a bare amount. The system SHALL NOT assume a currency, and
SHALL NOT fall back to one declared elsewhere: a price shown in the wrong currency
is worse than a price shown in none, because it looks correct.

Moving a marker to a city with a different currency SHALL reinterpret the price
and SHALL NOT convert the stored amount. Amounts are what someone typed off a menu
or a ticket price; converting them would invent precision and would go stale.

The currency belongs to the city rather than to the trip so that one trip can
cross a border, and to the city rather than to each marker so that it is stated
once instead of on every place saved.

#### Scenario: A price under a city with a currency

- **WHEN** a marker with a price is filed under a city that declares a currency
- **THEN** the price is presented in that currency
- **AND** both applications present it the same way

#### Scenario: A price under a city with no currency

- **WHEN** a marker with a price is filed under a city that declares no currency
- **THEN** the price is presented as a bare amount
- **AND** no currency is assumed for it

#### Scenario: A price on an unassigned marker

- **WHEN** a marker with a price is filed under no city
- **THEN** the price is presented as a bare amount
- **AND** the marker remains visible and addressable

#### Scenario: A marker is refiled under a different currency

- **WHEN** a marker is moved from a city declaring one currency to a city declaring another
- **THEN** the stored amount is unchanged
- **AND** it is presented in the new city's currency

### Requirement: A marker's city belongs to the same trip as the marker

The system SHALL reject a marker that references a city belonging to a different
trip. This SHALL be enforced by the store itself and not only by the code that
writes markers, because more than one application writes and the trip is the
single boundary every access rule resolves to.

A marker whose city reference is rejected SHALL NOT be stored at all, rather than
being stored unassigned. Silently dropping the city would file a place somewhere
the person did not choose and give no sign of it.

#### Scenario: A marker references another trip's city

- **WHEN** a marker on one trip is submitted referencing a city belonging to another
- **THEN** it is rejected
- **AND** no marker is stored

#### Scenario: A write bypasses the application

- **WHEN** such a marker is written directly to the store, without passing through the applications
- **THEN** the store refuses it
- **AND** the refusal does not depend on which client issued the write
