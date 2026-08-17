## MODIFIED Requirements

### Requirement: The map distinguishes loading from empty

While a trip's markers are being loaded, the map SHALL indicate that loading is in
progress. It SHALL NOT present a loading map as though the trip had no markers.

When loading fails, the map SHALL say so and SHALL NOT present the failure as an empty
trip.

When a filter is applied and no marker matches it, the map SHALL say that nothing matches
the filter, and SHALL NOT present that as a trip with no markers.

Rationale: a trip with no markers, a trip whose markers have not arrived, and a trip
narrowed to nothing all render identically — an empty map. The differences between "you
have not saved anything yet", "this is broken" and "nothing matches what you asked for"
are ones a person cannot recover on their own, and each calls for a different next
action: save something, retry, or widen the filter.

#### Scenario: Markers are still loading

- **WHEN** the map is shown before the trip's markers have arrived
- **THEN** it indicates that it is loading
- **AND** it does not state or imply that the trip has no markers

#### Scenario: Loading fails

- **WHEN** the markers cannot be loaded
- **THEN** the map reports the failure
- **AND** does not present the trip as empty

#### Scenario: The trip genuinely has no markers

- **WHEN** loading completes and the trip has no markers
- **THEN** the map says the trip has no markers
- **AND** this is distinguishable from both the loading and failed states

#### Scenario: A filter matches no markers

- **WHEN** a filter is applied to a trip that has markers, and none of them match
- **THEN** the map says that no markers match the filter
- **AND** this is distinguishable from the loading, failed, and genuinely-empty states

## ADDED Requirements

### Requirement: Changing a filter does not move the camera

Applying, changing or clearing a filter SHALL NOT re-frame the map.

Rationale: the map already frames a trip when it opens and never afterwards, so that
panning somewhere deliberately is not undone. A filter is changed far more often than a
trip is opened, and re-framing on each change would move the ground under someone every
time they narrowed what they were looking at.

When a filter leaves markers to show but none of them are within the current view, the
map SHALL indicate that the matching markers are elsewhere and SHALL offer to frame them.
Refusing to move the camera would otherwise produce a map that is empty while the filter
reports matches, which is the same indistinguishable-empty problem from the other side.

#### Scenario: Narrowing the filter while panned

- **WHEN** a filter is applied while the map is panned somewhere
- **THEN** the camera stays where it was
- **AND** the markers that no longer match are removed from the map

#### Scenario: The matches are all off screen

- **WHEN** an applied filter matches markers and none of them are within the current view
- **THEN** the map indicates that the matching markers are outside the view
- **AND** offers to frame them

#### Scenario: Clearing the filter

- **WHEN** a filter is cleared
- **THEN** every marker is shown again
- **AND** the camera stays where it was
