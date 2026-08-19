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

### Requirement: A visited marker is drawn as visited, without changing its colour

A marker that has been visited SHALL be drawn distinguishably from one that has not.

That distinction SHALL NOT be carried by the marker's colour. Colour names the marker's
family and nothing else, which is what allows the type list to grow without the map
becoming unreadable.

How much a visited marker is muted SHALL be decided by shared code and carried in the
drawn description, in the same way the drawn box and the anchor already are, so that both
applications mute it identically.

Interest SHALL NOT be drawn on a marker. Narrowing the map is what answers who wants to
go; encoding several members' answers onto one pin that already carries a family colour, a
glyph, a possible count badge and a possible selection ring is the unreadability this rule
exists to prevent.

Rationale: "which of these have we already been to" is asked while looking at the map,
most of all on a phone during the trip, and a filter answers it only once somebody thinks
to set one. "Who wants to go" is asked while planning, where narrowing is the better
instrument and the states are too many to draw.

#### Scenario: A visited marker among unvisited ones

- **WHEN** a trip containing visited and unvisited markers is drawn
- **THEN** the visited markers are visually distinguishable from the unvisited ones
- **AND** both are drawn in the colour of their family

#### Scenario: Two markers of one family, one visited

- **WHEN** two markers share a family and only one has been visited
- **THEN** they are drawn in the same colour
- **AND** still tell apart as visited and not

#### Scenario: Both applications mute identically

- **WHEN** the same visited marker is drawn by either application
- **THEN** it is muted by the same amount, taken from the shared drawn description

#### Scenario: Interest is not drawn

- **WHEN** members have recorded differing interest in a marker
- **THEN** the marker's drawn form is unchanged by those records

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
