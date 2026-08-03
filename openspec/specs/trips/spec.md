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
