## MODIFIED Requirements

### Requirement: A marker's appearance is derived from its type by shared code

The shared map package SHALL expose a function turning a marker into a platform-neutral
visual description — its position, its icon, its colour, and its label.
Applications SHALL render that description and SHALL NOT inspect a marker's type to
decide how it looks.

Colour and icon SHALL both be determined by the marker type. The description SHALL
carry these as identifiers rather than as values ready to draw: a type name rather
than a colour, and an icon name rather than a glyph. The description SHALL NOT carry
any grouping between a type and its colour.

Applications SHALL resolve a type identifier to a colour through the shared token
package for the active theme, and SHALL resolve an icon identifier through their own
platform's icon set. Neither SHALL contain a type's colour as a literal, and neither
SHALL decide which icon a type gets.

Rationale for identifiers rather than values: a colour now depends on the active
theme, which the shared package has no business knowing, and an icon is a rendered
component that a package declaring no dependencies cannot hold.

An icon identifier that an application cannot resolve SHALL render as the fallback
type's icon rather than as nothing, and the mismatch SHALL be caught by an automated
check rather than by looking at the map.

A marker whose stored type is not recognised SHALL still render. A stored type that
a previous version of the system defined SHALL render as the type that replaced it,
and only a value never defined SHALL take the fallback type's appearance.

#### Scenario: Two markers of different types

- **WHEN** a museum and a restaurant are rendered
- **THEN** they show different icons
- **AND** they show the colours of their respective types

#### Scenario: Two markers that were once the same family

- **WHEN** a marker stored as a temple and a marker stored as a park are rendered
- **THEN** they show different colours, because they are now different types
- **AND** neither requires its icon to be read to tell them apart

#### Scenario: An unrecognised type

- **WHEN** a marker's stored type was never defined by any version of the system
- **THEN** it renders with the fallback type's icon and colour
- **AND** it is not omitted from the map

#### Scenario: A retired type

- **WHEN** a marker's stored type was defined by an earlier version and has since
  been retired
- **THEN** it renders as the type that replaced it
- **AND** it does not render as the fallback

#### Scenario: A colour is changed

- **WHEN** a type's colour is changed in the shared tokens
- **THEN** both applications render the new colour after rebuilding
- **AND** neither application contains the literal value

#### Scenario: A type has no icon on one platform

- **WHEN** a type's icon identifier has no mapping in one application's icon set
- **THEN** an automated check reports the unmapped identifier
- **AND** if it reaches a rendered map, the marker draws the fallback icon rather than
  an empty pin
