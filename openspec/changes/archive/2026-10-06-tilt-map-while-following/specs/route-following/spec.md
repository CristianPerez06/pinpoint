## MODIFIED Requirements

### Requirement: Following shows the map around the person

While following, the place's details SHALL be closed and the map SHALL fill the screen,
with the route line (in its street form), the person's position and the place's pin drawn
as `place-route` draws them. The line SHALL be the route being followed, and SHALL be
replaced whenever a new route replaces it.

The camera SHALL keep the person's position in view as they move, close enough to read the
streets around them, and clear of the card at the top and the bar at the bottom.

Unless the person has chosen the flat view, the map SHALL be tilted while following, leaning
back about 60 degrees so the streets ahead run towards the top of the screen, as a car's
sat-nav shows them. Tilted, the person's position SHALL still sit in the middle of what the
card and the bar leave uncovered, as it does on the flat map, at the start of a route and
after every turn of the map. Pins and the route line SHALL stay readable.

A control beside the compass SHALL switch between the tilted view and the flat one, for as
long as following lasts. It SHALL say which view pressing it gives — *3D* while the map is
flat, *2D* while it is tilted — and SHALL carry an accessible name from the product's named
sentences saying what pressing it does. The choice SHALL be remembered on the device, SHALL
still hold after the application is closed and opened again, and SHALL be the view the next
following starts in. A device that has never chosen SHALL start tilted.

The map SHALL be turned so that the way ahead points up the screen. The way ahead SHALL be
the direction of the route about 40 metres beyond the person, measured along the route, and
SHALL NOT come from the phone's compass or from the person's own movement. The map SHALL
NOT turn for a change of direction smaller than 15 degrees, so that it turns at corners
and holds still between them.

While the map is turned, a compass control SHALL show which way north is, and SHALL carry
an accessible name from the product's named sentences. Pressing it SHALL put north at the
top for the rest of that trip, and SHALL leave the map tilted or flat as it was.

When the person moves the map by hand, the camera SHALL stop following them, and a control
SHALL be offered that brings the camera back to them and resumes following, turning the map
to the way ahead again unless north was put at the top, and tilting it again unless the
flat view was chosen. It SHALL carry an accessible name from the product's named sentences.

When following ends, north SHALL be put back at the top and the map SHALL be flat again.

While following, the map's toolbar and its other controls SHALL NOT be offered, and
pressing a pin SHALL NOT open its details. The map's credits SHALL stay visible.

Rationale for the route rather than the compass: at walking speed a phone's compass and its
sense of direction are noisy, and a map that turns with every wobble is harder to read
than one that does not turn at all. The route only changes direction where the streets do.

Rationale for the tilt being a choice: a tilted map shows more of the way ahead and less of
what is beside and behind, and some people read a flat map more easily. Following with no
route (#296) is to share the same remembered choice.

#### Scenario: Following begins

- **WHEN** following begins on a route that leaves the person heading south
- **THEN** the place's details close
- **AND** the map shows the person, the route and the place, with the route ahead pointing
  up the screen
- **AND** the map is tilted, unless the flat view was chosen

#### Scenario: The person walks

- **WHEN** the person's position changes while following
- **THEN** the camera moves to keep them in view
- **AND** they are not hidden behind the card or the bar

#### Scenario: Tilted, and clear of the card and the bar

- **WHEN** following begins tilted, and later the map turns at a corner
- **THEN** both times the person's position sits in the middle of what the card and the bar
  leave uncovered

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
- **AND** the map stays tilted if it was tilted

#### Scenario: Choosing the flat view

- **WHEN** the person presses *2D* while following
- **THEN** the map lies flat, still turned to the way ahead, with the person clear of the
  card and the bar
- **AND** the control now shows *3D*

#### Scenario: The choice is remembered

- **WHEN** the person chose the flat view, closed the application, opened it again and
  started following another route
- **THEN** following starts with the map flat

#### Scenario: Looking around

- **WHEN** the person drags the map while following
- **THEN** the camera stops following them
- **AND** a control to return to their position is shown
- **AND** pressing it brings the camera back, turned to the way ahead and tilted as chosen,
  and following the person resumes

#### Scenario: Following ends

- **WHEN** following ends, by arriving or by *Stop*
- **THEN** north is at the top
- **AND** the map is flat

#### Scenario: Pressing a pin

- **WHEN** a person presses another pin while following
- **THEN** no place's details open

#### Scenario: Spanish

- **WHEN** the application is in Spanish
- **THEN** the control beside the compass is named in Spanish
