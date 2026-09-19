## MODIFIED Requirements

### Requirement: Saving a place captures its name, note, city, type, link, price, and the day it is planned for

One form SHALL capture a place's name, note, city, type, link, price, and the day it
is planned for, and the same form SHALL be used when editing an existing marker.

A name and a position SHALL be required. Every other field SHALL be optional, and
an optional field left blank SHALL be recorded as absent rather than as empty
text.

The price field SHALL say that it is in US dollars. Beside it the form SHALL offer a
`Free` control, on every application. Turning `Free` on SHALL empty the price field and
show it as unavailable. Turning `Free` off again, or going into the price field, SHALL
return the field to an ordinary empty price. A price and `Free` SHALL never both be set.
Saving with `Free` on SHALL record the place as free, and saving a price of 0 SHALL do the
same. A form opened on a place that is free SHALL open with `Free` on.

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

- **WHEN** a person saves a place leaving the note, link, price, and day blank
- **THEN** those fields are recorded as absent
- **AND** they are not recorded as empty text
- **AND** the place is not recorded as free

#### Scenario: A submission is rejected

- **WHEN** a person saves a place with no name
- **THEN** the submission is rejected
- **AND** the rejection names the name field
- **AND** the other values they typed and the marker's position are preserved

#### Scenario: A place is saved successfully

- **WHEN** saving succeeds
- **THEN** the place is drawn on the map as an ordinary marker
- **AND** the person is not made to reload the trip to see it

#### Scenario: A place is marked free

- **WHEN** a person turns on `Free` and saves
- **THEN** the place is recorded as free
- **AND** its card shows `Free`

#### Scenario: Free empties the price

- **WHEN** a person has typed a price and then turns on `Free`
- **THEN** the price field is emptied and shown as unavailable
- **AND** saving records the place as free, not with the typed price

#### Scenario: Going back to a price

- **WHEN** `Free` is on and the person goes into the price field, or turns `Free` off
- **THEN** `Free` is off
- **AND** the price field is empty and can be typed into

#### Scenario: A price of 0 is typed

- **WHEN** a person types 0 as the price and saves
- **THEN** the place is recorded as free
- **AND** its card shows `Free`, not an amount

#### Scenario: Editing a free place

- **WHEN** a person opens the form on a place that is free
- **THEN** the form opens with `Free` on and the price field empty

## ADDED Requirements

### Requirement: A city can be renamed and removed

Any member of a trip SHALL be able to change a city's name after it has been created,
and SHALL be able to remove a city. A city SHALL have no setting other than its name:
creating or editing one SHALL ask for nothing else, on every application.

A city created while saving a place is created with whatever was known at that
moment. Without a way to change it afterwards, a city name typed in a hurry is
permanent.

Editing a city SHALL NOT require that city to be selected first. Selecting and editing
are independent: selecting changes what is being worked on and moves the camera, and
editing SHALL do neither. Requiring selection first means a correction cannot be made
without taking the view away from wherever the person was, and means no city can be
corrected at all while the whole trip is being viewed.

Where an application lists a trip's cities, each SHALL be shown with its name and how
many markers are filed under it. The count is what makes removal legible a moment
before it is confirmed, and it is what helps most when choosing which group to work on.

Removing a city SHALL leave its markers in place, unassigned, and SHALL NOT remove them.
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
- **THEN** each is shown with its name and the number of markers filed under it
- **AND** nothing is said about a currency

#### Scenario: A city is created or edited

- **WHEN** a member creates a city, from the place form or anywhere else, or edits one
- **THEN** they are asked only for its name

#### Scenario: A city is removed

- **WHEN** a member confirms removing a city that holds markers
- **THEN** the confirmation states how many markers will become unassigned
- **AND** those markers remain among the trip's markers afterwards

## REMOVED Requirements

### Requirement: A city can be renamed, given a currency, and removed

**Reason**: Cities no longer carry a currency; every price is in US dollars (#175).

**Migration**: Replaced by *A city can be renamed and removed*, which keeps every rule
about renaming, editing without selecting, listing with a count, and removal, and drops
only what concerned the currency.
