## Purpose

Define how a traveller says they want to go somewhere, how they take that back, and how
a place is marked as already visited. The `markers` capability states what interest *is*
— per member, with absence meaning undecided; this one states how it is recorded and by
whom.

## ADDED Requirements

### Requirement: A member records their own interest in a marker

A member SHALL be able to record that they want to go to a marker, or that they do not,
and SHALL be able to withdraw that record and return to undecided.

Recording SHALL affect only the recording member. One member's answer SHALL NOT create,
change or remove another member's.

Withdrawing SHALL remove the record rather than storing a third value, because the
absence of a record is what the model already defines as undecided. Storing "undecided"
as a value would give two representations of one state, and code would eventually
disagree about which is authoritative.

#### Scenario: A member says they want to go

- **WHEN** a member marks a marker as wanted
- **THEN** their interest is recorded as interested
- **AND** no other member's record changes

#### Scenario: A member says they do not want to go

- **WHEN** a member marks a marker as not wanted
- **THEN** their interest is recorded as not interested
- **AND** this is stored, not treated as the absence of an opinion

#### Scenario: A member takes back an answer

- **WHEN** a member withdraws their recorded interest
- **THEN** the record is removed
- **AND** their state is undecided again
- **AND** it is indistinguishable from never having answered

#### Scenario: Two members answer differently

- **WHEN** one member marks a marker wanted and another marks the same marker not wanted
- **THEN** both records exist
- **AND** neither has overwritten the other

### Requirement: A member cannot record interest for anybody else

The system SHALL refuse an attempt to record, change or withdraw interest attributed to
a member other than the one making the request.

This SHALL be enforced where the data is stored rather than only in the interface, so
that the guarantee holds for any caller and not only the one that draws the buttons.

#### Scenario: Recording interest on another member's behalf

- **WHEN** a request records interest attributed to a different member of the trip
- **THEN** the request is refused
- **AND** no record is created or changed

### Requirement: Interest is shown per member, not as a total

Where a marker's recorded interest is displayed, the system SHALL show each member's
state individually rather than only a count or a summary.

Rationale: the question the trip is actually asking is *who* wants to go, not how many.
A count of one cannot answer "is that me or is that you", which is the whole reason
interest is stored per member.

Undecided SHALL be displayed as its own state, distinct from not interested.

#### Scenario: A marker with mixed interest is shown

- **WHEN** a marker where one member is interested and another is undecided is displayed
- **THEN** each member's state is shown separately
- **AND** the undecided member is not shown as uninterested

### Requirement: A marker is marked visited for the whole trip

Any member of the trip SHALL be able to mark a marker visited, and to unmark it.

Marking SHALL apply to the marker for everyone on the trip, and the system SHALL NOT
record who marked it, because the model defines visiting as shared.

#### Scenario: A member marks a place visited

- **WHEN** any member marks a marker visited
- **THEN** it is visited for every member of the trip
- **AND** no per-member visited state is created

#### Scenario: A place is unmarked

- **WHEN** a member unmarks a visited marker
- **THEN** it is no longer visited for anyone on the trip

### Requirement: Recording interest and visited is offered by the web application only

The web application SHALL offer recording interest and marking visited. The mobile
application SHALL NOT, in this change.

Rationale: planning happens at a laptop, which is the same reason capture is web-only.
The shared reading and writing functions SHALL remain usable from either platform, so
that offering them on the phone later is a matter of drawing controls rather than moving
logic.

#### Scenario: The mobile application shows interest without offering to change it

- **WHEN** a marker is opened in the mobile application
- **THEN** no control for recording interest or marking visited is offered
- **AND** the shared functions that would perform it remain importable on that platform
