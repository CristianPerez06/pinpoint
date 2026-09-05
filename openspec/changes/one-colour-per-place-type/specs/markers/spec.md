## REMOVED Requirements

### Requirement: Marker type is a code-defined value with a bounded set of display families

**Reason**: The two-channel scheme this requirement establishes — family decides
colour, type decides icon, and the family set never grows — is what allowed the
type list to reach sixteen entries over five colours, with seven of them sharing
one. The rule worked exactly as written and the result was a map that could not
distinguish a castle from a park by colour at all. Replaced by a single channel,
below, in which a type is its own colour and the type set is what is bounded.

**Migration**: Types collapse into seven, and no stored value is lost or
rewritten: each retired identifier resolves to the type that replaced it, per
*A retired type identifier resolves to the type that replaced it* below. The
identifier-not-value rule this requirement carried for icons is retained
verbatim in its replacement, so no application's icon mapping changes shape.

## ADDED Requirements

### Requirement: Marker type is a code-defined value, and each type carries its own colour

The system SHALL define the available marker types in shared code rather than as
user-editable data, and SHALL expose them from a shared package consumed by both
applications.

Each type SHALL carry exactly one colour and exactly one icon identifier. Colour
SHALL be determined by the type itself, and no grouping SHALL sit between a type
and its colour. Two distinct types SHALL NOT share a colour.

The set of types SHALL remain small enough that every type stays distinguishable
from every other by colour alone at normal map zoom. Adding a type therefore
costs a colour, and SHALL be treated as a palette decision rather than as an
addition to a list. A type SHALL NOT be added on the grounds that the list has
room for one more.

The icon identifier SHALL name an icon rather than being one. The shared package
SHALL NOT hold a glyph, a character, or a drawable that either application renders
directly; each application SHALL map the identifier to an icon from its own
platform's icon set. Identifiers SHALL be stable, because they are the contract
between the shared type list and two separate icon mappings.

The icon SHALL reinforce what the colour already says and SHALL NOT be the only
channel separating one type from another. A person SHALL be able to tell any two
types apart without resolving a glyph.

The types SHALL be: place, culture, nature, food, shopping, stay, and transport.

Every marker SHALL have a type. A marker whose type cannot be determined SHALL
take a defined fallback type rather than none, so that no marker is unrenderable.

The fallback SHALL be `place`, and `place` SHALL mean only that nothing more was
determined. No type whose meaning a person or the geocoder actually established
SHALL resolve to the fallback, so that the fallback stays rare and a marker
carrying it is genuinely unclassified rather than merely unspecific.

#### Scenario: A type is proposed for addition

- **WHEN** a new type is proposed for the shared list
- **THEN** it requires a colour distinguishable from all seven existing ones
- **AND** it is not accepted merely because the type set is under its bound

#### Scenario: Two types are compared

- **WHEN** any two markers of different types are rendered
- **THEN** they show different colours
- **AND** they are distinguishable without reading either icon

#### Scenario: A type cannot be determined

- **WHEN** a marker is created without a determinable type
- **THEN** it takes the fallback type `place`
- **AND** it renders with that type's colour and icon

#### Scenario: A place established as worth seeing

- **WHEN** a marker is classified as somewhere worth seeing without a more
  specific kind being established
- **THEN** it does not take the fallback type
- **AND** it is distinguishable from a marker about which nothing was determined

#### Scenario: Types are not user data

- **WHEN** a person uses either application
- **THEN** there is no interface for creating, renaming, or deleting a type

#### Scenario: A type's icon is inspected in the shared package

- **WHEN** the shared type list is read
- **THEN** each type carries a name identifying its icon
- **AND** nothing in the shared package can be rendered as an icon without an
  application resolving it first

### Requirement: A retired type identifier resolves to the type that replaced it

The stored type is unconstrained text and rows exist that were written by earlier
builds. The shared package SHALL hold a table mapping every identifier it has ever
defined to a currently defined type, and SHALL resolve a stored value through that
table before applying the fallback.

A retired identifier SHALL NOT reach the fallback. Resolving a retired identifier
through the fallback loses the meaning a person recorded, and does so silently: a
saved temple would render as an unclassified place, which raises no error, fails
no typecheck, and is visible only by recognising that a map looks wrong.

The mapping SHALL be defined once in the shared package and SHALL be the only
answer to what a stored identifier means, so that the two applications and the
geocoder cannot disagree.

Resolution SHALL happen on read. No stored value SHALL be rewritten, and the
mapping SHALL be permanent rather than transitional — a row may carry a retired
identifier indefinitely.

A stored value that was never a defined identifier SHALL still take the fallback,
and SHALL still render.

#### Scenario: A marker saved by an earlier build

- **WHEN** a marker whose stored type is `temple` is rendered
- **THEN** it renders as `culture`
- **AND** it does not render as the fallback type

#### Scenario: An identifier that was never defined

- **WHEN** a marker's stored type matches no identifier the system has ever defined
- **THEN** it takes the fallback type
- **AND** it is not omitted from the map

#### Scenario: A retired identifier is checked against the table

- **WHEN** the set of identifiers the system has ever defined is enumerated
- **THEN** every one of them resolves to a currently defined type
- **AND** none of them reaches the fallback by omission

#### Scenario: Reading does not write

- **WHEN** a marker carrying a retired identifier is read and rendered
- **THEN** the stored value is unchanged
- **AND** an older build reading the same row still renders it
