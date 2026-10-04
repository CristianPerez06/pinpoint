## MODIFIED Requirements

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
