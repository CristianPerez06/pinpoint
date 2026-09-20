## MODIFIED Requirements

### Requirement: A person chooses which of their trips they are viewing

Where a person belongs to more than one trip, the system SHALL show which trip is
being viewed and SHALL offer a way to change it. Where they belong to exactly one,
it SHALL NOT require a choice to be made.

Changing the trip being viewed SHALL replace everything scoped to a trip — its
markers, its cities, its members, and any filter narrowing them — rather than
carrying any of it across.

Each application MAY decide for itself whether the choice survives being closed and
reopened. What SHALL NOT happen is a person being shown one trip's records while
another trip is named as the one they are viewing.

**Where the trips are listed for one to be chosen, a trip carrying dates SHALL show them
beside its name**, worded as `trip-calendar` defines a stretch of days. A trip carrying a
start and no end SHALL read as that date preceded by a word meaning it continues, and a
trip carrying an end and no start SHALL read as that date preceded by a word meaning it
runs until then, so that a single date is never shown without saying which end of the
trip it is.

A trip carrying no dates SHALL show its name alone. It SHALL NOT show a placeholder, a
dash, or a phrase standing in for the dates it does not have. Most trips exist in that
state for most of their life, and a column of such phrases says nothing while taking the
room the names need.

The name SHALL remain readable when it is long: where a name and a set of dates cannot
both fit, the name SHALL be shortened and the dates SHALL be shown in full, because the
dates are what distinguishes two trips whose names are alike.

These dates SHALL be read only. Changing them is defined by `trip-calendar` and SHALL NOT
be offered from the list.

Rationale: this is the one place where all of a person's trips are visible at once, and a
name alone reads the same whether a trip runs next month or ran last year. Two visits to
one city are the same word twice.

#### Scenario: A person belongs to several trips

- **WHEN** a person who belongs to more than one trip opens the application
- **THEN** the trip being viewed is named
- **AND** they can change to another trip they belong to

#### Scenario: A person belongs to one trip

- **WHEN** a person who belongs to exactly one trip opens the application
- **THEN** that trip is shown
- **AND** they are not asked to choose

#### Scenario: The trip being viewed changes

- **WHEN** a person changes which trip they are viewing
- **THEN** the markers, cities and members shown are that trip's
- **AND** no filter from the previous trip is still applied

#### Scenario: A trip that is no longer reachable

- **WHEN** the trip a person was viewing is no longer among the trips they belong to
- **THEN** they are shown a trip they do belong to, or the state for belonging to none
- **AND** they are not shown records from a trip they cannot name

#### Scenario: A dated trip in the list

- **WHEN** a person opens the list of their trips and one carries both dates
- **THEN** that trip shows the stretch of days it runs, beside its name

#### Scenario: A trip carrying one date

- **WHEN** a trip in the list carries a start date and no end date
- **THEN** it shows that date worded so that it reads as the trip's beginning
- **AND** the date is not shown bare, where it could be read as either end

#### Scenario: A trip carrying no dates

- **WHEN** a trip in the list carries neither a start nor an end date
- **THEN** it shows its name alone
- **AND** nothing stands in place of the dates

#### Scenario: A long name beside a set of dates

- **WHEN** a trip whose name is too long to sit beside its dates appears in the list
- **THEN** the dates are shown in full
- **AND** the name is shortened rather than wrapped or pushed out of the row

#### Scenario: A trip's dates are changed while the list can be opened

- **WHEN** a trip's dates are set, changed or cleared
- **THEN** the list shows the new dates the next time it is opened
- **AND** nothing has to be reloaded for it to do so
