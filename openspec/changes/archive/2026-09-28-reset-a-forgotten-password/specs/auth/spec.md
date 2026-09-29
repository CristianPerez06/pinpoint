## ADDED Requirements

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
