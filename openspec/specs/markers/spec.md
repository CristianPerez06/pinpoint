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

### Requirement: A retired type identifier resolves to the type that replaced it

The stored type is unconstrained text and rows exist that were written by earlier
builds. The shared package SHALL hold a table mapping every identifier it has ever
defined to a currently defined type, and SHALL resolve a stored value through that
table before applying the fallback.

A retired identifier SHALL NOT reach the fallback. Resolving a retired identifier
through the fallback loses the meaning a person recorded, and does so silently: a
saved castle would render as an unclassified place, which raises no error, fails
no typecheck, and is visible only by recognising that a map looks wrong.

The mapping SHALL be defined once in the shared package and SHALL be the only
answer to what a stored identifier means, so that the two applications and the
geocoder cannot disagree.

An identifier that names a currently defined type SHALL NOT appear in the
mapping. A live identifier resolves to itself, and an entry claiming otherwise
would be a standing assertion that it means something else — which the
completeness check above cannot detect, because such an entry satisfies it.

Resolution SHALL happen on read. No stored value SHALL be rewritten, and the
mapping SHALL be permanent rather than transitional — a row may carry a retired
identifier indefinitely.

A stored value that was never a defined identifier SHALL still take the fallback,
and SHALL still render.

#### Scenario: A marker saved by an earlier build

- **WHEN** a marker whose stored type is `castle` is rendered
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

#### Scenario: A retired identifier is defined again

- **WHEN** an identifier that was previously retired names a type the system
  offers again
- **THEN** it resolves to that type rather than to the one it was retired into
- **AND** it does not appear in the mapping of retired identifiers

#### Scenario: Reading does not write

- **WHEN** a marker carrying a retired identifier is read and rendered
- **THEN** the stored value is unchanged
- **AND** an older build reading the same row still renders it

### Requirement: A marker may carry the date it is planned for

A marker SHALL support an optional date, naming the day the place is planned for. It
SHALL be a calendar date and SHALL NOT carry a time of day.

A marker SHALL carry at most one date. A marker with no date SHALL be valid, SHALL
remain visible and addressable, and SHALL be distinguishable from one whose date has
been chosen — the absence of a date means the decision has not been made, which is not
the same as any particular day.

A marker's date SHALL be independent of the trip's dates, and SHALL be able to fall
outside them. The store SHALL NOT reject a date on those grounds and SHALL NOT adjust it.

A marker's date SHALL be independent of the city it is filed under. Neither SHALL
constrain, derive, or default the other.

Rationale for the last part: a city and a date are two groupings of one set of places,
sitting beside each other rather than one inside the other. A date that had to agree
with a city would make the day a level underneath the city, which is the arrangement
this product has decided against — a place can be "Kyōto" and "Thursday", and a day trip
that crosses a city boundary is an ordinary thing to plan.

#### Scenario: A marker is created without a date

- **WHEN** a marker is created with no date
- **THEN** it is valid
- **AND** the date is recorded as absent rather than as a placeholder value

#### Scenario: A date outside the trip's dates

- **WHEN** a marker is given a date falling before a trip's start date or after its end date
- **THEN** it is stored as given
- **AND** it is neither rejected nor adjusted

#### Scenario: A date on a trip that has none

- **WHEN** a marker on a trip carrying no dates of its own is given a date
- **THEN** it is stored
- **AND** the trip is not required to have dates first

#### Scenario: A date and a city do not constrain each other

- **WHEN** a marker is given a date, and is filed under a city whose other markers carry
  different dates
- **THEN** both the date and the city are stored as given
- **AND** neither is changed on account of the other
