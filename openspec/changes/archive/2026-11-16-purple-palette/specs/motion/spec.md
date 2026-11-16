## MODIFIED Requirements

### Requirement: The phone opens from its still icon without a visible switch

When the phone app is started, the first thing on screen SHALL be the still launch image: the
product's mark as a sphere in the mark's tile colour with the pin in the mark's drop colour,
centred on the ground. The still image SHALL be cut from the existing mark, like every other
icon asset.

The animated opening SHALL begin from a frame identical to that image in size, position and
colour, and the still image SHALL stay on screen until the animated opening has drawn that
frame, so no blank or mismatched frame is shown between them.

#### Scenario: A cold launch

- **WHEN** the app is started from nothing
- **THEN** the still icon appears first
- **AND** the animation starts from exactly what the still icon shows
- **AND** no blank frame appears between them

#### Scenario: The device is in dark appearance

- **WHEN** the device is set to dark appearance at launch
- **THEN** the still icon sits on the dark ground

#### Scenario: The mark's colours change

- **WHEN** the mark's tile and drop colours are changed
- **THEN** the still launch image and the opening's first frame both show the new colours
- **AND** the two still match each other

### Requirement: The full opening plays the approved sequence

The full opening SHALL play, in order:

1. The icon, still, for a moment.
2. The flat pin fills out into a 3D pin: a round head with the icon's hole drilled through it,
   narrowing to a point. It grows by about a third and rises until its point sits on the
   middle of the sphere, with its head tipped toward the viewer. At the same time the view
   rises to look down on the globe, light comes up on the sphere, and the continents appear in
   a darker shade of the sphere's own colour.
3. The globe spins right, stops hard and bounces.
4. The globe spins back left to where it started, stops hard and bounces.
5. The globe spins left again, as far as the first spin, stops hard and bounces.
6. The globe lifts slightly and fades, and the app is underneath.

The pin SHALL stay on the middle of the sphere while the globe spins under it, and SHALL sway
with each hard stop. Steps 1 to 5 SHALL take no more than two and a half seconds, and step 6 no
more than three tenths of a second.

The approved mock recorded in the change that introduced the opening is the reference for how
each step moves. It is not the reference for colour: the sphere, the continents and the pin
take the mark's colours, and the mock shows the ones the mark had when it was made.

#### Scenario: The first launch on a fast phone

- **WHEN** the app is launched for the first time and is ready before the animation ends
- **THEN** all six steps play in order
- **AND** the app appears when step 6 ends

#### Scenario: Each spin ends

- **WHEN** any of the three spins reaches its end
- **THEN** the globe stops abruptly, overshoots slightly and settles back
- **AND** the pin sways with the stop

#### Scenario: The continents appear

- **WHEN** the continents fade in during step 2
- **THEN** they are a darker shade of the sphere's colour
- **AND** they are not a second hue

### Requirement: The map's waiting area shows the turning globe

Where an application waits for the map, or for the trip it shows, inside the map's area, it
SHALL show the product's globe turning in place of a spinner: a sphere in the mark's tile
colour, with the continents in a darker shade of that colour turning under the mark's pin,
which is drawn in the mark's drop colour and stands on the middle of the sphere with the globe
visible through its hole. The globe SHALL be drawn flat, as a picture, and SHALL keep the same
colours on both grounds, as the mark does.

It SHALL turn at a constant speed, one full turn over a shared duration, and SHALL carry the
words saying what is being waited for beside it.

Small indicators of activity inside controls, such as a button that is saving, SHALL remain
spinners.

With reduce motion on, the globe SHALL stand still, and the words SHALL remain.

Rationale: the map's waiting area is the one wait a person sees on every visit, and the globe
ties it to the phone's opening. Inside a control, a globe at that size cannot be read.

#### Scenario: The map is loading

- **WHEN** an application is waiting for the map or its trip inside the map's area
- **THEN** the globe turns where the spinner stood
- **AND** the words saying what is loading stand beside it

#### Scenario: The map is loading on the dark ground

- **WHEN** the map is loading and the application is on the dark ground
- **THEN** the sphere, the continents and the pin are the same colours as on the light ground

#### Scenario: The map is loading with reduce motion on

- **WHEN** reduce motion is on and the map is loading
- **THEN** the globe stands still
- **AND** the words saying what is loading are shown

#### Scenario: A button is saving

- **WHEN** a control shows that an act it started is in flight
- **THEN** it shows a spinner, not the globe
