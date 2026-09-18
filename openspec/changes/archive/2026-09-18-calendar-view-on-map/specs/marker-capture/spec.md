## MODIFIED Requirements

### Requirement: A marker can be edited and removed by any member of the trip

Any member of a trip SHALL be able to edit and to remove any of that trip's
markers, reached from the surface that shows what was recorded about it. Editing
SHALL offer the same fields as creating, filled in with what is stored.

Removing SHALL require an explicit confirmation, and the person SHALL be told
that it cannot be undone, because it cannot.

Concurrent edits are governed by "A save based on a stale read is refused" below.

Where the edit was reached from the map, saving it SHALL close the place's details and
leave the map unobstructed, in both applications. The saved place is on the map where it
was, and opening it again shows what was just saved. The two applications SHALL NOT differ
here: an edit saved on the laptop and the same edit saved on the phone end in the same
state.

Rationale: the laptop has always closed the card on saving and the phone has always
brought the sheet back, and nothing written down said which was intended — so a rule that
depends on whether the details are still open after an edit (the calendar's way back from
the map) behaved differently on each. Closing is the one chosen: the edit is confirmed by
the save itself, and the map is what the person was using before they opened the place.

#### Scenario: Editing a marker

- **WHEN** a person edits a marker
- **THEN** they are offered the same fields as when it was created
- **AND** each is filled in with what is currently stored

#### Scenario: An edit saved from the map

- **WHEN** a person edits a place from its details on the map and saves
- **THEN** the details close and the map is unobstructed
- **AND** this is so on both applications

#### Scenario: Removing a marker

- **WHEN** a person asks to remove a marker
- **THEN** they are asked to confirm
- **AND** they are told the removal cannot be undone

#### Scenario: A removal is confirmed

- **WHEN** a person confirms a removal
- **THEN** the marker no longer appears on the map
- **AND** it is no longer among the trip's markers

#### Scenario: Two members edit the same marker

- **WHEN** two members save edits to the same marker
- **THEN** the save based on the older read is refused rather than applied
- **AND** what that member typed is preserved

Note: this scenario previously asserted the opposite — that neither save is
rejected and the later write wins. That was superseded by "A save based on a stale
read is refused" below and left behind, so the two requirements contradicted each
other. It is corrected here to agree.
