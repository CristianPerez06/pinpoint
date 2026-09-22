## MODIFIED Requirements

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

**The same SHALL hold for what a type is called.** The shared type list SHALL NOT hold
the words a person reads for a type; each application SHALL resolve the type's own
identifier to those words, exactly as it resolves the icon. A type SHALL therefore be
three things in the shared list — an identifier, a colour, and an icon's name — and
nothing in it SHALL be showable without an application resolving it first.

Rationale: the name was the one value in that list that a screen could draw as it
stood, and being drawable as it stands is what made it English. The type list is the
single source of what a type *is*; what it is called is a different question with a
different answer per language, and the identifier is already the contract that joins
them.

The icon SHALL reinforce what the colour already says and SHALL NOT be the only
channel separating one type from another. A person SHALL be able to tell any two
types apart without resolving a glyph.

The types SHALL be: place, temple, culture, nature, food, shopping, stay, and
transport.

Every marker SHALL have a type. A marker whose type cannot be determined SHALL
take a defined fallback type rather than none, so that no marker is unrenderable.

The fallback SHALL be `place`, and `place` SHALL mean only that nothing more was
determined. No type whose meaning a person or the geocoder actually established
SHALL resolve to the fallback, so that the fallback stays rare and a marker
carrying it is genuinely unclassified rather than merely unspecific.

#### Scenario: A type is proposed for addition

- **WHEN** a new type is proposed for the shared list
- **THEN** it requires a colour distinguishable from every existing one
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

#### Scenario: A type's name is inspected in the shared package

- **WHEN** the shared type list is read
- **THEN** it holds no words a person reads for any type

#### Scenario: A type is named on screen

- **WHEN** either application shows what a marker's type is called
- **THEN** it resolves the type's identifier to those words
- **AND** both applications show the same words for the same type

