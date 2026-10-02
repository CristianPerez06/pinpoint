## MODIFIED Requirements

### Requirement: The map opens framing the trip's markers

On opening, the map SHALL position itself to show every marker of the current trip,
using the shared framing logic and the actual size of the surface it is drawn into.

Where chrome is drawn over the map rather than beside it, framing SHALL use the part of
the map that is **not** covered. Both halves of framing are affected and both SHALL
account for it: the zoom SHALL be chosen so the markers fit the uncovered part, and the
centre SHALL be offset so they land in it. Choosing the zoom for the whole surface and
only shifting the centre satisfies neither — the markers are then fitted to an area
twice the height of the one that can be seen, so the outer ones sit behind the chrome
while the framing reports success.

Which part of the map is covered SHALL be determined by the actual overlap between the
chrome and the map, and not by the chrome's position on the screen alone. Chrome drawn
beside the map — above it, beneath it, or to one side — SHALL contribute nothing to the
covered part however tall it is, and the covered part SHALL never be larger than the map
itself.

Rationale: this is not defensive tidiness. An application measuring the covered part as
the distance from the map's bottom edge up to the top of each piece of chrome gets the
right answer only for chrome whose top edge is inside the map; for a control in a bar
above the map the same subtraction reaches past the map's own top and returns a value
larger than the surface. The result is a plausible positive number that no type and no
lint can question, and every consumer of it then behaves correctly and visibly wrongly.

Only chrome that spans the map's width SHALL reduce the area framing fits markers into.
Chrome occupying part of the width leaves the rest of the map usable, and framing against
a reduced height because one corner is occupied discards the map that is plainly visible
beside it.

Rationale: framing fits points into a rectangle and cannot express the shape left by a
panel in a corner, so it has to approximate. Of the two approximations available, one
risks a single marker landing behind a panel that can be dismissed, and the other opens
the map on empty space with every marker pressed against the top edge. They are not
comparable failures, and the second reads as the application being broken.

When the trip has no markers, the map SHALL open at the shared default position rather
than failing or showing an undefined region.

When the trip has exactly one marker, the map SHALL centre on it at a zoom level that
shows its surroundings rather than at maximum zoom.

The map SHALL re-frame when, and only when, the person asks it to. Three things are such
a request:

- **Selecting a city**, which SHALL frame that city's markers using the same shared
  logic. Selecting a city that holds no markers SHALL leave the view where it is,
  because there is nothing to frame and moving to an arbitrary position would be worse
  than not moving.
- **Choosing a place from search**, which SHALL move to that place. A searched place is
  usually not on screen — that is generally why somebody searched for it — so leaving
  the camera still would put the place they just chose somewhere they cannot see, and
  the position they are being invited to confirm would be invisible while they
  confirmed it.
- **Pressing "where am I"**, which SHALL move to the person's position, as
  `device-location` describes. Asking where you are is asking to see it; a position
  found and then left off screen would answer nothing.

Nothing else SHALL move the camera. Panning or zooming SHALL NOT be overridden by
re-framing, markers arriving, changing, or being added SHALL NOT re-frame, and the
person's position changing SHALL NOT move the camera — the distinction being drawn is
between a view the person put somewhere and a view the application moved on its own.

#### Scenario: A trip with several markers

- **WHEN** a trip with markers spread across a city is opened
- **THEN** every marker is within the visible area
- **AND** none sits against the edge of the viewport

#### Scenario: Chrome beside the map rather than over it

- **WHEN** markers are framed while the application's controls sit in a bar above the
  map rather than over it
- **THEN** framing uses the whole of the map's surface
- **AND** no part of the map is treated as covered

#### Scenario: Chrome covering one corner of the map

- **WHEN** markers are framed while a panel covers part of the map's width
- **THEN** the area framing fits the markers into is not reduced
- **AND** the markers are not compressed into the part of the map the panel does not
  reach

#### Scenario: A trip framed while a sheet covers part of the map

- **WHEN** markers are framed while a sheet stands over part of the map
- **THEN** every marker is within the part of the map that is not covered
- **AND** none is behind the sheet

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

#### Scenario: A place is chosen from search

- **WHEN** a person chooses a place returned by search
- **THEN** the map moves to that place
- **AND** it is close enough to show what surrounds it, rather than at maximum zoom
- **AND** the unsaved marker for it is on screen

#### Scenario: A marker is added while the person has panned away

- **WHEN** a marker is saved after the person has moved the view
- **THEN** the view stays where they put it
- **AND** the new marker is drawn wherever it falls, visible or not

#### Scenario: "Where am I" is pressed

- **WHEN** a person presses "where am I" and their position is found
- **THEN** the map moves to that position
- **AND** it uses the same shared logic as a single place, so it is close enough to show
  what surrounds the position rather than at maximum zoom

#### Scenario: The person walks while the map is elsewhere

- **WHEN** the person's position changes after the map has moved to it
- **THEN** the camera does not move
