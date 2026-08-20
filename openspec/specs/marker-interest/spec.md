# marker-interest Specification

## Purpose

Define how a traveller says they want to go somewhere, how they take that back, and how
a place is marked as already visited. The `markers` capability states what interest *is*
— per member, with absence meaning undecided; this one states how it is recorded and by
whom.

## Requirements

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

### Requirement: Both applications offer recording interest and marking visited

Every application that displays a trip's markers SHALL offer recording interest,
withdrawing it, and marking a place visited.

Each application SHALL present these in the form native to it and SHALL NOT share rendered
markup with the other. What is shared is the behaviour that reads and writes them, which
SHALL remain a single implementation usable from either platform.

An application SHALL NOT offer a control for recording interest attributed to a member
other than the reader, on any platform. This mirrors what the stored policies enforce
rather than restating it in words somebody has to read.

Rationale: interest and visited are per-member facts about a shared trip, and a person
carrying a phone is as entitled to record one as a person at a laptop — more so for
visited, which is decided in the street. Two applications that disagree about whether an
answer can be given would make the trip's records depend on which device was to hand.

#### Scenario: Recording interest on either platform

- **WHEN** a member opens a marker on either application
- **THEN** they are offered a way to record that they want to go, that they do not, and to
  withdraw what they recorded

#### Scenario: Marking visited on either platform

- **WHEN** a member opens a marker on either application
- **THEN** they are offered a way to mark it visited and to unmark it

#### Scenario: Another member's record

- **WHEN** a marker's recorded interest is displayed on either application
- **THEN** every member's state is shown
- **AND** no control is offered for changing anybody's record but the reader's own

#### Scenario: A record written on one platform is seen on the other

- **WHEN** a member records interest on one application and the trip is opened on the other
- **THEN** the record is present
- **AND** it is indistinguishable from one recorded on that platform

### Requirement: A recorded answer appears without re-reading the trip

When a member records interest, withdraws it, or changes whether a place is visited, the
application SHALL show the new state immediately rather than after re-reading the trip.

If the write is refused, the application SHALL restore what was displayed before and
SHALL report the failure. It SHALL NOT leave the display asserting something the stored
data does not say.

Rationale: these are the smallest writes in the product and the ones made in the largest
number in a row — going through a whole trip marking what you want to see. A control that
waited for a round trip before changing would be worse than the spreadsheet this replaces,
and one that never corrected itself would quietly lie.

#### Scenario: An answer is recorded

- **WHEN** a member records interest in a marker
- **THEN** their state changes immediately
- **AND** the trip is not re-read to show it

#### Scenario: A write is refused

- **WHEN** a recorded answer is refused by the stored policies
- **THEN** the displayed state returns to what it was before
- **AND** the failure is reported rather than passed over
