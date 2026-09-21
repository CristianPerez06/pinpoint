## ADDED Requirements

### Requirement: Every table the applications reach states who may reach it

Row-level security decides which rows of a table an account may see. It does not decide
whether the account may address the table at all: that is a separate permission, granted
per role. The two are a pair, and a table holding one without the other is wrong in one
of two directions — a table with policies and no permission is unreachable by everybody,
and a table with permission and no policies is readable in full by anybody holding the
publishable key.

Every table the applications read or write SHALL grant the authenticated role the
operations the product performs on it, and SHALL do so in the migration that creates the
table, beside that table's row-level security and its policies.

No table SHALL grant anything to the unauthenticated role. Nothing in this product is
readable without a session, and the schema SHALL state that absence rather than leave it
to be inferred from the policies.

These permissions SHALL NOT be established by a standing default that applies to objects
not yet created. What a table permits SHALL be legible in the migration that creates it,
because a default is a fact about the database that no file in the repository states, and
it silently makes a table whose migration omitted row-level security readable by every
account from the moment it exists.

A database built by replaying this repository's migrations against an empty database SHALL
be fully usable by both applications, with no permission applied by hand.

#### Scenario: A new table is added

- **WHEN** a migration creates a table the applications will read
- **THEN** the same migration grants the authenticated role the operations the product
  performs on that table
- **AND** grants the unauthenticated role nothing
- **AND** does so beside that table's row-level security and policies, in that same
  migration

#### Scenario: A database is built from the migrations alone

- **WHEN** every migration is replayed against an empty database, and no permission is
  applied by hand
- **THEN** a signed-in account can perform every read and write the applications perform
- **AND** neither application reports a permission failure

#### Scenario: An object is dropped and recreated

- **WHEN** a migration drops an object and creates it again
- **THEN** the same migration states that object's permissions again
- **AND** what a database built from the migrations permits is unchanged by the
  recreation

#### Scenario: The database already holds the permission

- **WHEN** a migration stating these permissions runs against a database where the
  authenticated role already holds them
- **THEN** it succeeds and changes nothing
- **AND** both applications behave identically before and after

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
- **THEN** it obtains no row of that table

#### Scenario: A write that no membership can authorize

- **WHEN** a write must happen before the membership authorizing it exists
- **THEN** it is performed by a function running as its definer
- **AND** no insert policy is added to permit it directly

#### Scenario: A definer function is called without a session

- **WHEN** a request with no authenticated account calls such a function
- **THEN** it does not create anything
- **AND** it does not reveal whether any trip exists
