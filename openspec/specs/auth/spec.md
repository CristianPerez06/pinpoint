# auth Specification

## Purpose

Define how a person proves who they are: creating an account with an email and a
password, signing in, staying signed in across app restarts, signing out, and being kept
out of screens that require a session. Covers both applications, and the boundary
between the parts of that flow which are shared and the parts which are necessarily
per-platform.

## Requirements

### Requirement: A person creates an account with an email and a password

The system SHALL allow a visitor without a session to create an account by supplying an
email address and a password.

Account creation SHALL be available on the web application only. The mobile application
SHALL NOT offer account creation — accounts are created once, and the mobile application
exists to be used during a trip rather than to onboard.

An account SHALL be usable immediately after creation. The system SHALL NOT require the
person to confirm their email address before signing in, and SHALL NOT send any email as
part of account creation.

#### Scenario: A visitor creates an account

- **WHEN** a visitor without a session submits the sign-up form on web with a valid email
  and a password meeting the password rules
- **THEN** an account is created
- **AND** no email is sent
- **AND** the person can sign in immediately without any further step

#### Scenario: The email is already registered

- **WHEN** a visitor submits sign-up with an email that already has an account
- **THEN** the form reports the failure
- **AND** no second account is created

#### Scenario: The mobile application offers no sign-up

- **WHEN** a person opens the mobile application without a session
- **THEN** they are offered sign-in only
- **AND** there is no route or control that creates an account

### Requirement: Input is validated before any network call

The system SHALL validate email and password input against a shared schema before
contacting the authentication service. When validation fails the system SHALL report the
failure per field and SHALL NOT issue a network request.

The validation schema SHALL be defined once and consumed by both applications, so that a
password accepted on one platform is accepted on the other.

#### Scenario: A password that is too short

- **WHEN** a person submits sign-up with a password shorter than the minimum
- **THEN** the form reports the failure against the password field
- **AND** no request reaches the authentication service

#### Scenario: The two applications agree on what is valid

- **WHEN** the same email and password are submitted on web and on mobile
- **THEN** both accept it, or both reject it with the same field errors

### Requirement: A person signs in and stays signed in

The system SHALL allow a person with an account to sign in with their email and
password, establishing a session.

The session SHALL survive a page reload on web and an application restart on mobile, and
SHALL be refreshed before it expires without the calling code requesting it.

Session storage SHALL be supplied by each application rather than chosen by a shared
package: the web application persists the session in cookies so that server-rendered
code can read it, and the mobile application persists it in the platform's secure
storage.

#### Scenario: Signing in on web

- **WHEN** a person submits valid credentials on web
- **THEN** a session is established
- **AND** they are taken to the signed-in area of the application

#### Scenario: The session survives a restart

- **WHEN** a signed-in person reloads the web page, or closes and reopens the mobile
  application
- **THEN** they are still signed in
- **AND** they are not asked for credentials again

#### Scenario: Wrong credentials

- **WHEN** a person submits an email and password that do not match an account
- **THEN** the form reports the failure
- **AND** no session is established
- **AND** the message does not reveal whether the email exists

### Requirement: A person signs out

The system SHALL offer a signed-in person a way to end their session, on both
applications. After signing out the stored session SHALL be cleared, and returning to a
protected screen SHALL require signing in again.

#### Scenario: Signing out clears the stored session

- **WHEN** a signed-in person signs out
- **THEN** the session is removed from cookie storage on web, or secure storage on mobile
- **AND** navigating to a protected screen sends them to sign-in

### Requirement: Screens are protected by session state

The system SHALL redirect a person without a valid session away from any screen that
shows trip data, sending them to sign-in.

The system SHALL redirect a person who already has a valid session away from the sign-in
and sign-up screens, sending them to the signed-in area.

On web this check SHALL run before the protected screen renders, so that no trip data is
sent to a client that is not entitled to it.

#### Scenario: Reaching a protected screen without a session

