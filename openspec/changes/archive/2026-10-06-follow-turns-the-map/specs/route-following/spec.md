## MODIFIED Requirements

### Requirement: Following shows the map around the person

While following, the place's details SHALL be closed and the map SHALL fill the screen,
with the route line (in its street form), the person's position and the place's pin drawn
as `place-route` draws them. The line SHALL be the route being followed, and SHALL be
replaced whenever a new route replaces it.

The camera SHALL keep the person's position in view as they move, close enough to read the
streets around them, and clear of the card at the top and the bar at the bottom.

The map SHALL be turned so that the way ahead points up the screen. The way ahead SHALL be
the direction of the route about 40 metres beyond the person, measured along the route, and
SHALL NOT come from the phone's compass or from the person's own movement. The map SHALL
NOT turn for a change of direction smaller than 15 degrees, so that it turns at corners
and holds still between them.

While the map is turned, a compass control SHALL show which way north is, and SHALL carry
an accessible name from the product's named sentences. Pressing it SHALL put north at the
top for the rest of that trip.

When the person moves the map by hand, the camera SHALL stop following them, and a control
SHALL be offered that brings the camera back to them and resumes following, turning the map
to the way ahead again unless north was put at the top. It SHALL carry an accessible name
from the product's named sentences.

When following ends, north SHALL be put back at the top.

While following, the map's toolbar and its other controls SHALL NOT be offered, and
pressing a pin SHALL NOT open its details. The map's credits SHALL stay visible.

Rationale for the route rather than the compass: at walking speed a phone's compass and its
sense of direction are noisy, and a map that turns with every wobble is harder to read
than one that does not turn at all. The route only changes direction where the streets do.

#### Scenario: Following begins

- **WHEN** following begins on a route that leaves the person heading south
- **THEN** the place's details close
- **AND** the map shows the person, the route and the place, with the route ahead pointing
  up the screen

#### Scenario: The person walks

- **WHEN** the person's position changes while following
- **THEN** the camera moves to keep them in view
- **AND** they are not hidden behind the card or the bar

#### Scenario: Turning a corner

- **WHEN** the person passes a corner where the route turns left
- **THEN** the map turns so the new way ahead points up

#### Scenario: A gentle bend

- **WHEN** the route ahead bends by less than 15 degrees
- **THEN** the map does not turn

#### Scenario: North at the top

- **WHEN** the person presses the compass while following
- **THEN** north is at the top
- **AND** the map does not turn again for the rest of that trip

#### Scenario: Looking around

- **WHEN** the person drags the map while following
- **THEN** the camera stops following them
- **AND** a control to return to their position is shown
- **AND** pressing it brings the camera back, turned to the way ahead, and following the
  person resumes

#### Scenario: Following ends

- **WHEN** following ends, by arriving or by *Stop*
- **THEN** north is at the top

#### Scenario: Pressing a pin

- **WHEN** a person presses another pin while following
- **THEN** no place's details open
