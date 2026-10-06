## ADDED Requirements

### Requirement: The route can be continued in another maps app

Once a line is drawn, in either form, the route card SHALL offer to open the route in
another maps app. It SHALL be offered with no connection too: the other app deals with
its own connection.

**On the phone** it SHALL read *Open in…*, and SHALL stand beside *Start* where *Start* is
offered (`route-following`), and alone where it is not. Pressing it SHALL open a choice,
drawn by the application in the product's tokens and words, of:

- on an iPhone: *Google Maps* and *Apple Maps*;
- on Android: *Google Maps* and *Another maps app*, which hands the place to the device and
  lets the device choose or use its default;

and a way to close the choice without opening anything.

**On the laptop** it SHALL read *Open in Google Maps*, and SHALL open Google Maps in a new
tab, leaving Pinpoint open where it was.

Whichever app opens SHALL receive the place's position as the destination, and the
chosen way of travelling wherever that app accepts it; where it accepts none for that way
of travelling, it SHALL receive the destination alone. It SHALL NOT receive the person's
position: the other app finds it, and works out its own route.

Choosing Google Maps SHALL open the Google Maps app when it is installed and the Google
Maps website when it is not, so that the choice always opens something.

Each control SHALL carry an accessible name from the product's named sentences that names
the place.

Rationale: Pinpoint's own route cannot be carried across, and an app given the destination
plans its own way there just as well. Opening another app costs Pinpoint nothing and uses
no service of Google's on Pinpoint's behalf.

#### Scenario: The phone's choice, on an iPhone

- **WHEN** a person on an iPhone presses *Open in…*
- **THEN** a choice of *Google Maps* and *Apple Maps* opens, with a way to close it

#### Scenario: The phone's choice, on Android

- **WHEN** a person on Android presses *Open in…*
- **THEN** a choice of *Google Maps* and *Another maps app* opens, with a way to close it

#### Scenario: Google Maps is installed

- **WHEN** a person walking to a place chooses *Google Maps* and it is installed
- **THEN** the Google Maps app opens with directions to the place on foot

#### Scenario: Google Maps is not installed

- **WHEN** a person chooses *Google Maps* and it is not installed
- **THEN** the Google Maps website opens with directions to the place

#### Scenario: Apple Maps by bike

- **WHEN** a person cycling to a place chooses *Apple Maps*
- **THEN** Apple Maps opens with the place as its destination

#### Scenario: Another maps app

- **WHEN** a person on Android chooses *Another maps app*
- **THEN** the device opens its maps app, or asks which one, with the place

#### Scenario: Closing the choice

- **WHEN** a person closes the choice without picking an app
- **THEN** nothing opens and the route card is as it was

#### Scenario: The laptop

- **WHEN** a person driving to a place presses *Open in Google Maps* on the laptop
- **THEN** a new tab opens Google Maps with driving directions to the place
- **AND** Pinpoint stays open with the route drawn

#### Scenario: No connection

- **WHEN** only the straight line is drawn because the phone has no connection
- **THEN** *Open in…* is offered and opens the choice
