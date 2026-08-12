## Purpose

Define how a place gets onto a trip's map and how it is changed afterwards: the
two ways of starting, the unsaved marker they both produce, the fields captured
when it is saved, and editing and removing a marker once it exists.

## ADDED Requirements

### Requirement: A place can be added by searching or by pointing at the map

The system SHALL provide two ways to begin adding a place: choosing a candidate
returned by place search, and pointing at a position on the map. Both SHALL
produce the same unsaved marker, and both SHALL lead to the same form.

Pointing at the map SHALL require the person to arm that mode deliberately
beforehand. Panning, zooming, and selecting an existing marker SHALL never create
anything.

Pointing is not a fallback for search failing. Places that are small, new, or
known locally by a name the map data does not carry are frequently unfindable by
name, so for some kinds of place — food especially — pointing is expected to be
the ordinary path.

#### Scenario: A candidate is chosen from search

- **WHEN** a person chooses a candidate returned by search
- **THEN** an unsaved marker appears at that candidate's position
- **AND** the form opens with the candidate's name already filled in

#### Scenario: A position is chosen on the map

- **WHEN** a person arms the drop mode and points at a position
- **THEN** an unsaved marker appears at that position
- **AND** the form opens with no name filled in

#### Scenario: The map is used without arming the drop mode

- **WHEN** a person pans, zooms, or selects an existing marker without arming
- **THEN** no unsaved marker is created

#### Scenario: The drop mode is armed and then abandoned

- **WHEN** a person arms the drop mode and then cancels it
- **THEN** no marker is created
- **AND** the map returns to its ordinary behaviour

### Requirement: An unsaved marker can be repositioned and costs nothing to abandon

An unsaved marker SHALL be movable, and the position it is left at SHALL be the
position stored when it is saved.

Nothing SHALL be stored until the person saves. Abandoning an unsaved marker
SHALL leave the trip exactly as it was.

Repositioning exists because both entry paths land imprecisely: a geocoded result
is placed where the map data says the place is, which is often the building's
centroid or its administrative address rather than its door, and a pointed
position is placed wherever a finger or cursor landed.

#### Scenario: An unsaved marker is moved before saving

- **WHEN** a person moves an unsaved marker and then saves
- **THEN** the stored position is where they left it
- **AND** not where it first appeared

#### Scenario: An unsaved marker is abandoned

- **WHEN** a person dismisses the form without saving
- **THEN** nothing is stored
- **AND** the trip's markers are unchanged

#### Scenario: A geocoded position is slightly wrong

- **WHEN** a candidate is placed away from where the person knows the place to be
- **THEN** they can correct the position before saving
- **AND** no separate correction step is needed afterwards

### Requirement: Saving a place captures its name, note, city, type, link, and price

One form SHALL capture a place's name, note, city, type, link, and price, and the
same form SHALL be used when editing an existing marker.

A name and a position SHALL be required. Every other field SHALL be optional, and
an optional field left blank SHALL be recorded as absent rather than as empty
text.

When a submission is rejected, the system SHALL name the offending field and SHALL
preserve everything the person typed. A rejection SHALL NOT discard the unsaved
marker or its position.

On success the saved place SHALL appear among the trip's markers without the
person having to reload or navigate away.

#### Scenario: Saving with only the required fields

- **WHEN** a person saves a place with a name and a position and nothing else
- **THEN** it is stored
- **AND** it appears among the trip's markers

#### Scenario: Optional fields left blank

- **WHEN** a person saves a place leaving the note, link, and price blank
- **THEN** those fields are recorded as absent
- **AND** they are not recorded as empty text

#### Scenario: A submission is rejected

- **WHEN** a person saves a place with no name
- **THEN** the submission is rejected
- **AND** the rejection names the name field
- **AND** the other values they typed and the marker's position are preserved

#### Scenario: A place is saved successfully

- **WHEN** saving succeeds
- **THEN** the place is drawn on the map as an ordinary marker
- **AND** the person is not made to reload the trip to see it

### Requirement: A place is filed under a city chosen as it is saved

The form SHALL offer the trip's existing cities and SHALL default to the city
currently selected, because the place being added is almost always part of the
group the person is working on.

A person SHALL be able to create a city from within the form, without abandoning
the place they are saving. A newly created city SHALL become immediately
available and SHALL be applied to the place being saved.

