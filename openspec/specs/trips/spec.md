# trips Specification

## Purpose

Define the trip as the container everything else belongs to, the people who are on it,
and the distinction between a *member* — a person on a trip — and a *user* — an
authenticated account. Membership is the single authorization boundary in the product:
every row-level security policy resolves to it.
## Requirements
### Requirement: A trip is the container every other record belongs to

The system SHALL model a trip as a named record. Every city, marker, and membership
SHALL belong to exactly one trip, and SHALL NOT be reachable outside it.

The system SHALL support more than one trip existing at a time, and SHALL scope the
signed-in person's view to one trip at a time.

#### Scenario: Records belong to a trip

- **WHEN** a city or a marker is created
- **THEN** it is associated with exactly one trip
- **AND** it cannot exist without one

#### Scenario: A second trip is added

- **WHEN** a second trip exists
- **THEN** the cities and markers of one trip never appear while viewing the other

### Requirement: A member is distinct from a user account

The system SHALL model a member — a person on a trip — separately from a user — an
authenticated account. A member record SHALL be able to exist before the corresponding
account does, and SHALL carry the display name shown for that person.

The reference from a member to a user account SHALL be optional. Records attributed to a
person SHALL reference the member, never the user account directly.

This separation exists so that adding a person to a trip does not require them to have
signed up yet, and so that attribution never has to be rewritten when they do.

#### Scenario: A member exists before their account

- **WHEN** a member is added to a trip and no account has been created for them
- **THEN** the member record is valid
- **AND** their display name is shown wherever that person is referenced

#### Scenario: An account is linked to an existing member

- **WHEN** a person creates an account and is linked to their existing member record
- **THEN** every record already attributed to that member remains attributed to them
- **AND** no attributed record is modified

#### Scenario: Attribution never points at an account

- **WHEN** a record that belongs to a specific person is inspected
- **THEN** it references a member
- **AND** it does not reference a user account

### Requirement: A person sees only the trips they are a member of

The system SHALL restrict every read and every write to trips on which the requesting
account is linked to a member.

A signed-in person SHALL be able to list the trips they belong to. An account with no
membership SHALL see no trips, no cities, and no markers, rather than an error.

#### Scenario: Listing trips

- **WHEN** a signed-in person requests their trips
- **THEN** they receive exactly the trips whose members include their account
- **AND** no other trip appears

#### Scenario: Requesting a trip they do not belong to

- **WHEN** a signed-in person requests a trip they are not a member of, by its identifier
- **THEN** the request returns nothing
- **AND** the response does not reveal whether that trip exists

#### Scenario: An account with no membership

- **WHEN** a person with an account but no membership signs in
- **THEN** they see an empty set of trips
- **AND** the application does not fail

### Requirement: Row-level security is enabled on every table and resolves to membership

Every table the applications can reach SHALL have row-level security enabled. A table
without it is reachable in full by anyone holding the publishable key, which is embedded
in both shipped client bundles.

Every policy SHALL resolve, directly or through the row's trip, to whether the
requesting account is linked to a member of that trip. Access SHALL NOT be granted on
the basis of a value the client supplies, such as a trip identifier in the request.

Where a write cannot resolve to an existing membership — creating a trip is the only
such case, because the membership it would resolve to is the one being created — it
SHALL be performed by a `SECURITY DEFINER` function rather than by a policy written
loosely enough to permit it. Such a function SHALL take the acting account from the
verified session rather than from its arguments, SHALL establish the membership the
absent policy would have resolved to, and SHALL be the only route by which those rows
can be written. A policy SHALL NOT be widened to accommodate a case it cannot express.

No policy SHALL be written to permit unauthenticated access as a temporary measure.

#### Scenario: A new table is added

- **WHEN** a migration creates a table the applications will read
- **THEN** the same migration enables row-level security on it
- **AND** defines policies resolving to trip membership

#### Scenario: A client asks for rows from another trip

- **WHEN** a signed-in client issues a query for rows belonging to a trip it is not a
  member of
- **THEN** the database returns no rows
- **AND** the filtering happens in the database rather than in application code

#### Scenario: A request with no session

- **WHEN** a request carrying only the publishable key and no session reaches any table
- **THEN** it returns no rows

#### Scenario: A write that no membership can authorize

- **WHEN** a write must happen before the membership authorizing it exists
- **THEN** it is performed by a function running as its definer
- **AND** no insert policy is added to permit it directly

#### Scenario: A definer function is called without a session

- **WHEN** a request with no authenticated account calls such a function
- **THEN** it does not create anything
- **AND** it does not reveal whether any trip exists

