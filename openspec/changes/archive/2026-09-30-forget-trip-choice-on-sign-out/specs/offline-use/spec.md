## MODIFIED Requirements

### Requirement: Signing out removes what the phone kept about the person

Signing out SHALL remove every kept trip copy and every change still waiting to be sent from
the device. A downloaded map SHALL be kept, because it holds nothing about the person or the
trip beyond streets.

Signing out SHALL also forget which trip was being viewed. The next sign-in, with the same
account or another, SHALL open on that account's first trip.

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