- **WHEN** a person without a session navigates directly to a protected URL on web
- **THEN** they are redirected to sign-in
- **AND** the protected screen's data is never rendered or sent

#### Scenario: Reaching sign-in with a session

- **WHEN** a signed-in person navigates to the sign-in screen
- **THEN** they are redirected to the signed-in area

### Requirement: Authentication failures are identified by code, not by message

The system SHALL map an authentication failure to a stable internal identifier derived
from the service's error code, and SHALL derive the displayed message from that
identifier.

Displayed text SHALL NOT be the raw message returned by the authentication service, and
control flow SHALL NOT branch on matching that message's text. An unrecognised code
SHALL map to a generic failure rather than surfacing the raw message.

#### Scenario: A recognised failure

- **WHEN** the authentication service rejects a sign-in with a known error code
- **THEN** the system resolves that code to its own identifier
- **AND** displays the message the application owns for that identifier

#### Scenario: An unrecognised failure

- **WHEN** the authentication service returns an error code the mapping does not know
- **THEN** the system displays its generic failure message
- **AND** the raw service message is not shown to the person

### Requirement: Authentication operations are shared, not duplicated per platform

Validating credentials, calling the authentication service, and interpreting the result
SHALL live in a shared package under `packages/`, consumed by both applications.

That package SHALL receive an already-constructed client as an argument rather than
constructing one, so that it stays free of cookie APIs, secure storage modules, and
anything else that resolves on only one platform.

Each application SHALL be responsible only for collecting input, supplying its client,
and rendering the outcome.

#### Scenario: A change to sign-in behaviour

- **WHEN** the rules for interpreting a sign-in result change
- **THEN** the change is made once in the shared package
- **AND** both applications get it without either being edited

#### Scenario: The shared package stays portable

- **WHEN** the shared authentication package is inspected for imports
- **THEN** it imports no cookie API, no secure-storage module, and nothing else specific
  to one platform
- **AND** it resolves and type-checks under both applications' builds

### Requirement: Authenticating claims any membership waiting for that address

A person is invited to a trip by a member record carrying their email address and no
account. When a person authenticates, the system SHALL link their account to every such
record matching their address, and SHALL do so on **every** successful authentication
rather than only at account creation.

Rationale: being invited after signing up is ordinary, and it is the case that breaks if
claiming happens only at sign-up. The invitation would then be unclaimable by any action
available in the product, and the person would see an empty trip list — which is
indistinguishable from having been invited to nothing.

The address matched SHALL be the one the identity provider has verified for the account,
never one supplied by the caller, because the match is the whole authorization: it is
what makes claiming somebody else's invitation impossible.

Claiming SHALL only affect member records that no account has claimed, so that
authenticating repeatedly is safe and a claimed membership cannot be taken over.

Claiming nothing SHALL be an ordinary outcome and SHALL NOT fail the authentication. A
person with no invitation waiting is not in an error state.

#### Scenario: Invited, then signs up

- **WHEN** a member record exists for an address and a person then creates an account
  with that address
- **THEN** the account is linked to that member record
- **AND** the trip appears to them without any further action

#### Scenario: Signs up, then invited

- **WHEN** a person creates an account, and a member record for their address is created
  afterwards
- **THEN** their next successful sign-in links the account to that record
- **AND** the trip appears to them without any further action

#### Scenario: Authenticating again

- **WHEN** a person who has already claimed their membership signs in again
- **THEN** nothing about their membership changes
- **AND** the repeated claim is not an error

#### Scenario: Nothing is waiting

- **WHEN** a person authenticates and no member record exists for their address
- **THEN** the authentication succeeds
- **AND** they are shown that they are on no trips, which is not presented as a failure

#### Scenario: A membership already belongs to somebody

- **WHEN** a member record has already been claimed by one account
- **AND** another account authenticates with an address matching that record
- **THEN** the existing link is left intact