### Requirement: A person can create a trip

Any signed-in person SHALL be able to create a trip, and SHALL become its first
member as part of creating it.

Creating a trip SHALL capture what the trip is called and what the creator is
called on it. The display name SHALL be supplied by the person rather than derived
from their email address, because a member list reading `cristian.ap84` is a name
nobody chose and there is no other moment at which they are asked.

The email recorded for the creator's membership SHALL be the address their identity
provider has verified for the account, never one supplied by the caller. This is the
same rule that governs claiming an invitation, for the same reason: the address is
what authorization resolves to.

A trip SHALL NOT be able to exist without at least one member. Creating the trip and
creating that first membership SHALL succeed or fail together.

Rationale for the last part: an insert policy on trips cannot resolve to membership
for a trip that has no members yet, and a client performing two writes leaves a
window in which the first has succeeded and the second has not — producing a trip
nobody can reach, delete, or see. Creation therefore goes through a single database
function rather than through a policy.

#### Scenario: A trip is created

- **WHEN** a signed-in person creates a trip with a name and a display name for themselves
- **THEN** the trip exists
- **AND** they are a member of it
- **AND** the trip appears in their list of trips without any further action

#### Scenario: The creator's membership carries their verified address

- **WHEN** a trip is created
- **THEN** the creator's membership records the address verified for their account
- **AND** not an address supplied with the request

#### Scenario: Creation fails part way

- **WHEN** creating a trip cannot complete
- **THEN** no trip is left without a member
- **AND** nothing partial is stored

#### Scenario: A person with no trips

- **WHEN** a signed-in person who belongs to no trip opens the application
- **THEN** they are offered a way to create one
- **AND** they are not left with nothing to do

#### Scenario: A person who already belongs to a trip

- **WHEN** a signed-in person who already belongs to a trip opens the application
- **THEN** they are offered a way to create another one
- **AND** it is reachable without first leaving the trip they are on

#### Scenario: A trip is created while another is open

- **WHEN** a person creates a trip while looking at a different one
- **THEN** the new trip is the one they are shown
- **AND** it appears among the trips they can choose between

### Requirement: A member can invite somebody to a trip by email

Any member of a trip SHALL be able to add another person to it by supplying a display
name and an email address. The invited person SHALL become a member immediately, with
no account attached, and SHALL be linked to their account on their next successful
authentication.

An invitation SHALL NOT require the invited person to already have an account, and
SHALL NOT require them to act on anything sent to them. Nothing is sent: the address
is the claim key, and being invited before or after signing up SHALL both work.

Two members of one trip SHALL NOT be able to hold the same email address.

#### Scenario: Somebody is invited before they sign up

- **WHEN** a member invites an address that no account uses
- **AND** a person later creates an account with that address
- **THEN** the trip appears to them without any further action

#### Scenario: Somebody is invited after they signed up

- **WHEN** a member invites an address that an existing account already uses
- **THEN** that person sees the trip on their next successful sign-in

#### Scenario: The same address is invited twice

- **WHEN** a member invites an address already on that trip
- **THEN** the invitation is refused
- **AND** the existing membership is unchanged

#### Scenario: A person who is not a member tries to invite

- **WHEN** an account that is not a member of a trip attempts to add a member to it
- **THEN** the write is refused by the database

### Requirement: A member who has no account yet is shown as not joined

Wherever a trip's members are listed, the system SHALL distinguish a member whose
account has linked from one whose has not, and SHALL show the address an unlinked
member was invited at.

Rationale: an invitation is delivered out of band and matched on an address, so a
mistyped address produces two screens that both look correct — the inviter sees the
name they typed, and the invited person sees an empty trip list they cannot explain.
Neither can diagnose it, and only the inviter can fix it. Showing which members have
not joined, and at what address, is the only signal that the mistake happened.

#### Scenario: A member has not signed in yet

- **WHEN** a trip's members are shown and one of them has no account linked
- **THEN** that member is marked as not joined yet
- **AND** the address they were invited at is shown

#### Scenario: A member signs in for the first time

- **WHEN** an invited person authenticates with the address they were invited at
- **THEN** they are no longer marked as not joined
- **AND** nothing attributed to them changes

### Requirement: A trip can be renamed by any member

Any member of a trip SHALL be able to change its name. Renaming SHALL NOT affect any
city, marker, membership, or recorded interest.

#### Scenario: A trip is renamed

- **WHEN** a member changes a trip's name
- **THEN** the new name is shown wherever that trip is named
- **AND** everything the trip contains is unchanged

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
