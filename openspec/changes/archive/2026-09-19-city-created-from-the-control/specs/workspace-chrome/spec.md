## MODIFIED Requirements

### Requirement: The city being worked in is named beside the trip it narrows

The workspace SHALL display which city is being worked in, and that display SHALL be
the control that changes it. It SHALL be placed with the trip's name — beside it or
directly under it — rather than among the controls used throughout a session, because a
city is a narrowing of the trip and reads as one only when it stands where the trip
does.

When no city is selected, the display SHALL name that state in the vocabulary of the
product rather than standing empty, so that a reader is told the whole trip is in view
instead of being shown a control with nothing in it.

The control SHALL also be where a city is **made**. Every application SHALL offer a way to
create a city from it, asking for the city's name and, where it has one, the second
currency `markers` already lets a city carry — the same two the place form collects when
it creates one, and the same two this control already lets a person change afterwards.
Creating SHALL go through the same path the place form uses, so that two routes cannot
produce differently-formed cities.

A city created this way SHALL **not** become the city being worked in. It SHALL join the
list and the view SHALL be left as it was.

Rationale: selecting a city frames the map on that city's places, and a city just created
has none — `marker-capture` states that a city holding no markers claims nothing, because
there is nothing to measure from. Switching to it would put its name over a map showing
none of it, which reads as something having failed rather than as something having been
made. The reason to make a city before its first place is that `marker-capture` already
files a searched place under a city of the name the geocoding service reported, whether or
not that city holds any places yet — so naming the cities of a trip in advance is what
makes filing correct from the first place saved, and it does not require looking at any of
them.

Where the list of cities is longer than the room available, the way to create one SHALL
remain reachable without scrolling to the end of that list.

The control SHALL NOT describe a city as something that can only come from saving a place.

This SHALL NOT make the control a filter. Selecting a city frames the map, biases search,
and does not hide the trip's other places — unchanged by this requirement.

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

#### Scenario: A city is created from the control

- **WHEN** a person creates a city from the city control
- **THEN** it is created on the current trip
- **AND** it appears in the list of cities
- **AND** the city being worked in is unchanged
- **AND** the map is not moved

#### Scenario: A city is created with a second currency

- **WHEN** a person creates a city from the control and gives it a second currency
- **THEN** the city carries that currency
- **AND** places filed under it can hold a price in it, as they can for a city created
  while saving a place

#### Scenario: A city created here catches the places the geocoder reports there

- **WHEN** a person creates a city named for somewhere the trip is going, before any place
  is saved there
- **AND** they then save a searched place the geocoding service reports as being in that
  city
- **THEN** the form defaults to the city they created

#### Scenario: A trip with no cities

- **WHEN** a person opens the city control on a trip that has no cities
- **THEN** it offers a way to create one
- **AND** it does not say that a city can only come from saving a place

#### Scenario: A refused creation

- **WHEN** creating a city from the control is refused
- **THEN** the refusal is said in the product's own words and names the field at fault
- **AND** what was typed is not lost

#### Scenario: More cities than the control can show at once

- **WHEN** a trip holds more cities than fit the control's room
- **THEN** the way to create one is still reachable without scrolling past every city
- **AND** a long city name does not push it out of reach

#### Scenario: Both applications offer it

- **WHEN** the city control is opened on the laptop and on the phone
- **THEN** both offer a way to create a city
- **AND** both ask for the same things
