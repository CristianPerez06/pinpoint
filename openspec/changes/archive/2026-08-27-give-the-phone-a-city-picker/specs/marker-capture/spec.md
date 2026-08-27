## MODIFIED Requirements

### Requirement: A place is filed under a city chosen as it is saved

The form SHALL offer the trip's existing cities and SHALL default to the city the
person is most likely to mean, because the place being added is almost always part
of the group they are working on.

Every application SHALL offer a way to select the city being worked on, and the
form's default SHALL be that selection. Where nothing is selected, the form SHALL
default to no city.

This replaces a per-device "city most recently used" fallback, which existed only to
serve an application that could not express a city at all. Selecting a city already
carries that convenience and more: one selection defaults every subsequent save, and
also frames the map and biases search. A remembered last-used city on top of a
selection would be a second, invisible answer to a question the selection is
already answering out loud.

A person SHALL be able to create a city from within the form, without abandoning
the place they are saving. A newly created city SHALL become immediately
available and SHALL be applied to the place being saved.

A place SHALL be saveable with no city, and SHALL remain visible and addressable
rather than being hidden until it is filed.

#### Scenario: Saving with a city selected

- **WHEN** a person saves a place while a city is selected
- **THEN** the form defaults to that city
- **AND** they can change it before saving

#### Scenario: Saving with nothing selected

- **WHEN** a person saves a place while no city is selected
- **THEN** the form defaults to no city
- **AND** they can choose one before saving

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

Editing a city SHALL NOT require that city to be selected first. Selecting and editing
are independent: selecting changes what is being worked on and moves the camera, and
editing SHALL do neither. Requiring selection first means a correction cannot be made
without taking the view away from wherever the person was, and means no city can be
corrected at all while the whole trip is being viewed.

Where an application lists a trip's cities, each SHALL be shown with its name, how
many markers are filed under it, and its currency — with the absence of a currency
stated rather than left blank. The count is what makes removal legible a moment before
it is confirmed, and it is the more useful of the two when choosing which group to work
on.

Changing a city's currency SHALL NOT alter any stored price amount. Removing a
city SHALL leave its markers in place, unassigned, and SHALL NOT remove them.
Removal SHALL require an explicit confirmation naming how many markers it will
unassign, because the consequence falls on records the person is not looking at.

#### Scenario: A city is renamed

- **WHEN** a member changes a city's name
- **THEN** the new name is shown wherever that city appears
- **AND** the markers filed under it stay filed under it

#### Scenario: A city is edited without being selected

- **WHEN** a member edits a city other than the one being worked on
- **THEN** the edit is applied to that city
- **AND** what is being worked on does not change
- **AND** the camera does not move

#### Scenario: A city is edited while the whole trip is being viewed

- **WHEN** a member edits a city while no city is selected
- **THEN** the edit is applied
- **AND** no city becomes selected as a result

#### Scenario: A city is listed

- **WHEN** an application lists a trip's cities
- **THEN** each is shown with its name, the number of markers filed under it, and its
  currency
- **AND** a city with no currency says so rather than showing nothing

#### Scenario: A currency is set after the fact

- **WHEN** a member sets a currency on a city that had none
- **THEN** the prices of the markers filed under it are presented in that currency
- **AND** no stored amount is changed

#### Scenario: A city is removed

- **WHEN** a member confirms removing a city that holds markers
- **THEN** the confirmation states how many markers will become unassigned
- **AND** those markers remain among the trip's markers afterwards
- **AND** they are grouped as unassigned
