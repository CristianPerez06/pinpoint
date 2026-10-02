## MODIFIED Requirements

### Requirement: Location is asked for only when the person asks where they are

An application SHALL NOT ask for the device's location before the person first asks for
something that needs it: pressing "where am I", or pressing *Use my location* in the
Nearby sheet (`nearby-places`). It SHALL NOT ask at launch, on opening a trip, on opening
the map, or on opening Nearby.

Once the person has allowed location, opening Nearby SHALL count as asking where they
are, and SHALL find their position without a further press. Opening Nearby SHALL NOT
cause the platform's prompt to be shown.

The first such press SHALL ask through the platform's own permission prompt, with no
screen of the application's own in front of it. The press is the explanation: the person
has just asked where they are, or has just been offered a list of distances measured
from where they are.

On the phone, the sentence the platform shows inside its prompt SHALL be supplied in
English and in Spanish, and SHALL say that the position is used to show the person
where they are on the trip's map and how far they are from the trip's places.

Rationale: a prompt with no visible reason gets refused, and on iOS a refusal is
expensive to come back from. Asking at the moment of the press is asking at the one
moment the reason is obvious.

Rationale for Nearby counting once allowed: a list of distances is a question about
where the person is, asked by opening it. Requiring a press on every launch, after the
person has already said yes, would make the list open ordered from the map every time
somebody on a street corner wants it ordered from them.

#### Scenario: Opening the app does not ask

- **WHEN** a person opens the application and a trip's map
- **THEN** no location permission prompt is shown

#### Scenario: The first press asks

- **WHEN** a person who has never answered presses "where am I"
- **THEN** the platform's own location prompt is shown
- **AND** no screen of the application's own is shown before it

#### Scenario: Opening Nearby does not ask

- **WHEN** a person who has never answered opens Nearby
- **THEN** no location permission prompt is shown

#### Scenario: Use my location asks

- **WHEN** a person who has never answered presses *Use my location* in Nearby
- **THEN** the platform's own location prompt is shown

#### Scenario: Opening Nearby once allowed

- **WHEN** a person who has allowed location opens Nearby, in this session or a later one
- **THEN** their position is found without a further press
- **AND** no prompt is shown

### Requirement: A found position moves the map there and is marked

When a press of "where am I" finds the position, the map SHALL move to it, as *The map opens framing the
trip's markers* allows for this press, using the same shared logic as for a single
place. Where chrome covers part of the map, the position SHALL land in the part that is
not covered.

The position SHALL be marked with a round dot. The dot's colour SHALL be the theme's ink
colour, not any marker type's colour, so it cannot be read as a place. It SHALL carry a
ring in the surface colour and a soft halo so it stands off the map on both themes.

Markers SHALL be drawn over the dot, and the dot SHALL NOT take presses. A place under
or beside the person stays as reachable as it was.

A position found any other way — by opening Nearby, or by pressing *Use my location*
in it — SHALL be marked the same way and SHALL NOT move the map.

Rationale for the colour: other map apps show the person as blue, and blue is the
colour of a place to stay. A blue dot beside a hotel pin is two marks of the same hue
meaning different things.

#### Scenario: The position is found

- **WHEN** a person presses "where am I" and their position is found
- **THEN** the map moves to that position
- **AND** a dot is drawn there in the ink colour of the current theme

#### Scenario: A place is at the person's position

- **WHEN** a marker stands where the dot is drawn
- **THEN** the marker is drawn over the dot
- **AND** pressing there selects the marker

#### Scenario: Something covers the bottom of the map

- **WHEN** the position is found while the bar of tools stands over the bottom of the map
- **THEN** the position lands in the part of the map that is not covered

#### Scenario: Far from the trip

- **WHEN** the position is found far from every place on the trip
- **THEN** the map moves to the position all the same
- **AND** no place of the trip need be in view

#### Scenario: Found through Nearby

- **WHEN** the position is found because Nearby was opened or *Use my location* was pressed
- **THEN** a dot is drawn at the position
- **AND** the map does not move

### Requirement: The dot follows the person, and the map does not

Once a position has been found, the dot SHALL move as the person's position changes,
for as long as the application stays open in the foreground. A change of position
SHALL NOT move the camera; only a press of "where am I" does.

The application SHALL NOT read the device's location while it is in the background, and
SHALL resume when it returns to the foreground. After the application is closed and
opened again, the dot SHALL appear only once the person next asks where they are: a press
of "where am I" or of *Use my location*, or opening Nearby once location has been
allowed.

Rationale: the person can watch the dot approach a pin without the map pulling away
from what they were looking at. Stopping in the background is what keeps "follows you"
from becoming "tracks you".

#### Scenario: The person walks

- **WHEN** the person's position changes after it was found
- **THEN** the dot moves to the new position
- **AND** the camera stays where it was

#### Scenario: The application goes to the background

- **WHEN** the application goes to the background and comes back
- **THEN** no position is read while it is in the background
- **AND** the dot resumes following on return

#### Scenario: A new launch

- **WHEN** the application is opened again after being closed
- **THEN** no dot is drawn until "where am I" is pressed, or Nearby is opened with
  location allowed
