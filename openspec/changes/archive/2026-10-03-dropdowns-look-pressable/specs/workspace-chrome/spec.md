## ADDED Requirements

### Requirement: A control shaped like its value looks pressable at rest

A control that opens a choice and shows the value currently chosen — the trip, the
city, and each question in Filter — SHALL be drawn on a fill that sets it apart from
the surface around it while nothing is touching it, on both applications and on both
grounds. The arrow it carries SHALL stay, and SHALL NOT be the only sign that it can
be pressed.

The fill SHALL be the one fields are drawn on, so that a thing a person sets reads as
one family. Its lettering SHALL clear the text contrast floor against that fill. Where
a pointer can rest on the control, resting on it and the control being open SHALL each
be distinguishable from rest.

Rationale: these controls read as text — a title, a caption, a list — and a label that
opens something and looks like a label is a control nobody finds. A fill was chosen over
an outline: the map already draws many lines, and the outline colour is itself below
the non-text floor (#124).

#### Scenario: The header's choosers at rest

- **WHEN** the workspace is open on the phone or the laptop, on either ground
- **THEN** the trip's name and the city's name each sit on a visible fill
- **AND** each still carries its arrow

#### Scenario: Filter's questions at rest

- **WHEN** Filter is opened on the phone or the laptop
- **THEN** Wanted by, Kind of place and Day each sit on a visible fill

#### Scenario: Rest, hover and open on the laptop

- **WHEN** the pointer rests on the trip's name, and then the trip's menu is opened
- **THEN** both states are distinguishable from the control at rest

#### Scenario: A declared narrowing is still declared

- **WHEN** a Filter question is narrowing the trip
- **THEN** its value is still said in the accent and a heavier weight, readable on the fill
