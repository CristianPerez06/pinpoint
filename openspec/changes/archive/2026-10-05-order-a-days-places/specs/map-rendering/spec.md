## ADDED Requirements

### Requirement: A map narrowed to one day numbers its pins in that day's order

Where the trip is narrowed to **exactly one day**, each pin on the map SHALL draw its
place's position in that day's order — `1`, `2`, `3` — in place of its type icon, so the
day's plan reads from the map at a glance. The position SHALL be the one the calendar
shows for that place on that day.

This is the one case in which a marker does not draw its type's icon, and it changes
nothing else about the pin: its colour SHALL still be its type's colour, its shape and
anchor SHALL be unchanged, a visited place SHALL still be drawn visited, and a selected
place SHALL still be drawn selected. The number SHALL be drawn where the icon is drawn and
in the colour the icon is drawn in — the marker foreground on a solid pin, the type's colour
on a visited one — and SHALL fit inside the pin at two digits.

Rationale for drawing it straight on the pin's colour, chosen from a mock against a version
that set the number on a disc of the ground's colour: it keeps the pin reading as the same
pin with a number in it. The cost is known and accepted — on the light ground the two grey
types reach about 3.6:1 against the white number, under the 4.5:1 that text otherwise
needs; every other type and the whole dark ground clear it.

The position SHALL be counted among **all** the places on that day, as the calendar
counts them, and not among only those the map is currently showing. Where another
narrowing hides some of the day's places, the pins left SHALL keep their own numbers, so
a gap reads as a place hidden rather than as the plan changing.

Where several of the day's places share one drawn point, that point SHALL show the
lowest of their positions, alongside the count it already carries.

Where the trip is narrowed to several days, to the places carrying no day, or not by day
at all, pins SHALL be drawn exactly as they are without this rule. A number with several
days chosen would have more than one meaning, and a place carrying no day has no position
to show.

A place's spoken name on the map SHALL include its position wherever its pin draws one,
so the number is not a signal that survives only on screen.

The map SHALL offer no way to change the order. It shows the order the calendar sets.

#### Scenario: One day chosen

- **WHEN** the map is narrowed to one day holding three places
- **THEN** their pins show 1, 2 and 3 in the calendar's order for that day
- **AND** each keeps its type's colour

#### Scenario: Two days chosen

- **WHEN** the map is narrowed to two days
- **THEN** every pin shows its type icon

#### Scenario: No day chosen

- **WHEN** the map is not narrowed by day
- **THEN** every pin shows its type icon

#### Scenario: Places carrying no day

- **WHEN** the map is narrowed to the places carrying no day
- **THEN** every pin shows its type icon

#### Scenario: Another narrowing hides a place on the day

- **WHEN** the map is narrowed to one day of four places and a second narrowing hides the
  second of them
- **THEN** the pins shown read 1, 3 and 4

#### Scenario: A place planned for several days

- **WHEN** the map is narrowed to the 4th, and a place planned for the 3rd through the
  6th is second on the 4th
- **THEN** its pin shows 2

#### Scenario: A visited place on the chosen day

- **WHEN** a visited place is first on the chosen day
- **THEN** its pin shows 1, drawn in the visited form

#### Scenario: Two digits

- **WHEN** a day holds twelve places and the map is narrowed to it
- **THEN** the twelfth pin shows 12 inside the pin, legible on both themes

#### Scenario: The order changes in the calendar

- **WHEN** a day's order is changed in the calendar and the map is narrowed to that day
- **THEN** the pins show the new order
