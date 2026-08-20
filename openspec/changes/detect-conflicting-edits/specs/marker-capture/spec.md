## ADDED Requirements

### Requirement: A marker records when it was last changed

Every marker SHALL carry the time it was last modified, and that value SHALL be maintained
where the data is stored rather than supplied by whoever writes.

Rationale: a value a caller supplies is a value a caller can forget, reuse or fabricate,
and the guarantee below is only worth having if it holds for every writer rather than for
the ones that remembered. It is the same reasoning that puts row-level security in the
database rather than in the interface.

#### Scenario: A marker is changed

- **WHEN** any field of a marker is modified
- **THEN** its last-changed time is updated
- **AND** the writer does not have to supply it

#### Scenario: A marker is read

- **WHEN** a marker is read
- **THEN** its last-changed time is part of what is returned

### Requirement: A save based on a stale read is refused

A request to modify a marker SHALL state the last-changed time the edit was based on. If
the marker has been modified since, the system SHALL refuse the write and SHALL NOT apply
any part of it.

The refusal SHALL be reported distinctly from a validation failure and from a permission
refusal, because the three call for different things from the person: correct what you
typed, you may not do this, and somebody else changed this while you were working.

What was entered SHALL be preserved when a save is refused this way. The person has typed
something they still want, and losing it would make the safeguard more expensive than the
problem it prevents.

The system SHALL NOT merge the two versions, and SHALL NOT choose between them. Which
version is right is a question about a trip, and answering it automatically would replace
a visible disagreement with an invisible one.

Rationale: two people editing the same place at once is ordinary for a product built for
travellers planning together. Without this, the later save wins silently — the person
whose work vanished never learns, and the person who overwrote it never knows they did.

#### Scenario: Two members edit the same marker

- **WHEN** two members read the same marker, and one saves a change
- **AND** the other then saves a change based on what they read before
- **THEN** the second save is refused
- **AND** the first member's change remains

#### Scenario: A refused save keeps what was typed

- **WHEN** a save is refused because the marker changed underneath it
- **THEN** the person is told that somebody else changed the place
- **AND** what they entered is still there

#### Scenario: An ordinary edit is unaffected

- **WHEN** a member saves a change to a marker nobody else has touched since they read it
- **THEN** the save is applied

#### Scenario: A conflict is not a validation error

- **WHEN** a save is refused because the marker changed underneath it
- **THEN** the report distinguishes it from a field being invalid
- **AND** from the write being refused by policy
