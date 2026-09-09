# place-search

## MODIFIED Requirements

### Requirement: Searching offers candidates while the person types

The system SHALL query for candidates as the person types, rather than requiring
them to submit the query.

It SHALL NOT issue one request per keystroke. A request SHALL be made only after
typing has paused.

When a newer query supersedes an older one, the older one's results SHALL be
discarded even if they arrive later. A superseded answer SHALL NOT be presented
as the answer to the current query.

While a query is in flight, the answer to the previous query MAY remain visible,
provided the list is marked as not yet answering what is currently typed. When
the newer answer arrives it SHALL replace what is shown, whatever that answer is.

Each candidate SHALL carry at least a name and a position, because those are the
two things a marker cannot be created without.

#### Scenario: Typing a query quickly

- **WHEN** a person types eight characters in rapid succession
- **THEN** the service is queried after they pause
- **AND** not once per character

#### Scenario: An earlier response arrives late

- **WHEN** the response to an earlier query arrives after the response to a later one
- **THEN** the earlier response is discarded
- **AND** the displayed candidates correspond to the current query text

#### Scenario: Refining a query that has already answered

- **WHEN** a person adds to a query whose candidates are already shown
- **THEN** those candidates remain visible while the new query is in flight
- **AND** the list is marked as not yet answering what is currently typed
- **AND** they are replaced when the new answer arrives

#### Scenario: A refined query finds nothing

- **WHEN** the answer to a refined query has no candidates
- **THEN** the previous candidates are removed
- **AND** the list says that nothing matched

#### Scenario: A candidate is offered

- **WHEN** a candidate place is shown to the person
- **THEN** it carries a name and a position
- **AND** choosing it is enough to place a marker without further lookup

## ADDED Requirements

### Requirement: The wait for candidates is shown in the shape of the list that is coming

While a request for candidates is in flight and no candidates are shown, the
system SHALL indicate the wait in the shape of the list that will replace it:
placeholder rows measuring the same as a candidate row.

It SHALL NOT show placeholder rows while no request has been sent. The interval
between a keystroke and the request that follows it is not a search, and
indicating one there claims a wait that has not begun.

Placeholder rows SHALL NOT be presented as candidates. They SHALL NOT be
choosable, and SHALL NOT be offered individually to a screen reader.

The wait SHALL be stated in words as well as in shape, on every platform.
Placeholder rows on their own are indistinguishable from content that happens to
be blank, which is the reading this whole state exists to prevent.

Where the surface holding the list is sized to its own content, its width MAY
change when candidates replace placeholder rows. The placeholder rows SHALL be
sized so that the change is small. The surface SHALL NOT move.

Rationale: this is the only wait in the product where the container is already
open and the shape of what is coming is known before it arrives, which is what a
placeholder can trade on and a message alone cannot. It buys two things: rows do
not change height as they land, and the wait reads as an answer arriving rather
than as an absence.

The width allowance is not a concession, it is the consequence of a rule stated
elsewhere: a results surface sized to its widest row is sized by whatever is in
it, and placeholder rows are in it. Fixing its width for the wait would trade a
small movement for a list that truncates the very thing the sizing rule exists
to protect. What must not move is the surface itself and the height of a row,
which is what is read as a list jumping.

#### Scenario: The first search of a session

- **WHEN** a request for candidates is in flight and nothing is shown below the field
- **THEN** placeholder rows are shown
- **AND** they measure the same as the candidate rows that will replace them
- **AND** the wait is also stated in words

#### Scenario: Typing, before a request has been sent

- **WHEN** a person is typing and the pause before a request has not elapsed
- **THEN** no placeholder rows are shown
- **AND** nothing claims that a search is in progress

#### Scenario: A placeholder is not a candidate

- **WHEN** placeholder rows are shown
- **THEN** none of them can be chosen
- **AND** a screen reader is told that a search is running, rather than being
  offered the placeholder rows one by one

#### Scenario: Candidates arrive

- **WHEN** the answer arrives while placeholder rows are shown
- **THEN** the candidates replace them
- **AND** each candidate row occupies the height its placeholder occupied
- **AND** the surface holding the list does not move

### Requirement: A candidate row has one height

Every candidate row in a given rendering SHALL occupy the same height, whether or
not the candidate carries the optional parts of a row.

Rationale: a candidate's surrounding place name and its distance are both
optional, so a list mixing candidates that have them with candidates that do not
draws rows of two different heights. The list ripples as it is read, two
neighbouring results are given different visual weight for a reason that has
nothing to do with either of them, and no placeholder can match a row whose
height depends on data that has not arrived.

#### Scenario: Candidates with and without a surrounding place name

- **WHEN** a result list mixes candidates that carry a surrounding place name
  with candidates that do not
- **THEN** every row occupies the same height

#### Scenario: Candidates with and without a distance

- **WHEN** a result list mixes candidates that carry a distance with candidates
  that do not
- **THEN** every row occupies the same height
