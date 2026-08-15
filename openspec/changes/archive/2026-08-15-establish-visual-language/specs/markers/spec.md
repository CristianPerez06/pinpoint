## MODIFIED Requirements

### Requirement: Marker type is a code-defined value with a bounded set of display families

The system SHALL define the available marker types in shared code rather than as
user-editable data, and SHALL expose them from a shared package consumed by both
applications.

Each type SHALL carry an icon identifier and SHALL belong to exactly one display
family. Family SHALL determine colour; type SHALL determine icon. The set of families
SHALL remain small enough that they stay distinguishable at a glance, and SHALL NOT
grow when a type is added — a new type SHALL be assigned to an existing family.

The icon identifier SHALL name an icon rather than being one. The shared package
SHALL NOT hold a glyph, a character, or a drawable that either application renders
directly; each application SHALL map the identifier to an icon from its own platform's
icon set. Identifiers SHALL be stable, because they are the contract between the
shared type list and two separate icon mappings.

The initial families SHALL be: see, eat, buy, sleep, and move.

Every marker SHALL have a type. A marker whose type cannot be determined SHALL take a
defined fallback type rather than none, so that no marker is unrenderable.

#### Scenario: A new type is added

- **WHEN** a type is added to the shared list
- **THEN** it is assigned to one of the existing families
- **AND** no new colour is introduced
- **AND** both applications pick it up without either being edited

#### Scenario: A type cannot be determined

- **WHEN** a marker is created without a determinable type
- **THEN** it takes the fallback type
- **AND** it renders with that type's family colour and icon

#### Scenario: Types are not user data

- **WHEN** a person uses either application
- **THEN** there is no interface for creating, renaming, or deleting a type

#### Scenario: A type's icon is inspected in the shared package

- **WHEN** the shared type list is read
- **THEN** each type carries a name identifying its icon
- **AND** nothing in the shared package can be rendered as an icon without an
  application resolving it first
