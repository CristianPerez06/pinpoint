## MODIFIED Requirements

### Requirement: Signing out removes what the phone kept about the person

Signing out SHALL remove every kept trip copy and every change still waiting to be sent from
the device. A downloaded map SHALL be kept, because it holds nothing about the person or the
trip beyond streets.

Signing out SHALL also forget which trip was being viewed. The next sign-in, with the same
account or another, SHALL open on that account's first trip.

A session ended from another device, or refused by the authentication service for any other
reason it states, SHALL count as signing out here, and remove the same things. Losing the
connection SHALL NOT: a phone that cannot reach the service keeps everything.

Rationale: a password is often changed because a phone was lost or borrowed. A phone cut off
that way which still opens every trip from its kept copy has only been signed out on paper.
The cost is that a change made with no signal and not yet sent is lost when the session is
ended elsewhere before the phone could send it — rare, and decided as the lesser harm.

#### Scenario: Signing out

- **WHEN** a person signs out on the phone
- **THEN** no trip can be opened from a kept copy
- **AND** no waiting change is sent later on anyone's behalf

#### Scenario: Signing out with a downloaded map

- **WHEN** a person with a downloaded map signs out and signs back in
- **THEN** the map of those areas still draws with no signal

#### Scenario: Signing back in after choosing a trip

- **WHEN** a person viewing a trip other than their first signs out and signs back in
- **THEN** the phone opens on their first trip

#### Scenario: Another account signs in on a trip both share

- **WHEN** a person viewing a trip other than their first signs out
- **AND** a second account that also belongs to that trip signs in
- **THEN** the phone opens on the second account's first trip

#### Scenario: Signed out from another device

- **WHEN** the phone finds that its session was ended from another device
- **THEN** no trip can be opened from a kept copy
- **AND** no waiting change is sent later on anyone's behalf
- **AND** the next sign-in opens on that account's first trip

#### Scenario: No signal is not a sign-out

- **WHEN** the phone cannot reach the authentication service
- **THEN** every kept trip copy and every waiting change is still on the device
