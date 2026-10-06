# device-location Specification

## Purpose

Lets a person see where they are on the trip's map, so they can judge how far they are
from the places saved for it. This capability covers when the device's location is
asked for, how the position is drawn, and what the person is told when it can't be
had.

## Requirements

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

### Requirement: Location is asked for only when the person asks where they are

An application SHALL NOT ask for the device's location before the person first asks for
something that needs it: pressing "where am I", pressing *Use my location* in the
Nearby sheet (`nearby-places`), or pressing *Calculate route* in a place's details
(`place-route`). It SHALL NOT ask at launch, on opening a trip, on opening
the map, or on opening Nearby.

Once the person has allowed location, opening Nearby SHALL count as asking where they
are, and SHALL find their position without a further press. Opening Nearby SHALL NOT
cause the platform's prompt to be shown.

The first such press SHALL ask through the platform's own permission prompt, with no
screen of the application's own in front of it. The press is the explanation: the person
has just asked where they are, has just been offered a list of distances measured
from where they are, or has just asked how far a place is from them.

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

#### Scenario: Calculate route asks

- **WHEN** a person who has never answered presses *Calculate route* in a place's details
- **THEN** the platform's own location prompt is shown

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

### Requirement: An uncertain position shows how uncertain it is

When the device reports its position as uncertain by more than the dot's own radius on
screen, the application SHALL draw a shaded circle around the dot, centred on it, whose
radius on screen is that uncertainty at the current zoom. The circle SHALL be faint
enough that the map and markers stay readable through it, and SHALL NOT take presses.

How the uncertainty converts to a size on screen SHALL come from the shared map package,
so both applications draw the same circle for the same uncertainty.

Rationale: a phone with precise location turned off, or a laptop locating itself by
Wi-Fi, knows only the neighbourhood. A dot alone would claim an exact spot it does not
have.

#### Scenario: Precise location is off

- **WHEN** the device reports its position as uncertain to about 1.5 kilometres
- **THEN** a shaded circle of that radius surrounds the dot
- **AND** the markers inside it remain visible and pressable

#### Scenario: A precise position

- **WHEN** the reported uncertainty is smaller than the dot
- **THEN** no circle is visible beyond the dot

### Requirement: Finding the position says it is happening

From the press until a position arrives or the attempt ends, the control SHALL show
that it is working in the way the re-read does, and SHALL be announced as busy. A press
while it is working SHALL NOT start a second attempt.

An attempt SHALL end after a bounded wait. It SHALL NOT spin indefinitely.

#### Scenario: Waiting for a position

- **WHEN** a person presses "where am I" and the position has not yet arrived
- **THEN** the control shows it is working and the camera has not moved

#### Scenario: Pressed again while working

- **WHEN** "where am I" is pressed while an attempt is in progress
- **THEN** no second attempt starts

### Requirement: A refused or missing position is said, and the map stays

When permission is refused, or the position cannot be found, the camera SHALL NOT move
and the person SHALL be told in a note over the map, in words from the product's named
sentences, in the language the application is using.

Refused and not found SHALL be told apart, because the fix differs:

- **Refused**, on the phone: the note SHALL say location is off for the application and
  that it can be turned on in Settings. Pressing the note SHALL open the application's
  page in the device's settings. On the laptop: the note SHALL say the browser is
  blocking location for the site and that it can be allowed from the address bar.
- **Not found**: the note SHALL say the position could not be found and to try again in
  a moment. Pressing "where am I" again SHALL try again.

Once permission has been refused, a later press SHALL show the refused note again
rather than nothing. If the person has since allowed location, a later press SHALL work
as a first success does.

The note SHALL be dismissible, and SHALL go away when a position is found.

Rationale: a platform that has been refused will not ask a second time, so a button that
silently does nothing after a refusal reads as broken. The note is the way out.

#### Scenario: Permission refused on the phone

- **WHEN** a person refuses the location prompt on the phone
- **THEN** the map stays where it was
- **AND** a note says location is off and can be turned on in Settings
- **AND** pressing the note opens the application's page in the device's settings

#### Scenario: Permission refused on the laptop

- **WHEN** a person refuses the browser's location prompt
- **THEN** the map stays where it was
- **AND** a note says the browser is blocking location and to allow it from the address
  bar

#### Scenario: Pressed again after a refusal

- **WHEN** a person who refused presses "where am I" again
- **THEN** the refused note is shown again

#### Scenario: Location allowed later

- **WHEN** a person who refused has since allowed location, and presses "where am I"
- **THEN** the position is found and the map moves there

#### Scenario: The position can't be found

- **WHEN** permission is granted but no position arrives before the wait ends
- **THEN** the map stays where it was
- **AND** a note says the position could not be found and to try again

#### Scenario: Spanish

- **WHEN** the application is in Spanish and a refused or not-found note is shown
- **THEN** the note is in Spanish

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
