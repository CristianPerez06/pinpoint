## ADDED Requirements

### Requirement: Both applications offer every action on a trip

Every application that shows a trip SHALL offer creating one, renaming one, adding
somebody to one, archiving one, restoring an archived one, and revealing archived trips.

Each application SHALL present these in the form native to it and SHALL NOT share
rendered markup with the other. What is shared is the behaviour that validates, reads
and writes them, which SHALL remain a single implementation usable from either platform.

An application SHALL NOT be the only place a capability of this specification can be
exercised. Either application SHALL be sufficient on its own: a person SHALL be able to
manage every trip they belong to from one of them and never open the other.

This bounds capability rather than arrangement. An application MAY reach the same act by
a different route, in a different order, or from a different control, and MAY decline a
convenience the other offers — what it SHALL NOT do is leave the answer as "do that on
the other one".

Rationale: this is the rule `marker-capture` and `marker-interest` already carry, for
the specification that lacked it. Its absence is not academic. Archiving, restoring and
revealing archived trips existed on the phone and on neither the web nor in any
requirement naming a platform, so a trip archived on a phone disappeared from the web
with no way to bring it back — and nothing in the specifications said that was wrong,
because the requirement it broke was in PRODUCT.md rather than here. A rule stated
positively is what stops the next trip capability being built on one platform and
called done.

#### Scenario: A trip action on either platform

- **WHEN** a person opens a trip on either application
- **THEN** they are offered a way to rename it, to add somebody to it, to make another
  trip, to archive it, to reveal archived trips, and to restore one

#### Scenario: One application is never opened

- **WHEN** a person uses only one of the applications for an entire trip
- **THEN** no capability of this specification is unavailable to them

#### Scenario: The route differs between the applications

- **WHEN** the same trip action is reached differently on the two applications
- **THEN** both still offer it
- **AND** neither directs the person to the other application to perform it

## MODIFIED Requirements

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

Archiving SHALL NOT require confirming a second time. It is reversible by any member,
and a confirmation on a reversible act is what teaches somebody to dismiss the ones that
are not.

Archived state SHALL be a fact about the trip rather than about the application that
wrote it. A trip archived on one application SHALL be archived on the other, and SHALL
be revealed and restored from either.

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

#### Scenario: Archiving asks nothing further

- **WHEN** a member acts to archive a trip
- **THEN** the trip is archived without a further confirmation being required
- **AND** the way to restore it is reachable afterwards

#### Scenario: A trip archived on one platform is restored from the other

- **WHEN** a member archives a trip on one application and reveals archived trips on the other
- **THEN** that trip is among them
- **AND** restoring it there offers it again on both
