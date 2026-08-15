# markers Specification

## Purpose

Define the saved-place model: a marker is somewhere a traveller wants to go, positioned
on the map. Cities group markers coarsely, for deciding which day is spent where; the
map itself answers the finer question of what is close to what, which is the job a
"neighbourhood" column does badly. Types give the map its legibility, and per-member
interest records who actually wants to go.

## Requirements

### Requirement: A marker is a named place with a position on a trip

The system SHALL model a marker with a name, a longitude and a latitude, and the trip it
belongs to. Longitude SHALL be within -180 to 180 and latitude within -90 to 90.

A marker SHALL additionally support an optional free-text note, an optional link, and an
optional price.

The link exists because a saved place is usually found somewhere — a video, an article,
a recommendation — and months later "why did we save this" is answered better by the
source than by a description.

#### Scenario: A marker is created

- **WHEN** a marker is created with a name, a position, and a trip
- **THEN** it is stored and appears among that trip's markers

#### Scenario: A position outside the valid range

- **WHEN** a marker is submitted with a longitude or latitude outside the valid range
- **THEN** it is rejected
- **AND** the rejection names the offending field

#### Scenario: The optional fields are omitted

- **WHEN** a marker is created without a note, a link, or a price
- **THEN** it is valid
- **AND** those fields are recorded as absent rather than as empty text

### Requirement: Cities group markers within a trip, and grouping is optional

The system SHALL model a city as a named grouping that belongs to a trip. A marker SHALL
reference at most one city.

A city SHALL belong to exactly one trip, and SHALL NOT be shared between trips. Two trips
visiting the same place SHALL each have their own city record, so that renaming or
removing one never affects the other.

A marker SHALL be valid with no city. Markers without one SHALL remain visible and
addressable rather than being hidden until they are filed.

#### Scenario: A marker is created without a city

- **WHEN** a marker is created with no city
- **THEN** it is valid
- **AND** it appears among the trip's markers, grouped as unassigned

#### Scenario: The same place name across two trips

- **WHEN** two trips each have a city with the same name
- **THEN** they are separate records
- **AND** renaming one leaves the other unchanged

#### Scenario: A city is removed while it still has markers

- **WHEN** a city that markers reference is removed
- **THEN** those markers remain
- **AND** they become unassigned rather than being removed with the city

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

### Requirement: Interest is recorded per member; visited is recorded for the trip

The system SHALL record interest in a marker per member — each person on the trip
independently indicates whether they want to go — and SHALL NOT collapse it to a single
flag on the marker.

A member SHALL have at most one interest record per marker. The absence of a record SHALL
mean undecided, which is distinct from not interested.

The system SHALL record whether a marker has been visited as a single value on the
marker, shared by everyone on the trip, because travelling companions visit a place
together.

#### Scenario: Two members disagree

- **WHEN** one member marks interest in a marker and the other marks disinterest
- **THEN** both records are stored
- **AND** neither overwrites the other

#### Scenario: Undecided is distinguishable from not interested

- **WHEN** a member has expressed nothing about a marker
- **THEN** their state is undecided
- **AND** it is distinguishable from a recorded lack of interest

#### Scenario: A marker is marked visited

- **WHEN** any member of the trip marks a marker visited
- **THEN** it is visited for everyone on the trip
- **AND** there is no per-member visited state

### Requirement: A city declares the currency its markers' prices are in

A city SHALL support an optional currency. A marker's price SHALL be interpreted
in the currency of the city it is filed under, and SHALL be presented with it
wherever the price is shown.

A marker with no city, or filed under a city that declares no currency, SHALL have
its price presented as a bare amount. The system SHALL NOT assume a currency, and
SHALL NOT fall back to one declared elsewhere: a price shown in the wrong currency
is worse than a price shown in none, because it looks correct.

Moving a marker to a city with a different currency SHALL reinterpret the price
and SHALL NOT convert the stored amount. Amounts are what someone typed off a menu
or a ticket price; converting them would invent precision and would go stale.

The currency belongs to the city rather than to the trip so that one trip can
cross a border, and to the city rather than to each marker so that it is stated
once instead of on every place saved.

#### Scenario: A price under a city with a currency

- **WHEN** a marker with a price is filed under a city that declares a currency
- **THEN** the price is presented in that currency
- **AND** both applications present it the same way

#### Scenario: A price under a city with no currency

- **WHEN** a marker with a price is filed under a city that declares no currency
- **THEN** the price is presented as a bare amount
- **AND** no currency is assumed for it

#### Scenario: A price on an unassigned marker

- **WHEN** a marker with a price is filed under no city
- **THEN** the price is presented as a bare amount
- **AND** the marker remains visible and addressable

#### Scenario: A marker is refiled under a different currency

- **WHEN** a marker is moved from a city declaring one currency to a city declaring another
- **THEN** the stored amount is unchanged
- **AND** it is presented in the new city's currency

### Requirement: A marker's city belongs to the same trip as the marker

The system SHALL reject a marker that references a city belonging to a different
trip. This SHALL be enforced by the store itself and not only by the code that
writes markers, because more than one application writes and the trip is the
single boundary every access rule resolves to.

A marker whose city reference is rejected SHALL NOT be stored at all, rather than
being stored unassigned. Silently dropping the city would file a place somewhere
the person did not choose and give no sign of it.

#### Scenario: A marker references another trip's city

- **WHEN** a marker on one trip is submitted referencing a city belonging to another
- **THEN** it is rejected
- **AND** no marker is stored

#### Scenario: A write bypasses the application

- **WHEN** such a marker is written directly to the store, without passing through the applications
- **THEN** the store refuses it
- **AND** the refusal does not depend on which client issued the write
