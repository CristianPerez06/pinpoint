## MODIFIED Requirements

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
