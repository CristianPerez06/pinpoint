## MODIFIED Requirements

### Requirement: The map opens framing the trip's markers

On opening, the map SHALL position itself to show every marker of the current trip,
using the shared framing logic and the actual size of the surface it is drawn into.

When the trip has no markers, the map SHALL open at the shared default position rather
than failing or showing an undefined region.

When the trip has exactly one marker, the map SHALL centre on it at a zoom level that
shows its surroundings rather than at maximum zoom.

The map SHALL re-frame when, and only when, the person asks it to. Selecting a city is
such a request, and SHALL frame that city's markers using the same shared logic.
Selecting a city that holds no markers SHALL leave the view where it is, because there
is nothing to frame and moving to an arbitrary position would be worse than not moving.

Nothing else SHALL move the camera. Panning or zooming SHALL NOT be overridden by
re-framing, and markers arriving, changing, or being added SHALL NOT re-frame — the
distinction being drawn is between a view the person put somewhere and a view the
application moved on its own.

#### Scenario: A trip with several markers

- **WHEN** a trip with markers spread across a city is opened
- **THEN** every marker is within the visible area
- **AND** none sits against the edge of the viewport

#### Scenario: A trip with no markers

- **WHEN** a trip with no markers is opened
- **THEN** the map renders at the default position
- **AND** no error is shown

#### Scenario: The person pans away

- **WHEN** a person pans or zooms after the map has opened
- **THEN** the view stays where they put it
- **AND** the map does not snap back to the framing position

#### Scenario: A city is selected

- **WHEN** a person selects a city that holds markers
- **THEN** the map frames that city's markers
- **AND** it uses the same shared framing logic as it does on opening

#### Scenario: A city with no markers is selected

- **WHEN** a person selects a city that holds no markers
- **THEN** the camera does not move
- **AND** no error is shown

#### Scenario: A marker is added while the person has panned away

- **WHEN** a marker is saved after the person has moved the view
- **THEN** the view stays where they put it
- **AND** the new marker is drawn wherever it falls, visible or not

## ADDED Requirements

### Requirement: An unsaved marker is drawn distinguishably from saved ones

While a place is being added, the map SHALL draw the unsaved marker at its current
position and SHALL make it distinguishable at a glance from the trip's saved markers.

The unsaved marker SHALL be drawn above saved markers, so that placing one at or near
an existing marker leaves it visible and movable rather than buried.

It SHALL NOT be counted among the trip's markers: it SHALL NOT contribute to framing,
and it SHALL NOT be included wherever the trip's markers are counted or listed.

When the place is abandoned the unsaved marker SHALL disappear and the map SHALL be
exactly as it was. When the place is saved it SHALL become an ordinary marker and SHALL
be drawn like every other.

#### Scenario: An unsaved marker is placed

- **WHEN** a person begins adding a place
- **THEN** the map draws its position distinguishably from the saved markers
- **AND** the camera does not move

#### Scenario: An unsaved marker is placed on top of a saved one

- **WHEN** a person places an unsaved marker at the position of an existing marker
- **THEN** the unsaved marker is drawn above it
- **AND** it can still be moved

#### Scenario: The place is abandoned

- **WHEN** a person abandons the place they were adding
- **THEN** the unsaved marker disappears
- **AND** the trip's markers are drawn exactly as before

#### Scenario: The place is saved

- **WHEN** a person saves the place
- **THEN** the marker is drawn like every other marker of the trip
- **AND** it is no longer distinguished as unsaved
