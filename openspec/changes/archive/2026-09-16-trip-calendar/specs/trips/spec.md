## ADDED Requirements

### Requirement: A trip may carry the dates it runs between

A trip SHALL support an optional start date and an optional end date. Either SHALL be
able to be absent independently of the other, and a trip with neither SHALL be valid and
SHALL behave in every other respect exactly as a trip with both.

Where both are present, the end date SHALL NOT fall before the start date.

These dates SHALL constrain nothing. They SHALL NOT limit what dates the trip's markers
may carry, SHALL NOT cause any marker to be hidden, and SHALL NOT be required before any
other capability of the product can be used.

Changing or clearing a trip's dates SHALL NOT alter the date carried by any of its
markers.

Rationale: the dates exist to say roughly when the trip is, so that a calendar has
somewhere sensible to open. Reading them as a boundary would mean a place dated a day
either side of the trip is silently dropped, and shifting a trip by a day would quietly
rewrite every decision already made about it. Both are the kind of failure that produces
a screen which looks correct and is not.

What SHALL be able to set and change them is defined by `trip-calendar`.

#### Scenario: A trip with no dates

- **WHEN** a trip is created with neither a start nor an end date
- **THEN** it is valid
- **AND** every other capability of the product is available on it

#### Scenario: An end date before the start date

- **WHEN** a trip is given an end date falling before its start date
- **THEN** it is rejected
- **AND** the rejection names the offending field

#### Scenario: A trip's dates are changed

- **WHEN** a trip's start or end date is changed or cleared
- **THEN** no marker on that trip has its date altered
- **AND** no marker becomes hidden as a result

#### Scenario: One date without the other

- **WHEN** a trip carries a start date and no end date
- **THEN** it is valid
- **AND** the absent date is recorded as absent rather than as a placeholder value
