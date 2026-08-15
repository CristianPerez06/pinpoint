## ADDED Requirements

### Requirement: The rendered style is derived from the upstream document, and says so when it cannot be

The shared map package SHALL produce the map style by transforming the upstream style
document rather than by handing the applications its address unchanged. The
transformation SHALL be a pure function of the fetched document: given the same
document it SHALL produce the same result, and it SHALL perform no I/O of its own.

The transformation SHALL be identified by name in the shared package so that both
applications apply the same one, and neither SHALL adjust the style itself.

Where the transformation depends on the upstream document containing particular
layers, it SHALL verify that they are present and SHALL fail loudly when they are
not. It SHALL NOT silently return a partly-transformed style.

Rationale: the upstream document is versioned by somebody else and its layers can be
renamed without notice. A transformation that quietly skips what it cannot find
produces a map that is half-themed, which reads as a styling mistake and never is.

#### Scenario: The style is applied on both platforms

- **WHEN** the same trip is opened on web and on mobile
- **THEN** both render the style produced by the same shared transformation
- **AND** neither application modifies it afterwards

#### Scenario: The upstream document is missing an expected layer

- **WHEN** the fetched style document no longer contains a layer the transformation
  expects
- **THEN** the failure is reported, naming what was missing
- **AND** a partly-transformed style is not rendered

#### Scenario: The upstream document is unreachable

- **WHEN** the style document cannot be fetched
- **THEN** the map reports that it could not load the map style
- **AND** it does not present a blank canvas with correctly-placed markers and no
  explanation

### Requirement: The map is drawn in the same theme as the interface around it

The map SHALL be rendered in the theme the rest of the application is rendered in.
When the theme changes, the map SHALL change with it without the trip being reloaded
and without the camera moving.

Markers SHALL be drawn in their family's colour for the active theme.

#### Scenario: The interface is dark

- **WHEN** an application is rendering in the dark theme
- **THEN** the map is drawn in its dark form
- **AND** no part of the map is drawn in the light theme's values

#### Scenario: The theme changes while the map is open

- **WHEN** the theme changes while a trip is on screen
- **THEN** the map re-renders in the new theme
- **AND** the camera stays exactly where it was

### Requirement: A marker's drawn form declares which of its points sits on the coordinate

The shared visual description SHALL state which point of the drawn marker corresponds
to the marker's coordinate. Applications SHALL mount markers using that point and
SHALL NOT assume the drawn form is centred on its position.

The stated point SHALL hold at every zoom level, and while the map is being zoomed as
well as after it settles.

Rationale: a marker whose drawn form is anchored by the wrong point is off by a fixed
number of pixels, which is invisible at the zoom the map opens at and looks like
drift as soon as somebody zooms. It renders, it type-checks, and it is wrong.

#### Scenario: A marker is drawn at a known coordinate

- **WHEN** a marker is rendered on either platform
- **THEN** the point the shared description names sits on the marker's coordinate

#### Scenario: The map is zoomed

- **WHEN** a person zooms in or out
- **THEN** each marker's named point stays on its coordinate throughout
- **AND** markers do not drift relative to what is beneath them

## MODIFIED Requirements

### Requirement: A marker's appearance is derived from its type by shared code

The shared map package SHALL expose a function turning a marker into a platform-neutral
visual description — its position, its icon, its colour family, and its label.
Applications SHALL render that description and SHALL NOT inspect a marker's type to
decide how it looks.

Colour family SHALL be determined by the marker type's family, and icon by the type
itself. The description SHALL carry these as identifiers rather than as values ready
to draw: a family name rather than a colour, and an icon name rather than a glyph.

Applications SHALL resolve a family identifier to a colour through the shared token
package for the active theme, and SHALL resolve an icon identifier through their own
platform's icon set. Neither SHALL contain a family's colour as a literal, and neither
SHALL decide which icon a type gets.

Rationale for identifiers rather than values: a colour now depends on the active
theme, which the shared package has no business knowing, and an icon is a rendered
component that a package declaring no dependencies cannot hold.

An icon identifier that an application cannot resolve SHALL render as the fallback
type's icon rather than as nothing, and the mismatch SHALL be caught by an automated
check rather than by looking at the map.

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

#### Scenario: A type has no icon on one platform

- **WHEN** a type's icon identifier has no mapping in one application's icon set
- **THEN** an automated check reports the unmapped identifier
- **AND** if it reaches a rendered map, the marker draws the fallback icon rather than
  an empty pin
