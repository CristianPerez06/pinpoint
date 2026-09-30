## ADDED Requirements

### Requirement: What the map draws stays inside the map

Everything the map draws — markers, the selected marker, the place being added, a
revealed place, and anything mounted at a coordinate — SHALL be drawn only within the
map's own area. Where part of it falls past the map's edge, that part SHALL be cut off at
the edge. It SHALL NOT be drawn over anything outside the map: a header, a notice between
the header and the map, a bar or any other part of the interface.

A marker that is partly past the edge SHALL NOT be moved back inside it. It is drawn at
its position and cut off, as any map does.

Where a marker lies beneath something drawn beside the map, a press on that thing SHALL
reach that thing and not the marker.

This SHALL hold on every application and every platform, on every edge of the map, in
both themes, and whether or not the trip is online.

Rationale: the header above the map is where the trip and the city are chosen. A pin
drawn over it hides those names and takes the press meant for them. One renderer cuts
off what spills past the map by default and another does not, so the behaviour has to
be stated rather than inherited — it held on one phone and not on the other for as long
as nothing said so.

#### Scenario: A pin at the top edge of the map

- **WHEN** a person pans the map so that a marker sits against its top edge
- **THEN** the part of the marker past the edge is not drawn
- **AND** the trip name and the city line above the map are fully visible

#### Scenario: The header answers the press, not the pin beneath it

- **WHEN** a marker sits just past the top edge of the map, beneath the city line
- **AND** a person presses the city line
- **THEN** the city selector opens
- **AND** the marker is not selected

#### Scenario: A pin at the edge while the trip is offline

- **WHEN** the trip is shown with no connection, so the offline note sits between the
  header and the map
- **AND** a marker sits against the top edge of the map
- **THEN** the marker is cut off at the map's edge
- **AND** the offline note and the header are fully visible

#### Scenario: Every edge, not only the top

- **WHEN** a marker sits against the bottom, left or right edge of the map
- **THEN** the part of it past that edge is not drawn
- **AND** nothing drawn beside the map on that side is covered
