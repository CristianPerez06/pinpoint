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

### Requirement: An unsaved marker is drawn distinguishably from saved ones

While a place is being added, the map SHALL show the position being added and SHALL
make it distinguishable at a glance from the trip's saved markers.

What is drawn SHALL follow the shape of the screen rather than the platform. Where
the position is indicated directly it SHALL be drawn as an unsaved marker at that
position. Where the position is indicated by framing the map under a fixed sight,
the sight SHALL be what shows it, and the saved markers SHALL remain visible
beneath — the point of showing the position at all is that it can be read against
the places already on the trip.

The position being added SHALL be drawn above saved markers, so that placing one at
or near an existing marker leaves it visible and correctable rather than buried.

The position SHALL remain visible while the form that saves it is open. A form
that covers the map entirely leaves a geocoded result unconfirmable: the candidate
carried a name and a claim about where it is, and looking at where it landed is
the only way to check the claim. Where the form cannot sit beside the map it SHALL
leave enough of it showing for the drawn position to be read against what is
around it.

Any movement of the camera made to keep the position clear SHALL be bounded by what it is
correcting for. A position that nothing is drawn in front of SHALL NOT move the camera at
all, and after any movement the position SHALL be within the map.

Rationale: "only far enough, if at all" is unenforceable until it says what too far
looks like. A correction that carries the position off the edge of the map has not kept
it clear of the chrome — it has hidden it more completely than the chrome would have,
and it does so while reporting that it made the position visible. The person is then
asked to describe a place they cannot see, having chosen it by pointing at a map they
could.

It SHALL NOT be counted among the trip's markers: it SHALL NOT contribute to framing,
and it SHALL NOT be included wherever the trip's markers are counted or listed.

When the place is abandoned the unsaved position SHALL disappear and the map SHALL be
exactly as it was. When the place is saved it SHALL become an ordinary marker and SHALL
be drawn like every other.

#### Scenario: An unsaved marker is placed by pointing at the map

- **WHEN** a person points at the map to place somewhere
- **THEN** the map draws its position distinguishably from the saved markers
- **AND** the camera does not re-frame, because they chose a point they were
  already looking at
- **AND** it moves only far enough, if at all, to keep that position clear of
  anything drawn over the map

#### Scenario: A position nothing is drawn in front of

- **WHEN** a person points at a part of the map that no chrome covers
- **THEN** the camera does not move at all

#### Scenario: The correction does not overshoot

- **WHEN** the camera moves to keep a position clear of chrome drawn over the map
- **THEN** the position is within the map afterwards
- **AND** it is not behind the chrome

#### Scenario: A position is shown by a fixed sight

- **WHEN** a person frames the map under a fixed sight to place somewhere
- **THEN** the sight is distinguishable at a glance from the trip's saved markers
- **AND** the saved markers stay visible beneath it
- **AND** the application does not move the camera while the sight is armed

#### Scenario: An unsaved marker is placed by choosing a search result

- **WHEN** a person chooses a place returned by search
- **THEN** the map draws its position distinguishably from the saved markers
- **AND** the camera moves so that position is on screen

#### Scenario: An unsaved marker is placed on top of a saved one

- **WHEN** a person places an unsaved marker at the position of an existing marker
- **THEN** the unsaved marker is drawn above it
- **AND** it can still be corrected

#### Scenario: The place is abandoned

- **WHEN** a person abandons the place they were adding
- **THEN** the unsaved position disappears
- **AND** the trip's markers are drawn exactly as before

#### Scenario: The form for the place is open

- **WHEN** a person is filling in the form for a place being added
- **THEN** the position being added is still drawn on the map
- **AND** enough of the map is visible to read that position against its surroundings

#### Scenario: The place is saved

- **WHEN** a person saves the place
- **THEN** the marker is drawn like every other marker of the trip
- **AND** it is no longer distinguished as unsaved

### Requirement: Zoom is reachable from a visible control, not only a gesture

Each application SHALL offer a visible control that zooms the map in and out. The
control SHALL be present whenever the map is, without any prior interaction, and SHALL
NOT be the only way to zoom — the platform's own gestures SHALL continue to work
unchanged.

Rationale: a gesture is not an affordance. On a pointer it is a scroll over a
full-bleed canvas, which is easy to trigger by accident and zooms about the pointer, so
the view slides while it scales; on a phone it is a pinch, which needs two hands or a
grip that cannot be held while walking, and the phone is the platform used *during* the
trip. A control is also the only form of zoom a screen reader or a keyboard can reach.

Zooming from the control SHALL be about the centre of the view, and the centre
coordinate SHALL NOT move. Where an application shows a position under a fixed sight,
zooming SHALL leave the position under that sight unchanged.

Rationale: this is what makes the control a way of *looking* rather than a way of moving
the camera. It is also what keeps it inside the rule that nothing but a person's request
moves the camera — the person asked, with a button instead of a gesture.

The step SHALL come from the shared map package. Neither application SHALL define its
own step or its own bounds.

The shared minimum and maximum zoom SHALL be in force for **every** instrument that can
change zoom, not only for the control and for framing. An application SHALL bind the
shared range to its renderer rather than relying on the renderer's own defaults.

Rationale: the range belongs to the product, and the renderers do not share it —
`maplibre-gl` allows more zoom than the shared framing logic will ever return. Without
binding it, the end of the range depends on which instrument was last used, and a camera
can be left somewhere no framing can return to.

At either end of the range the control that can do nothing SHALL be drawn as
unavailable and announced as unavailable, and SHALL NOT be removed. Where the platform
has a focus or accessibility order, the unavailable control SHALL remain in it.

Rationale: removing it tells somebody arriving by keyboard or by screen reader that
zoom is gone, and says nothing about why.

#### Scenario: The control is visible with the map

- **WHEN** a person views a screen showing the map on either platform
- **THEN** a control for zooming in and a control for zooming out are visible without
  interacting with anything

#### Scenario: Zooming in from the control

- **WHEN** a person uses the control to zoom in
- **THEN** the map zooms in by the shared step
- **AND** the centre coordinate of the view is unchanged

#### Scenario: Zooming while a position is under a fixed sight

- **WHEN** a person zooms from the control while a position is shown under a fixed sight
- **THEN** the position under the sight is unchanged
- **AND** confirming afterwards saves the same coordinate it would have saved before

#### Scenario: The end of the range is reached

- **WHEN** the map is at the shared maximum zoom
- **THEN** the control for zooming in is drawn as unavailable and announced as such
- **AND** it is still present and still reachable
- **AND** using it does nothing

#### Scenario: A gesture reaches the end of the range

- **WHEN** a person zooms past the shared maximum with a gesture rather than the control
- **THEN** the map stops at the shared maximum
- **AND** it does not stop at the rendering library's own limit

#### Scenario: Gestures still work

- **WHEN** a person zooms by scroll, by pinch, or by the rendering library's own
  keyboard shortcut
- **THEN** the map zooms as it did before the control existed

#### Scenario: The control is on the map at every width

- **WHEN** the map is rendered at any window or device size
- **THEN** the zoom control is within the map's own bounds
- **AND** it can be reached by pointer, by keyboard and by a screen reader

#### Scenario: The control does not cover the attribution

- **WHEN** the map is rendered at any window or device size
- **THEN** the attribution for the tile data is fully visible
- **AND** the zoom control overlaps neither it nor anything else standing on that edge
