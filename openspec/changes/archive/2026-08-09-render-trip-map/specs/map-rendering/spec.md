## Purpose

Define what a rendered map shows and what stays shared between platforms: the tiles
and attribution, the camera that frames a trip's markers, how a marker's type becomes
something visible, and what happens when two markers occupy the same point. Covers
both applications, which use different rendering libraries and must produce the same
map from the same data.

## ADDED Requirements

### Requirement: Both applications render the same map from the same shared logic

Each application SHALL render an interactive map that can be panned and zoomed.

Both applications SHALL obtain the map style reference, the framing camera, and each
marker's visual description from the shared map package. Neither SHALL derive a
camera, choose a colour, or select an icon on its own.

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

### Requirement: Attribution for the tile data is always visible

Wherever map tiles are rendered, the applications SHALL display attribution for
OpenStreetMap data.

Attribution SHALL be visible in the map's default state without interaction. It MAY be
abbreviated behind a control that expands it, provided something identifying the data
source is visible unprompted.

Attribution SHALL NOT be removed, hidden behind an interaction that can be missed, or
rendered in a way that fails to appear when the map does.

#### Scenario: The map is displayed

- **WHEN** a person views a screen showing the map on either platform
- **THEN** attribution for OpenStreetMap data is visible without interacting with
  anything

#### Scenario: A change would remove attribution

- **WHEN** a change removes the attribution control or renders it invisible
- **THEN** the change violates this requirement regardless of visual motivation

### Requirement: The map opens framing the trip's markers

On opening, the map SHALL position itself to show every marker of the current trip,
using the shared framing logic and the actual size of the surface it is drawn into.

When the trip has no markers, the map SHALL open at the shared default position rather
than failing or showing an undefined region.

When the trip has exactly one marker, the map SHALL centre on it at a zoom level that
shows its surroundings rather than at maximum zoom.

Framing SHALL happen once on opening. Panning or zooming afterwards SHALL NOT be
overridden by re-framing.

#### Scenario: A trip with several markers

- **WHEN** a trip with markers spread across a city is opened
- **THEN** every marker is within the visible area
- **AND** none sits against the edge of the viewport

#### Scenario: A trip with no markers

- **WHEN** a trip with no markers is opened
- **THEN** the map renders at the default position
- **AND** no error is shown

#### Scenario: The person pans away

- **WHEN** a person pans or zooms after the map has opened
- **THEN** the view stays where they put it
- **AND** the map does not snap back to the framing position

### Requirement: A marker's appearance is derived from its type by shared code

The shared map package SHALL expose a function turning a marker into a platform-neutral
visual description — its position, its icon, its colour, and its label. Applications
SHALL render that description and SHALL NOT inspect a marker's type to decide how it
looks.

Colour SHALL be determined by the marker type's family, and icon by the type itself.
Colour values SHALL come from the shared token package rather than being written into
either application.

A marker whose stored type is not recognised SHALL still render, using the fallback
type's appearance.

#### Scenario: Two markers of different types

- **WHEN** a temple and a restaurant are rendered
- **THEN** they show different icons
- **AND** they show the colours of their respective families

#### Scenario: Two markers of the same family

- **WHEN** a temple and a castle are rendered
- **THEN** they share a colour, because they share a family
- **AND** they show different icons

#### Scenario: An unrecognised type

- **WHEN** a marker's stored type is not in the shared list
- **THEN** it renders with the fallback type's icon and colour
- **AND** it is not omitted from the map

#### Scenario: A colour is changed

- **WHEN** a family's colour is changed in the shared tokens
- **THEN** both applications render the new colour after rebuilding
- **AND** neither application contains the literal value

### Requirement: Markers at identical coordinates remain reachable

When two or more markers of a trip share the same position, the map SHALL make their
number apparent and SHALL provide a way to reach every one of them.

A marker SHALL NOT be rendered such that it is permanently obscured by another. Because
identical coordinates render to the same point at every zoom level, zooming SHALL NOT
be the only way to separate them.

The map SHALL NOT alter a marker's stored position in order to separate it visually.

#### Scenario: Two markers share a position

- **WHEN** two markers of the same trip have identical coordinates
- **THEN** the map indicates that more than one marker is at that point
- **AND** both markers can be reached from it

#### Scenario: Zooming does not help

- **WHEN** a person zooms to maximum on two markers with identical coordinates
- **THEN** they are still not separated by position
- **AND** the mechanism above is still what makes both reachable

#### Scenario: Selecting a point that holds several markers

- **WHEN** a person selects a point where more than one marker sits
- **THEN** they are offered the markers at that point to choose between
- **AND** choosing one shows what was recorded about it

#### Scenario: Stored positions are left alone

- **WHEN** the map renders coincident markers
- **THEN** neither marker's stored longitude or latitude is modified
- **AND** what is stored still reflects what the geocoder or the person supplied

### Requirement: The map does not label every marker

The map SHALL NOT render a permanent text label beside every marker at every zoom
level. Labels MAY appear when the view is close enough that they do not collide.

Rationale: at the zoom level that shows a whole city, twenty labels overlap into
unreadable text, and the question the map answers at that zoom is which markers are
near each other, not what each one is called.

#### Scenario: A city-wide view

- **WHEN** a trip's markers for one city are all visible at once
- **THEN** markers are distinguishable from one another
- **AND** the view is not obscured by overlapping text

### Requirement: Selecting a marker shows what was recorded about it

The map SHALL allow a person to select a marker and see the information held about
that place: its name, its note, its link, its price, and its type. Values that are
absent SHALL be shown as absent rather than as empty text.

The information SHALL be reachable from the map without navigating away from it.

Selection SHALL be dismissible, returning to the unobstructed map.

The presentation MAY differ between platforms. Each application SHALL choose the form
native to it rather than sharing rendered markup.

#### Scenario: Selecting a marker

- **WHEN** a person selects a marker on either platform
- **THEN** they see the name, note, link, price, and type recorded for that place
- **AND** the map is still on screen

#### Scenario: A marker with only a name

- **WHEN** a marker has no note, link, or price
- **THEN** those fields are shown as absent
- **AND** no empty field is presented as though it held a value

#### Scenario: Dismissing the selection

- **WHEN** a person dismisses the selected marker
- **THEN** the map returns to its unobstructed state
- **AND** the camera is not moved by the dismissal

### Requirement: The map distinguishes loading from empty

While a trip's markers are being loaded, the map SHALL indicate that loading is in
progress. It SHALL NOT present a loading map as though the trip had no markers.

When loading fails, the map SHALL say so and SHALL NOT present the failure as an empty
trip.

Rationale: a trip with no markers and a trip whose markers have not arrived render
identically — an empty map — and the difference between "you have not saved anything
yet" and "this is broken" is one a person cannot recover on their own.

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
