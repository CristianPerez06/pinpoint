## ADDED Requirements

### Requirement: An invitation no account has claimed can be taken back

Any member of a trip SHALL be able to remove a membership on that trip that no account has
claimed. Every application that lists a trip's members SHALL offer this, from the list
where that membership is already shown as not joined.

A membership an account **has** claimed SHALL NOT be removable by this. The system SHALL
refuse such a write at the database rather than only declining to offer it, so that the
rule holds for any caller and not only for the two applications.

Removing an unclaimed membership SHALL leave the trip otherwise unchanged: no marker, no
city, no other membership, and no recorded interest is affected. An unclaimed membership
SHALL NOT be capable of holding recorded interest, because interest is recorded against a
member by the account that claimed it.

The act SHALL ask before it happens, under the rule that governs every write destroying
something a person entered. The display name and the address were typed by somebody and
cannot be recovered except by typing them again. The question SHALL NOT carry a count of
affected records, because there are none — and stating a consequence that does not exist
is its own kind of wrong.

Rationale: nothing is sent when somebody is invited. The address is the claim key, so an
address entered wrongly produces a membership nobody can ever claim, sitting in the list
beside the person it was meant for. Both applications already show that this has happened
and at what address — that requirement exists because only the inviter can fix it. Until
now there was nothing for them to fix it with, so the product could name the mistake and
not undo it.

This is deliberately narrower than removing a member. A claimed membership carries recorded
interest, and deleting it would cascade that interest away and change what the trip's
filters match for everybody else, with nothing recording why. That remains unbuilt and
undecided. The unclaimed case is exempt from the whole of that argument rather than excused
from it: nobody has ever signed in as an unclaimed membership, so there is nothing of
theirs to lose.

#### Scenario: A mistyped invitation is taken back

- **WHEN** a member removes a membership on their trip that no account has claimed, and
  confirms the question
- **THEN** that membership no longer exists
- **AND** the list no longer shows it
- **AND** no marker, city, other membership or recorded interest on that trip changes

#### Scenario: The question is asked first

- **WHEN** a member asks to remove an unclaimed membership
- **THEN** they are asked to confirm before anything is written
- **AND** declining leaves the membership exactly as it was

#### Scenario: A claimed membership is not offered

- **WHEN** a trip's members are listed
- **THEN** no control to remove is offered against a member whose account has claimed their
  membership

#### Scenario: A claimed membership is refused by the database

- **WHEN** a caller attempts to delete a membership that an account has claimed
- **THEN** the write is refused
- **AND** the membership is unchanged

#### Scenario: Somebody who is not a member attempts it

- **WHEN** an account that is not a member of a trip attempts to delete a membership on it
- **THEN** the write is refused by the database

#### Scenario: The address can be used again

- **WHEN** an unclaimed membership at an address is taken back
- **AND** somebody is then invited at that same address on that trip
- **THEN** the invitation succeeds
