## ADDED Requirements

### Requirement: A trip can be archived, and archiving is reversible

Any member of a trip SHALL be able to archive it, and SHALL be able to restore an
archived trip. Archiving SHALL NOT delete anything: the trip, its cities, its markers,
its memberships and every recorded interest SHALL survive unchanged, and restoring the
trip SHALL bring all of it back exactly as it was.

Archiving is the product's answer to removing a trip. No table SHALL gain a delete
policy in order to serve it.

Rationale: a trip is the container every other record belongs to, so deleting one
destroys an unbounded amount of somebody else's work — including the work of members who
did not ask for it. Archiving is recoverable, and recoverable is the correct default for
an action any member can take on behalf of everyone.

An archived trip SHALL NOT appear among the trips a person is offered by default, and
SHALL remain reachable through a deliberate act that reveals archived trips. A person
SHALL NOT be able to archive a trip into a state from which it cannot be found again.

Rationale: this is the failure the initial schema went out of its way to avoid, arriving
by a different route. A trip that no select path reaches and no policy removes is a row
nobody can do anything about; hiding one behind an act that cannot be undone is the same
outcome reached deliberately.

Where the trip being archived is the one being viewed, the system SHALL move to another
trip the person belongs to, or to the state shown to a person with no trips. It SHALL
NOT continue to show an archived trip's records.

#### Scenario: A member archives a trip

- **WHEN** a member archives a trip
- **THEN** it stops appearing among the trips they are offered
- **AND** its cities, markers, members and recorded interest are unchanged

#### Scenario: An archived trip is restored

- **WHEN** a member restores an archived trip
- **THEN** it is offered again alongside their other trips
- **AND** everything it contained is exactly as it was before archiving

#### Scenario: Archiving the trip being viewed

- **WHEN** a member archives the trip they are currently viewing
- **THEN** they are shown another trip they belong to, or the state for a person with no trips
- **AND** no record belonging to the archived trip is still shown

#### Scenario: An archived trip is still reachable

- **WHEN** a person has archived every trip they belong to
- **THEN** a deliberate act still reveals those trips
- **AND** any of them can be restored

#### Scenario: Removing a trip is never a delete

- **WHEN** a member acts to remove a trip
- **THEN** the trip is archived
- **AND** no row is deleted from any table
