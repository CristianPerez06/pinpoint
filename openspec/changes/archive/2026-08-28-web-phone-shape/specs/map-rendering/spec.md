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

When the trip has no markers, the map SHALL open at the shared default position rather
than failing or showing an undefined region.

When the trip has exactly one marker, the map SHALL centre on it at a zoom level that
shows its surroundings rather than at maximum zoom.

The map SHALL re-frame when, and only when, the person asks it to. Two things are such
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

Nothing else SHALL move the camera. Panning or zooming SHALL NOT be overridden by
re-framing, and markers arriving, changing, or being added SHALL NOT re-frame — the
distinction being drawn is between a view the person put somewhere and a view the
application moved on its own.

#### Scenario: A trip with several markers

- **WHEN** a trip with markers spread across a city is opened
- **THEN** every marker is within the visible area
- **AND** none sits against the edge of the viewport

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

## ADDED Requirements

### Requirement: Framing stays usable as the visible strip shrinks

Framing SHALL produce a usable camera for every height the uncovered part of the map can
take, including none at all, and the zoom it produces SHALL always be a finite value
inside the shared range.

An application that frames against a reduced height SHALL NOT reduce it without limit.
It SHALL keep a floor under the strip it frames against, so that a tall sheet cannot
drive the camera to the end of the zoom range.

Rationale: the zoom is derived by dividing by the usable height. Zero does not produce a
value that is *not a number* — it produces negative infinity, which the shared clamp then
turns into the minimum zoom — so the failure is not a broken camera but a camera showing
the entire world, which reads as the map having jumped somewhere rather than as a
framing decision. The floor is what keeps the correction proportionate: the point of
framing against the visible strip is to see the places, and a strip small enough to zoom
out to the ocean has stopped serving that.

#### Scenario: A sheet covering the whole map

- **WHEN** framing is asked for while the covered height is at least the height of the
  surface
- **THEN** a camera with a finite zoom inside the shared range is produced
- **AND** the map continues to render

#### Scenario: A tall sheet does not zoom the map out to nothing

- **WHEN** a sheet covers most of the map and framing is asked for
- **THEN** the zoom is chosen against a bounded strip rather than against what is left
- **AND** it does not fall to the shared minimum

#### Scenario: The visible strip shrinking never zooms in

- **WHEN** the same points are framed against a full surface and against a strip of it
- **THEN** the zoom for the strip is no greater than the zoom for the full surface
