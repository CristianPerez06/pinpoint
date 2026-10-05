## MODIFIED Requirements

### Requirement: Each row says what the place is and how far

Each row SHALL show the place's type as its icon in the type's colour, the place's name,
and beneath the name the city it is filed under — and *✓ Visited* when it has been
visited. A place filed under no city SHALL say so in the city's place. The row SHALL
show the distance at its end, aligned with the distances of the other rows.

The distance SHALL be measured in a straight line. Under 1 kilometre it SHALL be written
in metres, rounded to the nearest 10; from 1 kilometre it SHALL be written in kilometres,
with one decimal under 10 and none from 10. It SHALL be written in the application's
language.

A visited place SHALL keep its position in the order and SHALL be drawn with its name
dimmed. A place more than 50 kilometres away SHALL have its distance drawn dimmed.

A name too long for the row SHALL be cut short on one line rather than wrapping. The
distance SHALL NOT be cut.

Rationale for a straight line: a distance along the streets needs a routing service, and
the free one the product uses (`place-route`) asks for at most one request a second — a
list of sixty places would take a minute to fill and would ask again whenever the person
moved. A straight line is instant, works with no connection, and keeps the order honest;
the route to any one place is a press away from its details. Rationale for metres: on
foot, *0.3 km* is read as a calculation and *300 m* as a distance. Rationale for keeping visited places in order: a
person standing beside a place they visited yesterday still wants to know it is there,
and moving it would make the order lie about what is nearest.

#### Scenario: A row near the person

- **WHEN** a temple 350 metres away, in Kyoto, not yet visited, is listed
- **THEN** its row shows the temple icon, its name, *Kyoto*, and *350 m*

#### Scenario: A visited place

- **WHEN** a visited place is listed
- **THEN** its row says *✓ Visited* beside its city
- **AND** its name is dimmed
- **AND** it stays in its distance order

#### Scenario: A day trip away

- **WHEN** a place 34 kilometres away is listed
- **THEN** its distance reads *34 km*
- **AND** it is not dimmed
- **AND** a place 120 kilometres away has its distance dimmed

#### Scenario: A long name

- **WHEN** a place's name is longer than the row
- **THEN** the name is cut short on one line
- **AND** the distance is shown in full
