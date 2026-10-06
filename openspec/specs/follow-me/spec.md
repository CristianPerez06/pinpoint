# follow-me Specification

## Purpose
Lets a person walking on the phone with no destination in mind have the map keep up with
them: tilted, kept on their position, and turned to the way they are walking, with no route.

## Requirements

### Requirement: A Follow me control stands on the phone's map edge

The phone application SHALL offer a Follow me control on the map's edge, between "where am
I" and the re-read (`device-location`), wherever that edge is drawn. It SHALL match their
size, border and lift, and its glyph SHALL be an arrow pointing up.

One press SHALL turn Follow me on and the next SHALL turn it off. While it is off the
control SHALL take no fill. While it is on, it SHALL declare that state with the accent's
wash beneath the accent's ink, as a control in the chrome declaring a state may
(`styling`), and SHALL NOT take the accent as its fill.

It SHALL carry an accessible name from the product's named sentences saying what pressing
it does — turning Follow me on, or turning it off — and SHALL be announced as selected
while it is on.

The laptop SHALL NOT offer Follow me, at any width.

Follow me SHALL NOT be remembered: the map SHALL open flat with north at the top, with
Follow me off, every time the application is opened.

#### Scenario: The control

- **WHEN** the phone shows the map
- **THEN** a Follow me control with an arrow stands between "where am I" and the re-read

#### Scenario: Turning it on and off

- **WHEN** a person presses Follow me, and later presses it again
- **THEN** Follow me is on after the first press, with the control drawn in the accent's
  wash
- **AND** after the second press it is off, and the control has no fill

#### Scenario: Opening the application

- **WHEN** a person who left Follow me on closes the application and opens it again
- **THEN** the map is flat with north at the top
- **AND** Follow me is off

#### Scenario: The laptop

- **WHEN** the map is shown on the laptop, at any width
- **THEN** no Follow me control is offered

### Requirement: Follow me keeps the person in view, tilted and turned the way they walk

Turning Follow me on SHALL find the person's position as "where am I" does, asking for
permission the first time (`device-location`). Once the position is known, the camera SHALL
keep it in view as the person moves, close enough to read the streets around them, and
clear of the bar at the bottom of the screen.

Unless the person has chosen the flat view, the map SHALL be tilted, as it is while
following a route (`route-following`), and the person's position SHALL sit in the middle of
what the bar leaves uncovered, tilted or flat. Pins SHALL stay readable when tilted.

The map SHALL be turned so that the direction the person has been walking points up the
screen. That direction SHALL come from the person's own positions, measured over at least
several metres of movement, and SHALL NOT come from the phone's compass. When the person
has not moved far enough to tell, the map SHALL keep the direction it has, so that standing
still never turns it; before they have walked anywhere, north SHALL stay at the top. The map
SHALL NOT turn for a change of direction smaller than 15 degrees, and each turn SHALL be
animated rather than drawn at once, so that it turns smoothly at corners and holds still
between them.

The header, the bottom bar, the pins and the controls on the map's edge SHALL stay while
Follow me is on, and pressing a pin SHALL open its details as it does otherwise.

Follow me SHALL work with no network connection: the position comes from the device, and
the map's streets are drawn wherever the area has been downloaded (`offline-use`).

#### Scenario: Turning it on

- **WHEN** a person who has allowed location presses Follow me
- **THEN** the camera moves to their position and the map tilts, unless the flat view was
  chosen
- **AND** north is at the top until they walk

#### Scenario: Walking

- **WHEN** the person walks east along a street with Follow me on
- **THEN** the camera keeps their position in view, clear of the bar
- **AND** the map turns so that east points up the screen

#### Scenario: Turning a corner

- **WHEN** the person turns left at a corner and walks on
- **THEN** the map turns smoothly so their new direction points up

#### Scenario: Standing still

- **WHEN** the person stands still with Follow me on and their position wavers by a few
  metres
- **THEN** the map does not turn

#### Scenario: No connection

- **WHEN** a person turns Follow me on with no connection
- **THEN** the camera follows their position as it would with one

### Requirement: Follow me shares the tilt choice and the compass with route following

While Follow me is on, the control that switches between the tilted and the flat view, and
the compass while the map is turned, SHALL be offered at the top right of the map, as they
are while following a route (`route-following`), and SHALL do what they do there: the tilt
control SHALL say which view pressing it gives, and the compass SHALL put north at the top
for as long as Follow me stays on, leaving the map tilted or flat as it was.

The tilt choice SHALL be the same remembered choice route following uses: choosing the flat
view in one SHALL make the other start flat, and the other way round.

Notes laid over the top of the map SHALL leave room for these controls while Follow me is
on, so that neither covers the other.

#### Scenario: Choosing the flat view

- **WHEN** the person presses *2D* with Follow me on
- **THEN** the map lies flat, still turned to the way they are walking
- **AND** the control now shows *3D*

#### Scenario: The choice carries over

- **WHEN** the person chose the flat view with Follow me on, and later starts following a
  route
- **THEN** following the route starts with the map flat

#### Scenario: North at the top

- **WHEN** the person presses the compass with Follow me on
- **THEN** north is at the top and the map does not turn again while Follow me stays on

### Requirement: Looking around, opening a place, and what ends Follow me

When the person moves the map by hand with Follow me on, the camera SHALL stop following
them, and Follow me SHALL stay on. Pressing "where am I" SHALL bring the camera back to them
and following SHALL resume, turned and tilted as before.

While a place's details are open, the camera SHALL hold still. When the details are
closed with Follow me still on, the camera SHALL go back to the person and following SHALL
resume.

Pressing *Calculate route*, arming the sight to drop a pin, choosing a city, or asking to
be shown the places that match the filter SHALL turn Follow me off. Turning it off, in any way, SHALL put north back at the top and lay the map
flat. A route that is calculated and then started SHALL be followed as `route-following`
says, and Follow me SHALL stay off when following ends.

#### Scenario: Looking around

- **WHEN** the person drags the map with Follow me on
- **THEN** the camera stops following them
- **AND** pressing "where am I" brings the camera back to them, turned and tilted as
  before, and following resumes

#### Scenario: Reading a place on the way

- **WHEN** the person presses a pin with Follow me on, reads its details and closes them
- **THEN** the map holds still while the details are open
- **AND** once they are closed, the camera goes back to the person and follows them again

#### Scenario: Calculating a route

- **WHEN** the person presses *Calculate route* in a place's details with Follow me on
- **THEN** Follow me is off, and the map is flat with north at the top as it frames the
  route

#### Scenario: Turning it off

- **WHEN** the person presses Follow me while it is on
- **THEN** the map is flat with north at the top, and the camera stays over where it was

### Requirement: Without location permission, Follow me says why it is not available

When location permission has been refused, pressing Follow me SHALL NOT turn it on, the
camera SHALL NOT move, and the map SHALL stay flat and usable. A note SHALL say that Follow
me needs the person's location and that it can be turned on in Settings; pressing it SHALL
open the application's page in the device's Settings, as the refused note of "where am I"
does (`device-location`). When the position cannot be found, the note "where am I" shows for
that SHALL be shown, and Follow me SHALL stay off.

Every word SHALL come from the product's named sentences, in English and in Spanish.

#### Scenario: Location refused

- **WHEN** a person who refused location presses Follow me
- **THEN** a note says Follow me needs their location and can be turned on in Settings
- **AND** the map stays flat with north at the top, and Follow me stays off

#### Scenario: Spanish

- **WHEN** the application is in Spanish
- **THEN** the control's name and the note are in Spanish
