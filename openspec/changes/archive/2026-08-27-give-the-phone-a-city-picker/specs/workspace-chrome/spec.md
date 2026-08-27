## ADDED Requirements

### Requirement: The city being worked in is named beside the trip it narrows

The workspace SHALL display which city is being worked in, and that display SHALL be
the control that changes it. It SHALL be placed with the trip's name — beside it or
directly under it — rather than among the controls used throughout a session, because a
city is a narrowing of the trip and reads as one only when it stands where the trip
does.

When no city is selected, the display SHALL name that state in the vocabulary of the
product rather than standing empty, so that a reader is told the whole trip is in view
instead of being shown a control with nothing in it.

Rationale: this follows the rule already in force — a rare action lives behind the name
of what it acts on — extended to the one narrowing that is not filtering. Placing it
among the session's controls would say it belongs beside finding and dropping a place,
which is the company it does not keep: it changes what is being worked on, not what is
on the map.

#### Scenario: The city being worked in is shown

- **WHEN** a trip workspace is shown
- **THEN** the city being worked in is displayed with the trip's name
- **AND** pressing it is how the city is changed

#### Scenario: Nothing is selected

- **WHEN** a trip workspace is shown and no city is selected
- **THEN** the display names that the whole trip is in view
- **AND** it is not blank

#### Scenario: The city control is not among the session's controls

- **WHEN** a trip workspace is shown
- **THEN** the city control is not placed among the controls for finding a place,
  placing one by hand, and narrowing the trip

### Requirement: On a phone-shaped screen the city takes its own line

Where the chrome takes its phone shape, the trip's name and the city's name SHALL be
given separate lines rather than dividing one line between them.

Neither name has a length anybody promised — both are typed by a person. At a phone's
width two names sharing a row leave each other roughly eleven characters, so both are
cut to stubs and neither answers its question: not "which trip is this", and not "which
part of it am I in". A laptop-shaped bar has an order of magnitude more room and may
divide one line between them.

This does not forbid shortening a name. A control of a settled width whose full value is
one press away in the list it opens is a deliberate and different thing — it keeps
everything downstream of it from moving each time the selection changes, which is why
the laptop's city control has a fixed width at every size. What this forbids is the
arrangement where *both* names are cut at once and the row answers nothing.

Rationale: this follows the rule already in force that chrome follows the shape of the
screen rather than the platform, so it binds any application whose chrome takes that
shape and not one particular application. It has an obvious test, which is why it is
stated rather than left to judgement: put a long trip name and a long city name on the
narrowest supported screen and read them.

#### Scenario: A phone-shaped screen

- **WHEN** the chrome takes its phone shape
- **THEN** the city's name is shown on its own line, under the trip's name

#### Scenario: A long name on the narrowest screen

- **WHEN** a trip whose name runs to sixty characters is shown on the narrowest
  supported screen beside a city whose name runs to twenty
- **THEN** neither name is reduced to a stub by the other

#### Scenario: A laptop-shaped bar

- **WHEN** the chrome takes its laptop shape
- **THEN** the trip's name and the city's name may share one line
- **AND** a control of a settled width may shorten the name it displays, because the
  list it opens states it in full
