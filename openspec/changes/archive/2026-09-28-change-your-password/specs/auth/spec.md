## ADDED Requirements

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
