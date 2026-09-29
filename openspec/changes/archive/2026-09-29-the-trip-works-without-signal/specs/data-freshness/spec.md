## MODIFIED Requirements

### Requirement: One place holds each list, and everything on screen reads it

For each list a screen shows, the application SHALL hold it in exactly one place. Every
control that displays any part of that list SHALL read it from there.

A write SHALL put the row the database returned into that one place. A re-read SHALL
replace what is there. An application SHALL NOT keep a second copy of a list, nor a
separate record of local changes to be combined with it at render time.

Where the database carries a write on to rows the write did not return — removing a city
unassigns every marker filed under it — the application SHALL read those rows again
afterwards, on every such write, whatever else they hold. It MAY show the expected
result straight away, and the re-read SHALL then replace it. The re-read SHALL go ahead
however recently the list was last read, because the write did not count as a read.

On the phone, the copy of a trip kept for use without a signal (`offline-use`) SHALL NOT
count as a second copy under this requirement. It SHALL only ever be read to fill the one
place when nothing has been read into it yet — at launch, or when a trip is opened — and a
read SHALL replace it there as it replaces anything else. It SHALL be written from the one
place, never edited on its own, so that what is kept is always something that was on
screen. Likewise a tap made without a signal (`offline-use`) SHALL be put into the one place
when it is made, as any write's result is. The record of taps still to be sent SHALL only
be used to send them, and SHALL NOT be combined with the list at render time.

Rationale: two copies of one list is how a rename ends up correct in the header and stale
in the picker — which is the defect that started this — and combining them at render time
is a merge somebody has to get right in every place it is written. One place cannot
disagree with itself.

Rationale for rows carried on: a row the database changed is changed in full, including
the moment it was last changed, which is what a later save of that row is checked
against. A screen that only writes in the part it expected to change still holds the old
moment. The next save of that marker was then refused as changed by somebody else, when
nobody had touched it (#188).

Rationale for the offline copy: what this requirement forbids is two lists that can
disagree while both are on screen. A copy that only fills the one place before the first
read, and is only ever written from it, never sits beside it, so it cannot disagree with
anything that is shown.

#### Scenario: Something is changed on this device

- **WHEN** a person changes a trip, a marker, a city, a member, or their interest
- **THEN** every place on screen showing that thing shows the change
- **AND** no part of the screen goes on showing the previous value

#### Scenario: A re-read arrives

- **WHEN** a list is read again
- **THEN** what is held is replaced by what was read

#### Scenario: A place is edited straight after its city is removed

- **WHEN** a person removes a city holding a marker, then without reloading opens that
  marker, changes its name and saves
- **THEN** the save goes through
- **AND** it is not refused as changed by somebody else

#### Scenario: A city with no places is removed

- **WHEN** a person removes a city that holds no markers
- **THEN** the markers are not read again on its account

#### Scenario: The kept copy is replaced by the first read

- **WHEN** the phone opens a trip from its kept copy and the first read of that trip then
  succeeds
- **THEN** what is shown is what was read
- **AND** nothing from the kept copy remains on screen

#### Scenario: A tap made offline is on screen at once

- **WHEN** a person marks a place visited with no signal
- **THEN** every place on screen showing that place shows it visited
