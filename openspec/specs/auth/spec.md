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

Account creation SHALL be offered by every application. Neither application SHALL be the
only place an account can be created, and a person SHALL be able to create an account and
go on to use the product without ever opening the other one.

Where an application offers both sign-in and account creation, each SHALL be reachable from
the other. An application that presents no system-provided way back SHALL provide its own.

An account SHALL be usable immediately after creation. The system SHALL NOT require the
person to confirm their email address before signing in, and SHALL NOT send any email as
part of account creation.

Rationale: account creation was restricted to the web application on the grounds that
accounts are created once, on a laptop, before a trip, and that the mobile application
exists to be used during one. The first half was never tested — somebody who installs the
phone application without an account is the case the premise assumed away, and they arrive
at a screen that tells them to find a laptop. The second half claimed a cost that is not
paid: the operation, its validation and its invitation claiming are shared already and take
a client as an argument, so a second application calling them adds no implementation. `marker-capture` reached the same conclusion for the same reasons and
stated the parity rule positively rather than leaving it as an absence; the same wording is
used here deliberately, so the two specifications say one thing.

The reachability sentence is not symmetry for its own sake. An application whose navigation
provides no back affordance can put somebody on a screen with no exit, and a sign-up screen
reached from sign-in is exactly where a person changes their mind.

Nothing below states the negative, and that is deliberate. The rule this replaces was
accompanied by a scenario asserting that no control creating an account exists on the phone,
and the concern underneath it — that the phone stays simple — is an argument about where
people are rather than a property anything can check. Simplicity is a matter for the screens.
A specification that forbids a capability on one platform ends up describing the platform
instead of the product.

#### Scenario: A visitor creates an account

- **WHEN** a visitor without a session submits the sign-up form on either application with
  a valid email and a password meeting the password rules
- **THEN** an account is created
- **AND** no email is sent
- **AND** the person is signed in, without any further step

#### Scenario: The email is already registered

- **WHEN** a visitor submits sign-up with an email that already has an account
- **THEN** the form reports the failure
- **AND** no second account is created

#### Scenario: Sign-in and sign-up reach each other

- **WHEN** a person without a session is on the sign-in screen of either application
- **THEN** a visible control takes them to account creation
- **AND** from there a visible control takes them back to sign-in

#### Scenario: An invitation is claimed by an account created on any application

- **WHEN** a person is invited at an address, and then creates an account at that address
  on any application
- **THEN** the memberships waiting for that address are claimed
- **AND** the trip they were invited to is present the first time they look

#### Scenario: One application is never opened

- **WHEN** a person creates an account on one application and uses only that application
- **THEN** no step of account creation required the other one

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

On the phone, the session SHALL be refreshed only while the application is in the front.
When the application comes back to the front, the session SHALL be refreshed at once if
it has expired or is about to, before anything the person sees depends on it. A refresh
that cannot reach the authentication service SHALL NOT end the session; it SHALL be tried
again while the application stays in the front.

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

#### Scenario: Coming back to the phone after more than an hour

- **WHEN** a signed-in person sends the phone application to the background
- **AND** brings it back to the front more than an hour later
- **THEN** they are still signed in
- **AND** the trip they were on loads without an error

#### Scenario: Coming back to the phone with no signal

- **WHEN** a signed-in person brings the phone application back to the front after its
  session has expired
- **AND** there is no connection
- **THEN** they are still signed in
- **AND** the session is refreshed once the connection returns, with nothing pressed

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

### Requirement: A person who forgot their password resets it with an emailed code

The system SHALL allow a person without a session to set a new password for their account
by proving they can read its email. Every application SHALL offer this, reachable from its
sign-in screen by a visible control, and SHALL provide a visible way back to sign-in from
each step.

