## ADDED Requirements

### Requirement: A candidate carries the place name of the city it is in

Every candidate SHALL carry, as a field of its own, the name the geocoding service gave for
the city the place is in, or nothing where the service gave none.

It SHALL be carried in addition to the display context, not extracted from it. The context
exists to tell four identically-named coffee shops apart and joins several parts into one
string for reading; a name that is going to be offered as a city to create has to be the
city alone.

What this name is for is decided in `marker-capture`: it selects a city of that name where
the trip holds one, it names a city offered for creation where it does not, and where it
matches nothing the place is decided by position instead. This capability's obligation is
only to carry it faithfully.

Carrying it faithfully includes carrying it **unaltered**. It SHALL NOT be trimmed to a
shorter form, corrected against any list, or reconciled with anything else the service
returned. A name adjusted here would be compared against the trip's cities in
`marker-capture` and offered as a city to create, so an improvement made in passing becomes
a city named something the service never said.

A candidate SHALL NOT be withheld, reordered, or marked because of this name, or because of
what it is or is not near. What search returns and how it ranks are unchanged.

Where the service reported no city, the candidate SHALL carry nothing rather than a
substitute drawn from a wider area. A county or a state offered as a city to create would
produce a group nobody meant to make, named after something that is not a city.

#### Scenario: A candidate in a named city

- **WHEN** the geocoding service reports a city for a candidate
- **THEN** the candidate carries that name as its own field
- **AND** the display context is unaffected

#### Scenario: A candidate the service gave no city for

- **WHEN** the service reports no city for a candidate
- **THEN** the candidate carries no city name
- **AND** no wider area is substituted for one

#### Scenario: The name does not affect what is offered

- **WHEN** candidates are returned for a query
- **THEN** none is withheld, reordered, or marked on account of its city
- **AND** the ranking is the one the service and the bias produced
