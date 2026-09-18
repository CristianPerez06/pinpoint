## REMOVED Requirements

### Requirement: Saving a place captures its name, note, city, type, link, and price

**Reason**: The requirement's own name enumerates the fields, and the day the place is
planned for is now one of them. The form has captured it on the web application since the
calendar was built and this list was never updated, so it named six fields where the form
has seven. A name cannot be changed inside a MODIFIED delta, so the requirement is
replaced.

**Migration**: Replaced by "Saving a place captures its name, note, city, type, link,
price, and the day it is planned for" under ADDED below. Every sentence and every scenario
is carried forward unchanged; the day is added to the list and to the fields whose absence
is recorded as absent. What the day means, and that it is offered beside the city rather
than as a separate act, is defined by `trip-calendar` and is not restated here.

## ADDED Requirements

### Requirement: Saving a place captures its name, note, city, type, link, price, and the day it is planned for

One form SHALL capture a place's name, note, city, type, link, price, and the day it
is planned for, and the same form SHALL be used when editing an existing marker.

A name and a position SHALL be required. Every other field SHALL be optional, and
an optional field left blank SHALL be recorded as absent rather than as empty
text.

When a submission is rejected, the system SHALL name the offending field and SHALL
preserve everything the person typed. A rejection SHALL NOT discard the unsaved
marker or its position.

On success the saved place SHALL appear among the trip's markers without the
person having to reload or navigate away.

#### Scenario: Saving with only the required fields

- **WHEN** a person saves a place with a name and a position and nothing else
- **THEN** it is stored
- **AND** it appears among the trip's markers

#### Scenario: Optional fields left blank

- **WHEN** a person saves a place leaving the note, link, price, and day blank
- **THEN** those fields are recorded as absent
- **AND** they are not recorded as empty text

#### Scenario: A submission is rejected

- **WHEN** a person saves a place with no name
- **THEN** the submission is rejected
- **AND** the rejection names the name field
- **AND** the other values they typed and the marker's position are preserved

#### Scenario: A place is saved successfully

- **WHEN** saving succeeds
- **THEN** the place is drawn on the map as an ordinary marker
- **AND** the person is not made to reload the trip to see it
