## MODIFIED Requirements

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