The control SHALL be offered only where the authentication service can deliver the code
to any address. Where it cannot, the control SHALL NOT be shown, since a reset that
cannot finish is worse than none. Rationale: the hosted project uses the service's
built-in email until a real provider is connected (#78). That email reaches only the
project's own team, and a new free project cannot put a code in it at all.

The proof SHALL be a numeric code sent to the address, which the person types into the
application where they asked for it. The email SHALL NOT carry a link that has to be
opened, so that the flow needs nothing the application is not already doing and works
whether or not the email is read on the same device.

Asking for a code SHALL look the same whether or not an account exists for the address:
the same next screen, and no message that differs. This is the reset's form of the rule
that sign-in does not reveal whether an email exists, and it holds for the same reason.

A wrong, expired or already-used code SHALL be reported as such, without saying which of
the three it was. The person SHALL be able to ask for another code from the same screen
once a fixed wait has passed since the last one was sent, and the control SHALL say how
long remains while it waits.

Entering the right code SHALL count as authenticating: it SHALL claim any membership
waiting for the address, as every other successful authentication does. Rationale: a
verified code establishes a session, and a person who stops at that point is signed in.
If they were invited while locked out, claiming only at the next password sign-in would
show them an empty trip list in the meantime.

The new password SHALL be validated against the same rules as at account creation, typed
twice, and reported per field with the same wording, before any network call. On success
the system SHALL end the session and take the person to sign-in, where a note says the
password was updated. The old password SHALL no longer sign in.

The screen for choosing a new password SHALL be reachable only through a session
established by entering a code. A person without a session, or with one established by
signing in with a password, SHALL be shown a screen saying the reset has to be started
again, with a control that starts it. Rationale: the screen changes a password without
asking for the current one. A session from an ordinary sign-in is exactly the case where
that is wrong, and it is the change-while-signed-in flow (#49) that serves it.

The screens for asking for a code and for entering it SHALL redirect a person who already
has a session to the signed-in area, as sign-in and sign-up do. Entering the right code
itself SHALL NOT trigger that redirect: it SHALL lead to the new-password screen.

Every step's submit control SHALL say what it is doing while it works and SHALL NOT accept
a second press until the first has finished.

#### Scenario: The way in from sign-in

- **WHEN** a person without a session is on the sign-in screen of either application,
  where the code can be delivered
- **THEN** a visible control takes them to a screen asking for their email address
- **AND** from there a visible control takes them back to sign-in

#### Scenario: Where the code cannot be delivered

- **WHEN** an application runs against an authentication service that cannot deliver the
  code to any address
- **THEN** its sign-in screen shows no control for resetting a password

#### Scenario: Asking for a code for a registered address

- **WHEN** a person submits the address of an existing account
- **THEN** an email containing a numeric code is sent to that address
- **AND** they are shown the screen for entering the code, naming the address it was sent to

#### Scenario: Asking for a code for an unknown address

- **WHEN** a person submits a validly formed address that has no account
- **THEN** they are shown the same screen for entering the code, with the same wording
- **AND** nothing on either screen differs from the registered case

#### Scenario: A malformed address

- **WHEN** a person submits something that is not an email address
- **THEN** the form reports the failure against the email field
- **AND** no request reaches the authentication service

#### Scenario: A wrong or expired code

- **WHEN** a person enters a code that is wrong, expired or already used
- **THEN** the form says the code is not valid
- **AND** no session is established
- **AND** they stay on the same screen

#### Scenario: Sending the code again

- **WHEN** a person on the code screen waits until the control to send another code is
  available, and presses it
- **THEN** a new code is sent to the same address
- **AND** the control is unavailable again, and says how long remains, until the wait has
  passed once more

#### Scenario: The right code

- **WHEN** a person enters the code most recently sent to their address
- **THEN** a session is established
- **AND** any membership waiting for the address is claimed
- **AND** they are shown the screen for choosing a new password, not the signed-in area

#### Scenario: A new password that breaks the rules

- **WHEN** a person on the new-password screen submits a password that account creation
  would refuse, or two entries that differ
- **THEN** the form reports each failure against its field, in the words sign-up uses
- **AND** no request reaches the authentication service

#### Scenario: Saving the new password

- **WHEN** a person on the new-password screen submits a valid password twice
- **THEN** the account's password is changed
- **AND** the session ends
- **AND** they are shown sign-in with a note that the password was updated

#### Scenario: The passwords after a reset

- **WHEN** a person has reset their password on either application
- **THEN** signing in on either application with the new password succeeds
- **AND** signing in with the old password is refused as wrong credentials

#### Scenario: The new-password screen without a session

- **WHEN** a person reaches the new-password screen with no session
- **THEN** no form for a new password is shown
- **AND** the screen says the reset has to be started again
- **AND** a control on it takes them to the screen asking for their email address

#### Scenario: The new-password screen after a password sign-in

- **WHEN** a person reaches the new-password screen with a session established by signing
  in with a password
- **THEN** no form for a new password is shown
- **AND** the screen says the reset has to be started again
- **AND** following its control leaves them in the signed-in area, because a person with a
  session is redirected away from the screen asking for an email

#### Scenario: A signed-in person asks for a code

- **WHEN** a person with a session navigates to the screen asking for an email address,
  or the screen for entering a code
- **THEN** they are redirected to the signed-in area

#### Scenario: One submission at a time

- **WHEN** a person presses any step's submit control
- **THEN** the control says what it is doing until the step has finished
- **AND** pressing it again meanwhile does nothing

### Requirement: A signed-in person changes their password

The system SHALL allow a signed-in person to change their password from the account part of
settings, on every application.

The person SHALL supply their current password along with the new one, typed twice. The
system SHALL check the current password with the authentication service before changing
anything. Rationale: the service changes a password for any session without asking for the
old one, so without this check anybody holding an unlocked phone or a borrowed laptop could
lock the owner out.

A wrong current password SHALL be reported against the current-password field. A new
password SHALL be validated against the same rules and wording as account creation, before
any network call, and a mismatched repeat SHALL be reported against the repeat field, so that
each of the three failures says which one it was. None of them SHALL change the password.

On success, the system SHALL keep the person signed in on the device they are using, SHALL
end every other session of the account, and SHALL say both. The new password SHALL sign in on
every application, and the old one SHALL NOT.

The control SHALL be offered only where a forgotten password can be reset. Rationale: a
person who changes their password and then forgets it needs the reset to get back in. Where
the reset is not offered, a change is a way to lock oneself out for good.

The submit control SHALL say what it is doing while it works and SHALL NOT accept a second
press until the first has finished.

#### Scenario: Changing the password

- **WHEN** a signed-in person enters their current password and a valid new password twice,
  and saves
- **THEN** the password is changed
- **AND** they are still signed in on this device
- **AND** they are told that the other devices were signed out

#### Scenario: A wrong current password

- **WHEN** a signed-in person saves with a current password that is not theirs
- **THEN** the current-password field says it is not the current password
- **AND** the password is not changed

#### Scenario: A new password that breaks the rules

- **WHEN** a signed-in person saves a new password that account creation would refuse, or a
  repeat that differs
- **THEN** the form reports each failure against its field, in the words sign-up uses
- **AND** no request reaches the authentication service

#### Scenario: The other devices

- **WHEN** a person changes their password while also signed in on another device
- **THEN** the other device's session ends
- **AND** the device they changed it on stays signed in

#### Scenario: The passwords after a change

- **WHEN** a person has changed their password on either application
- **THEN** signing in on either application with the new password succeeds
- **AND** signing in with the old password is refused as wrong credentials

#### Scenario: Where a forgotten password cannot be reset

- **WHEN** an application runs where sign-in offers no way to reset a forgotten password
- **THEN** its settings offer no way to change the password either

### Requirement: The phone notices a session ended from another device

The phone application SHALL ask the authentication service whether its session still
stands when the application is opened, when it comes back to the front from the
background, and every 5 minutes while it is in the front.

When the service answers that the session no longer exists, the phone SHALL end its session
and show sign-in, as if the person had signed out on it. A session ended from another
device SHALL therefore reach sign-in on the phone within 5 minutes while the application is
open, and at once the next time it is opened.

Any other outcome SHALL leave the person signed in: no connection, a request that times
out, or an answer from the service that does not say the session is gone. The phone SHALL
NOT sign anybody out because it could not ask.

Rationale: changing a password ends every other session and says so (*A signed-in person
changes their password*). The laptop asks the server on every page and notices at once. The
phone kept working until its access pass expired, up to an hour, so the statement was false
there for that long — and a password is often changed because a phone was lost or borrowed.
Five minutes is short enough that the statement is close to true, and one small request
every five minutes costs nothing noticeable in battery or data.

#### Scenario: Opening the phone after the password was changed elsewhere

- **WHEN** the phone application is in the background
- **AND** the person changes their password on another device
- **AND** the phone application is brought back to the front
- **THEN** the phone shows sign-in

#### Scenario: The phone is open when the password is changed elsewhere

- **WHEN** the phone application is open on a trip
- **AND** the person changes their password on another device
- **THEN** the phone shows sign-in within 5 minutes, with nothing pressed

#### Scenario: Opening the phone with no signal

- **WHEN** the phone application is opened with no connection
- **THEN** the person is still signed in
- **AND** the trip opens from its kept copy

#### Scenario: A session that still stands

- **WHEN** the phone asks and the session still stands
- **THEN** nothing on screen changes
