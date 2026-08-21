## ADDED Requirements

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

## MODIFIED Requirements

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
