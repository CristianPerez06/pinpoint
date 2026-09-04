## MODIFIED Requirements

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

That indication SHALL be withheld while the map is showing a place the person named — a
marker revealed because search recognised it, as `marker-filtering` describes. The
condition the indication answers is that there is nothing on the map to look at, and a
revealed place is a pin on screen with its description open on it. Offering to frame the
filter's matches there interrupts a place somebody deliberately went to, and the offer
leads somewhere else by name: the matches are, by definition, not the place being read.

Rationale: the offer and the revealed place could not coexist before one existed. A
marker selected by pointing at it is necessarily within the view, so an open description
and "none of them in view" were mutually exclusive by construction, and the indication's
condition never had to say more than that the drawn set was off screen. A place drawn
outside the drawn set breaks that coincidence, and the missing half has to be stated
rather than left to be re-derived.

#### Scenario: Narrowing the filter while panned

- **WHEN** a filter is applied while the map is panned somewhere
- **THEN** the camera stays where it was
- **AND** the markers that no longer match are removed from the map

#### Scenario: The matches are all off screen

- **WHEN** an applied filter matches markers and none of them are within the current view
- **THEN** the map indicates that the matching markers are outside the view
- **AND** offers to frame them

#### Scenario: A revealed place is on screen

- **WHEN** a place the filter excludes is drawn because search recognised it
- **AND** none of the filter's own matches are within the view
- **THEN** the map does not offer to frame the matches
- **AND** the place that was found stays the thing being looked at

#### Scenario: The revealed place is dismissed

- **WHEN** the description of a revealed place is closed
- **AND** none of the filter's matches are within the view
- **THEN** the map indicates that the matching markers are elsewhere, as it otherwise would

#### Scenario: Clearing the filter

- **WHEN** a filter is cleared
- **THEN** every marker is shown again
- **AND** the camera stays where it was
