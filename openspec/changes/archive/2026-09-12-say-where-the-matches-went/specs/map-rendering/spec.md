## MODIFIED Requirements

### Requirement: Both applications render the same map from the same shared logic

Each application SHALL render an interactive map that can be panned and zoomed.

Both applications SHALL obtain the map style reference, the framing camera, each
marker's visual description, and the test of whether a position lies within a view from
the shared map package. Neither SHALL derive a camera, choose a colour, select an icon,
or decide what "within the view" means on its own.

Rationale for the last of those: one application's rendering library answers it and the
other's does not, so the application without one would write a comparison — and two
comparisons written separately can disagree, most obviously about a view crossing the
antimeridian. Framing identically and disagreeing about what is framed is not a
consistent map.

The shared package SHALL NOT import either rendering library, any DOM API, or any
native module. Everything platform-specific — creating the map, mounting markers,
handling gestures — SHALL live in the application.

Given the same markers and the same viewport, both applications SHALL frame them
identically.

#### Scenario: The same trip on both platforms

- **WHEN** the same trip is opened on web and on mobile at the same viewport size
- **THEN** both show the same map style
- **AND** both centre on the same coordinates at the same zoom
- **AND** both draw the same marker at the same position with the same icon and colour

#### Scenario: The shared package stays renderer-agnostic

- **WHEN** the shared map package is inspected for imports
- **THEN** it imports neither rendering library, no DOM API, and no native module
- **AND** it resolves and type-checks under both applications' bundlers

#### Scenario: Framing logic changes

- **WHEN** the rule for framing markers changes
- **THEN** the change is made once in the shared package
- **AND** both applications reflect it without either being edited

#### Scenario: The same position against the same view

- **WHEN** either application asks whether a position lies within the current view
- **THEN** the answer comes from the shared map package
- **AND** both applications give the same answer for the same position and the same view

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

Within the current view SHALL mean within the map's own bounds, and SHALL NOT be narrowed
to the part of the map left uncovered by whatever is standing on it. Framing insets the
covered strip and this test does not, deliberately: the two then agree in the direction
that matters, because framing lands the matches inside the uncovered strip and therefore
inside the bounds, so accepting the offer always settles the condition that raised it.
The narrower reading also manufactures the state the next paragraph exists to prevent —
a description sheet covering the map would push the only match out of the "visible" part
and raise the offer beside the place being read.

That indication SHALL be withheld while the map is showing a place the person named — a
marker revealed because search recognised it, as `marker-filtering` describes. The
condition the indication answers is that there is nothing on the map to look at, and a
revealed place is a pin on screen with its description open on it. Offering to frame the
filter's matches there interrupts a place somebody deliberately went to, and the offer
leads somewhere else by name: the matches are, by definition, not the place being read.

It SHALL likewise be withheld while a position is being placed — a sight armed over the
map, or an unsaved pin awaiting the details that will save it. The reasoning is the one
above and not a second rule: a pin being positioned is a pin on screen that somebody is
attending to, it is drawn outside the filtered set exactly as a revealed place is, and
the offer leads away from it by name.

Rationale: the offer and the revealed place could not coexist before one existed. A
marker selected by pointing at it is necessarily within the view, so an open description
and "none of them in view" were mutually exclusive by construction, and the indication's
condition never had to say more than that the drawn set was off screen. A place drawn
outside the drawn set breaks that coincidence, and the missing half has to be stated
rather than left to be re-derived. An unsaved pin has always been drawn outside the drawn
set, so that half was missing from the start and went unnoticed for as long as only one
application made the offer at all.

#### Scenario: Narrowing the filter while panned

- **WHEN** a filter is applied while the map is panned somewhere
- **THEN** the camera stays where it was
- **AND** the markers that no longer match are removed from the map

#### Scenario: The matches are all off screen

- **WHEN** an applied filter matches markers and none of them are within the current view
- **THEN** the map indicates that the matching markers are outside the view
- **AND** offers to frame them

#### Scenario: The matches are behind what stands on the map

- **WHEN** an applied filter's only match is within the map's bounds but underneath the
  chrome standing on the map
- **THEN** the map does not indicate that the matches are elsewhere

#### Scenario: The offer is accepted

- **WHEN** the offer to frame the matches is accepted
- **THEN** the camera frames the matching markers
- **AND** the filter is unchanged
- **AND** the indication is no longer shown

#### Scenario: A revealed place is on screen

- **WHEN** a place the filter excludes is drawn because search recognised it
- **AND** none of the filter's own matches are within the view
- **THEN** the map does not offer to frame the matches
- **AND** the place that was found stays the thing being looked at

#### Scenario: The revealed place is dismissed

- **WHEN** the description of a revealed place is closed
- **AND** none of the filter's matches are within the view
- **THEN** the map indicates that the matching markers are elsewhere, as it otherwise would

#### Scenario: A position is being placed

- **WHEN** a sight is armed over the map or an unsaved pin is awaiting its details
- **AND** none of the filter's matches are within the view
- **THEN** the map does not offer to frame the matches

#### Scenario: The placement is finished or abandoned

- **WHEN** an unsaved position is saved or given up
- **AND** none of the filter's matches are within the view
- **THEN** the map indicates that the matching markers are elsewhere, as it otherwise would

#### Scenario: Clearing the filter

- **WHEN** a filter is cleared
- **THEN** every marker is shown again
- **AND** the camera stays where it was

#### Scenario: The same state on either platform

- **WHEN** a trip is narrowed the same way on either application and the map is panned so
  that no match is within the view
- **THEN** both applications indicate that the matches are elsewhere
- **AND** both offer to frame them