A place SHALL be saveable with no city, and SHALL remain visible and addressable
rather than being hidden until it is filed.

#### Scenario: Saving with a city selected

- **WHEN** a person saves a place while a city is selected
- **THEN** the form defaults to that city
- **AND** they can change it before saving

#### Scenario: Creating a city while saving a place

- **WHEN** a person creates a city from within the form
- **THEN** the city is created on the current trip
- **AND** it is selected for the place being saved
- **AND** the place they were adding is not lost

#### Scenario: Saving with no city

- **WHEN** a person saves a place without choosing a city
- **THEN** it is stored
- **AND** it appears among the trip's markers, grouped as unassigned

#### Scenario: The trip has no cities yet

- **WHEN** a person saves the first place on a trip that has no cities
- **THEN** they can save it unassigned
- **AND** they can create the trip's first city without leaving the form

### Requirement: A city can be renamed, given a currency, and removed

Any member of a trip SHALL be able to change a city's name and its currency after
it has been created, and SHALL be able to remove a city.

A city created while saving a place is created with whatever was known at that
moment, which is frequently just a name. Without a way to change it afterwards, a
city typed in a hurry is permanent, and a currency not chosen at creation can
never be chosen at all.

Changing a city's currency SHALL NOT alter any stored price amount. Removing a
city SHALL leave its markers in place, unassigned, and SHALL NOT remove them.
Removal SHALL require an explicit confirmation naming how many markers it will
unassign, because the consequence falls on records the person is not looking at.

#### Scenario: A city is renamed

- **WHEN** a member changes a city's name
- **THEN** the new name is shown wherever that city appears
- **AND** the markers filed under it stay filed under it

#### Scenario: A currency is set after the fact

- **WHEN** a member sets a currency on a city that had none
- **THEN** the prices of the markers filed under it are presented in that currency
- **AND** no stored amount is changed

#### Scenario: A city is removed

- **WHEN** a member confirms removing a city that holds markers
- **THEN** the confirmation states how many markers will become unassigned
- **AND** those markers remain among the trip's markers afterwards
- **AND** they are grouped as unassigned

### Requirement: A marker can be edited and removed by any member of the trip

Any member of a trip SHALL be able to edit and to remove any of that trip's
markers, reached from the surface that shows what was recorded about it. Editing
SHALL offer the same fields as creating, filled in with what is stored.

Removing SHALL require an explicit confirmation, and the person SHALL be told
that it cannot be undone, because it cannot.

When two members edit the same marker, neither edit SHALL be rejected and no
conflict SHALL be raised: the later write is what is stored. Two travellers
planning one trip do not need reconciliation machinery, and the cost of guessing
wrong is retyping one field.

#### Scenario: Editing a marker

- **WHEN** a person edits a marker
- **THEN** they are offered the same fields as when it was created
- **AND** each is filled in with what is currently stored

#### Scenario: Removing a marker

- **WHEN** a person asks to remove a marker
- **THEN** they are asked to confirm
- **AND** they are told the removal cannot be undone

#### Scenario: A removal is confirmed

- **WHEN** a person confirms a removal
- **THEN** the marker no longer appears on the map
- **AND** it is no longer among the trip's markers

#### Scenario: Two members edit the same marker

- **WHEN** two members save edits to the same marker
- **THEN** neither save is rejected
- **AND** the marker holds what the later save wrote

### Requirement: Capture is offered by the web application only

The mobile application SHALL NOT offer adding, editing, or removing a marker. It
SHALL remain able to read everything the web application writes.

Planning happens at a laptop; the mobile application exists for standing in a
street during the trip. Building a second full capture surface would cost as much
as the first and serve a moment that does not arise.

This SHALL be a property of the applications and SHALL NOT be a property of the
shared code. The behaviour that writes a marker SHALL be usable from either
application without change, so that offering capture on mobile later is a change
to one application rather than a reimplementation.

#### Scenario: Using the mobile application

- **WHEN** a person opens a trip on mobile
- **THEN** there is no way to add, edit, or remove a marker
- **AND** every marker written from the web application is readable

#### Scenario: Mobile capture is wanted later

- **WHEN** adding places from mobile becomes worth building
- **THEN** the existing shared write behaviour is reused
- **AND** it is not reimplemented for the second platform
