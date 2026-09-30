## ADDED Requirements

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
