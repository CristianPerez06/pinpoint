## REMOVED Requirements

### Requirement: Recording interest and visited is offered by the web application only

**Reason**: The roadmap decision that the phone gets everything the laptop has. This
requirement existed to scope the first four changes, and it stated its own expiry: the
shared functions were to stay usable from either platform so that offering them on the
phone later would be "a matter of drawing controls rather than moving logic". That is what
this change does.

Marking visited is the clearest case. It is decided standing outside a place, and until
now it could only be recorded on the machine nobody has with them.

**Migration**: None for stored data — no schema, policy or shared function changes. Any
change that relied on this requirement to justify a mobile screen offering no controls
should now rely on the requirement replacing it, which requires the opposite.

## ADDED Requirements

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
