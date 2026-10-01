## MODIFIED Requirements

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
