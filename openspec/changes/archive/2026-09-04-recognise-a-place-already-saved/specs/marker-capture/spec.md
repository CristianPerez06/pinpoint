## MODIFIED Requirements

### Requirement: A place can be added by searching or by pointing at the map

The system SHALL provide two ways to begin adding a place: choosing a candidate
returned by place search, and indicating a position on the map. Both SHALL produce
the same unsaved position, and both SHALL lead to the same form.

Choosing a candidate SHALL begin a capture only when the current trip does not already
hold a marker at that candidate's position. Where it does, the marker already saved SHALL
be opened instead and no unsaved position SHALL be taken — see `place-search`, which
defines when a candidate counts as already saved. This narrows when the search path
produces an unsaved position; it does not change what happens once one is produced.

How a position is indicated SHALL follow the shape of the screen rather than the
platform. A pointer-driven screen indicates a coordinate directly. A screen
operated by touch MAY instead offer a fixed sight that the map is framed under,
where the position indicated is the one under the sight when the person confirms.
Both SHALL satisfy this requirement, and neither SHALL be described as a fallback
for the other.

Indicating a position SHALL require the person to arm that mode deliberately
beforehand. Panning, zooming, and selecting an existing marker SHALL never create
anything. This SHALL hold however the position is indicated: a sight that is armed
is armed, and a map being framed while nothing is armed SHALL create nothing.

Pointing SHALL always begin a capture. A position indicated on the map SHALL NOT be
matched against saved markers, because there is nothing to match: a person pointing at a
spot has stated the position themselves, and a place they meant to add beside one they
already saved is an ordinary thing to want.

Where a fixed sight is used, it SHALL be positioned at the centre of the map as
drawn rather than at the centre of the screen, so that the position taken is the
one the sight appears over.

Pointing is not a fallback for search failing. Places that are small, new, or
known locally by a name the map data does not carry are frequently unfindable by
name, so for some kinds of place — food especially — pointing is expected to be
the ordinary path.

#### Scenario: A candidate is chosen from search

- **WHEN** a person chooses a candidate returned by search
- **AND** no marker on the current trip holds that candidate's position
- **THEN** an unsaved position is taken at that candidate's position
- **AND** the form opens with the candidate's name already filled in

#### Scenario: A candidate the trip has already saved is chosen

- **WHEN** a person chooses a candidate whose position a marker on this trip already holds
- **THEN** no unsaved position is taken
- **AND** the saved marker is opened instead of the form

#### Scenario: A position is chosen on the map

- **WHEN** a person arms the drop mode and points at a position
- **THEN** an unsaved position is taken there
- **AND** the form opens with no name filled in

#### Scenario: A position is pointed at where a marker already sits

- **WHEN** a person arms the drop mode and points at a position a marker already holds
- **THEN** an unsaved position is taken there
- **AND** the form opens, as it does for any other pointed position

#### Scenario: A position is chosen by framing it under a sight

- **WHEN** a person arms the drop mode, frames the map under the sight, and confirms
- **THEN** an unsaved position is taken at the point under the sight
- **AND** the form opens with no name filled in

#### Scenario: The sight is centred on the map, not the screen

- **WHEN** a fixed sight is offered on a screen where chrome occupies part of the height
- **THEN** the position taken is the one the sight is drawn over
- **AND** it is not offset by the chrome above or below the map

#### Scenario: The map is used without arming the drop mode

- **WHEN** a person pans, zooms, or selects an existing marker without arming
- **THEN** no unsaved position is created

#### Scenario: The drop mode is armed and then abandoned

- **WHEN** a person arms the drop mode and then cancels it
- **THEN** no marker is created
- **AND** the map returns to its ordinary behaviour
