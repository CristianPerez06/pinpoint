## ADDED Requirements

### Requirement: The indication that the map is loading occupies the map's own area

Where the chrome around the map is already drawn, the indication that the map is loading
SHALL occupy the area the map itself will occupy, and SHALL be drawn on the ground the map
is drawn on.

It SHALL NOT stand in place of the whole screen, and SHALL NOT be drawn on a ground that
reads as another band of chrome.

Rationale: `The map distinguishes loading from empty` says the map indicates that it is
loading and does not say where that indication belongs. It did not have to while the whole
screen was the indication. Once the chrome is present, the question becomes real: a
loading panel on its own recessive surface, directly beneath a bar on a raised one, reads
as two bands of furniture rather than as one hole where the map goes. Giving the area the
map's own ground makes the space legible as the map before the map is there, which is what
tells a person that the thing they are waiting for is the map and not the application.

#### Scenario: The map is loading beneath drawn chrome

- **WHEN** the chrome is drawn and the map's data has not arrived
- **THEN** the indication that it is loading occupies the area the map will occupy
- **AND** that area is drawn on the ground the map is drawn on
- **AND** the indication does not stand in place of the whole screen

#### Scenario: The waiting area is drawn against the chrome

- **WHEN** the waiting area is drawn directly beneath or above a piece of chrome
- **THEN** it is distinguishable from that chrome
- **AND** it does not read as a second band of chrome
