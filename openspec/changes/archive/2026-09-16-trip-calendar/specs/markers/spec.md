## ADDED Requirements

### Requirement: A marker may carry the date it is planned for

A marker SHALL support an optional date, naming the day the place is planned for. It
SHALL be a calendar date and SHALL NOT carry a time of day.

A marker SHALL carry at most one date. A marker with no date SHALL be valid, SHALL
remain visible and addressable, and SHALL be distinguishable from one whose date has
been chosen — the absence of a date means the decision has not been made, which is not
the same as any particular day.

A marker's date SHALL be independent of the trip's dates, and SHALL be able to fall
outside them. The store SHALL NOT reject a date on those grounds and SHALL NOT adjust it.

A marker's date SHALL be independent of the city it is filed under. Neither SHALL
constrain, derive, or default the other.

Rationale for the last part: a city and a date are two groupings of one set of places,
sitting beside each other rather than one inside the other. A date that had to agree
with a city would make the day a level underneath the city, which is the arrangement
this product has decided against — a place can be "Kyōto" and "Thursday", and a day trip
that crosses a city boundary is an ordinary thing to plan.

#### Scenario: A marker is created without a date

- **WHEN** a marker is created with no date
- **THEN** it is valid
- **AND** the date is recorded as absent rather than as a placeholder value

#### Scenario: A date outside the trip's dates

- **WHEN** a marker is given a date falling before a trip's start date or after its end date
- **THEN** it is stored as given
- **AND** it is neither rejected nor adjusted

#### Scenario: A date on a trip that has none

- **WHEN** a marker on a trip carrying no dates of its own is given a date
- **THEN** it is stored
- **AND** the trip is not required to have dates first

#### Scenario: A date and a city do not constrain each other

- **WHEN** a marker is given a date, and is filed under a city whose other markers carry
  different dates
- **THEN** both the date and the city are stored as given
- **AND** neither is changed on account of the other
