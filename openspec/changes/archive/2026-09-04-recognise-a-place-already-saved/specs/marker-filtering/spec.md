## ADDED Requirements

### Requirement: A place addressed by identity stays reachable while a filter is applied

Where the system opens a named marker on the person's behalf rather than in response to
them selecting it on the map, it SHALL open that marker even when the current filter is
not showing it, and SHALL say that the place is hidden by the filter.

Recognising a searched place the trip already holds is the path this covers, and today the
only one.

The system SHALL NOT change or clear the filter in order to show the place. The filter was
chosen deliberately, and altering it so the product's own output makes sense is a change
nobody asked for and would have to be noticed and undone.

The system SHALL NOT silently do nothing. A marker addressed by identity and then not
shown, with no explanation, is indistinguishable from the application failing — and where
the map has already moved to the place, the person is left looking at an empty part of the
map with nothing to read.

The place SHALL also be drawn on the map for as long as it is open, and SHALL stop being
drawn when it is closed. Saying that a place is hidden, while the map it was flown to
shows nothing, was found by looking to be insufficient: on a screen where a sheet covers
the lower half and the camera is centred on the place, there is nothing else on screen to
make the sentence land, and the map reads as having failed. A pin drawn where the sentence
points is what makes it a place rather than a claim.

That pin SHALL be drawn and counted nowhere else. It SHALL NOT contribute to framing, SHALL
NOT be treated as evidence that the trip has markers in view, and SHALL NOT appear in any
list of the trip. It is on the map because it was named, not because the filter admitted
it, and an unsaved marker already has exactly this standing.

A marker that has been **removed** from the trip SHALL NOT be opened by this path. Hidden
and gone are different states: the first is a view setting and the second is a fact about
the trip, and only the first is recoverable by the person changing their mind.

This requirement does not weaken *A filter applies to every view of the trip at once*.
That requirement governs what the map and any list report the trip to **contain**, and
both SHALL continue to exclude what the filter excludes: the place is not restored to the
trip's drawn set, is not counted among it, and disappears again the moment its card is
closed. What is added is one pin under an open card, for as long as that card is open —
the same standing an unsaved marker has, which is likewise drawn without being part of
the set. A card about one named place, and the pin under it, do not report what the trip
contains.

#### Scenario: A searched place is hidden by the current filter

- **WHEN** a person chooses a search candidate matching a marker the filter is hiding
- **THEN** that marker is opened
- **AND** it is stated that the place is hidden by the current filter

#### Scenario: The filter is left alone

- **WHEN** a marker hidden by the filter is opened by this path
- **THEN** the filter is unchanged
- **AND** no other marker the filter excludes is drawn

#### Scenario: The place is drawn under the card that describes it

- **WHEN** a marker hidden by the filter is opened by this path
- **THEN** a pin is drawn at that place
- **AND** it is removed again when the card is closed

#### Scenario: The revealed pin counts toward nothing

- **WHEN** a marker hidden by the filter is drawn because its card is open
- **THEN** it does not affect how the map frames the trip
- **AND** it does not appear in any list of the trip

#### Scenario: The place was removed rather than hidden

- **WHEN** a marker addressed by this path is no longer on the trip
- **THEN** nothing is opened for it
- **AND** it is not presented as hidden

#### Scenario: The map and the list still agree about the trip

- **WHEN** a marker hidden by the filter is opened by this path
- **THEN** no list of the trip shows that marker
- **AND** the map and the list still report the same set as the trip's contents
