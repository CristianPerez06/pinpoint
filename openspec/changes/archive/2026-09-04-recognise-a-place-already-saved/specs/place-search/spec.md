## ADDED Requirements

### Requirement: A candidate already saved on this trip is recognised rather than offered again

When a person chooses a candidate whose position is already held by a marker on the
current trip, the system SHALL open that marker rather than beginning a new capture. No
second marker for the same place SHALL be offered or created.

A candidate SHALL match a saved marker when their positions are **equal**. Equality is
exact, and no tolerance SHALL be applied.

Rationale: a marker saved from search stores the position the geocoder gave, so searching
the same place again returns the same numbers and exact equality recognises it. A
tolerance would catch two further cases — a marker repositioned after saving, and one
added by pointing at the map — at the cost of matching a *different* place a few metres
away, and the distance between two premises on one street is the same distance a pin gets
corrected by. There is no radius that separates them. The two failures are not comparable:
offering a duplicate is visible and undone in one press, while silently refusing to save a
place somebody meant to save is neither.

A marker whose position was corrected after it was saved, and a marker added by pointing
at the map, therefore SHALL NOT match a candidate at the geocoder's position. This is a
stated limit rather than an omission — those cases behave as they did before this
requirement existed.

Matching SHALL consider **every marker on the current trip**, whatever city it is filed
under and whether or not the current filter is showing it. A filter decides what is drawn
and SHALL NOT decide what counts as already saved, or a narrowed view would be able to
produce the duplicate this requirement exists to prevent.

Matching SHALL be scoped to the current trip. A marker on another trip SHALL NOT match,
and the candidate SHALL be offered as new here.

Recognition SHALL change only where choosing a candidate leads. It SHALL NOT withhold a
candidate, mark it, reorder it, or otherwise change what search returns — a person is
entitled to search a place they have already saved, and to be shown it in its ranked
position like any other result.

The camera SHALL behave the same way whether or not the candidate matched. A person who
chooses a place expects the map to go there in both cases, and moving the map only for
places that turn out to be new would make the trip's own contents the reason the map
behaves differently.

Where a candidate's position is held by more than one marker — which the geocoder makes
ordinary by answering with a building's centre — every marker at that position SHALL be
offered, and the person SHALL choose between them. One SHALL NOT be selected on their
behalf.

#### Scenario: Searching a place the trip already holds

- **WHEN** a person chooses a candidate whose position a marker on this trip already holds
- **THEN** that marker is opened
- **AND** no unsaved position is taken and no second marker is offered

#### Scenario: The map still goes there

- **WHEN** a chosen candidate matches a marker already on the trip
- **THEN** the map moves to it exactly as it does for a candidate that matches nothing

#### Scenario: A place saved on another trip

- **WHEN** a person chooses a candidate that is saved as a marker on a different trip
- **AND** no marker on the current trip holds that position
- **THEN** it is offered as a new place on this trip

#### Scenario: A place saved nowhere

- **WHEN** a person chooses a candidate no marker on this trip holds the position of
- **THEN** an unsaved position is taken and the form opens, unchanged

#### Scenario: A different venue a few metres away

- **WHEN** a candidate's position is close to a saved marker's but not equal to it
- **THEN** it is treated as a different place
- **AND** it is offered as new

#### Scenario: A marker filed under another city

- **WHEN** a chosen candidate matches a marker filed under a city other than the one
  currently selected
- **THEN** it is recognised as already saved
- **AND** the marker is opened

#### Scenario: A marker the current filter is hiding

- **WHEN** a chosen candidate matches a marker the current filter is not showing
- **THEN** it is recognised as already saved
- **AND** no second marker is offered

#### Scenario: Several places share the matched position

- **WHEN** a chosen candidate's position is held by more than one marker on the trip
- **THEN** all of them are offered
- **AND** the person chooses which one to open

#### Scenario: A recognised candidate is still an ordinary result

- **WHEN** a query returns a candidate the trip has already saved
- **THEN** it appears among the candidates in its ranked position
- **AND** it is neither withheld nor reordered for having been saved
