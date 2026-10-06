## MODIFIED Requirements

### Requirement: The dot follows the person, and the map does not

Once a position has been found, the dot SHALL move as the person's position changes,
for as long as the application stays open in the foreground. A change of position
SHALL NOT move the camera; only a press of "where am I" does. The one exception is
following a route (`route-following`), where keeping the person in view is the point:
while following, the camera SHALL move with them, and once following ends this rule
holds again.

The application SHALL NOT read the device's location while it is in the background, and
SHALL resume when it returns to the foreground. After the application is closed and
opened again, the dot SHALL appear only once the person next asks where they are: a press
of "where am I" or of *Use my location*, or opening Nearby once location has been
allowed.

Rationale: the person can watch the dot approach a pin without the map pulling away
from what they were looking at. Stopping in the background is what keeps "follows you"
from becoming "tracks you".

#### Scenario: The person walks

- **WHEN** the person's position changes after it was found, and no route is being
  followed
- **THEN** the dot moves to the new position
- **AND** the camera stays where it was

#### Scenario: Following a route

- **WHEN** the person's position changes while a route is being followed
- **THEN** the dot moves to the new position
- **AND** the camera moves to keep it in view

#### Scenario: The application goes to the background

- **WHEN** the application goes to the background and comes back
- **THEN** no position is read while it is in the background
- **AND** the dot resumes following on return

#### Scenario: A new launch

- **WHEN** the application is opened again after being closed
- **THEN** no dot is drawn until "where am I" is pressed, or Nearby is opened with
  location allowed

### Requirement: The person's position stays on the device

The person's position SHALL be used only to draw the dot, to move the map, and to ask a
routing service for a route from it (`place-route`, `route-following`). It SHALL NOT be
stored, sent to the product's database, or shared with the other people on the trip. A
routing service SHALL be sent the position only as the start of a route being asked for,
and SHALL NOT be sent it otherwise.

Opening a route in another maps app SHALL NOT pass that app the person's position.

Rationale: the trip is shared, and the people on it agreed to share places, not
whereabouts. A route has to start somewhere, so asking for one sends where it starts; it
sends nothing more.

#### Scenario: Others on the trip

- **WHEN** a person's position has been found
- **THEN** nobody else on the trip can see it
- **AND** nothing about it is written to the database

#### Scenario: Following a route

- **WHEN** a person follows a route and leaves it
- **THEN** the routing service is sent their position as the start of the new route
- **AND** nothing about it is written to the database

#### Scenario: Opening another maps app

- **WHEN** a person opens a route in another maps app
- **THEN** that app is given the destination and not the person's position
