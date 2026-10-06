## MODIFIED Requirements

### Requirement: A "where am I" control stands on the map's edge

Each application SHALL offer a control that shows the person where they are, on the
same edge as the zoom control, wherever that edge is drawn. It is used throughout a
session on the trip, so under *Controls are placed by how often they are used* it SHALL
be permanently placed rather than kept behind a menu.

It SHALL be a separate round object, not a member of the zoom control's group, with the
same space between it and its neighbours that the re-read keeps from zoom. Where the
re-read is shown, the edge SHALL read, from the bottom: zoom, "where am I", re-read.
Where the re-read is not shown, it SHALL stand directly above zoom. In the phone
application, Follow me (`follow-me`) SHALL stand between "where am I" and the re-read,
so the edge reads, from the bottom: zoom, "where am I", Follow me, re-read.

Rationale for the order: it is pressed far more often than the re-read and less often
than zoom, so it stands between them, and the re-read keeps the place furthest from a
thumb at rest that *The re-read stands on the map's edge* gives it.

It SHALL match the re-read's size, border and lift on each platform. At rest it SHALL
take no fill, because finding a position commits nothing. Its glyph SHALL be a
crosshair. While the map is centred on the person's last known position the crosshair
SHALL be drawn filled at its centre, and once the map is moved away it SHALL return to
the outline. While Follow me is on and the camera is following the person, the crosshair
SHALL be drawn filled; while they are looking around, a press SHALL bring the camera back
to them and following SHALL resume (`follow-me`).

It SHALL carry an accessible name from the product's named sentences. It SHALL remain
available with no network connection: a device finds its position without one.

#### Scenario: The control on the phone

- **WHEN** the phone shows the map with the re-read present
- **THEN** zoom, "where am I" and the re-read stand on the same edge in that order from
  the bottom, as three separate objects with visible space between them

#### Scenario: The control on the phone, with Follow me

- **WHEN** the phone application shows the map with the re-read present
- **THEN** zoom, "where am I", Follow me and the re-read stand on the same edge in that
  order from the bottom, as four separate objects with visible space between them

#### Scenario: The control on the laptop

- **WHEN** the laptop shows the map at a laptop width, where the re-read is not drawn
- **THEN** "where am I" stands directly above zoom, separate from it

#### Scenario: The glyph says whether the map is on the person

- **WHEN** the map has moved to the person's position
- **THEN** the control's crosshair is drawn filled at its centre
- **AND** after the person pans the map away, it is drawn as an outline again

#### Scenario: No connection

- **WHEN** the phone has no network connection
- **THEN** "where am I" is still available and still finds the position

### Requirement: The dot follows the person, and the map does not

Once a position has been found, the dot SHALL move as the person's position changes,
for as long as the application stays open in the foreground. A change of position
SHALL NOT move the camera; only a press of "where am I" does. The two exceptions are
following a route (`route-following`) and Follow me (`follow-me`), where keeping the
person in view is the point: while either is under way, the camera SHALL move with them,
and once it ends this rule holds again.

The application SHALL NOT read the device's location while it is in the background, and
SHALL resume when it returns to the foreground. After the application is closed and
opened again, the dot SHALL appear only once the person next asks where they are: a press
of "where am I" or of *Use my location*, or opening Nearby once location has been
allowed.

Rationale: the person can watch the dot approach a pin without the map pulling away
from what they were looking at. Stopping in the background is what keeps "follows you"
from becoming "tracks you".

#### Scenario: The person walks

- **WHEN** the person's position changes after it was found, no route is being
  followed and Follow me is off
- **THEN** the dot moves to the new position
- **AND** the camera stays where it was

#### Scenario: Following a route

- **WHEN** the person's position changes while a route is being followed
- **THEN** the dot moves to the new position
- **AND** the camera moves to keep it in view

#### Scenario: Follow me

- **WHEN** the person's position changes while Follow me is on
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

