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

When the city chosen in the form has a second currency, the form SHALL show a second
price field directly under the price in US dollars, labelled with that currency's code
(`Price (JPY)`), and SHALL say beside it that the amount is typed as seen and is not
converted. When the chosen city has no second currency, or no city is chosen, the form
SHALL show no second field. The field SHALL follow the city chosen in the form as it
changes, before anything is saved.

Both price fields SHALL be optional, and SHALL be independent: changing one SHALL NOT
change the other. Turning `Free` on SHALL empty and show as unavailable both fields, and
going into either field SHALL turn `Free` off. Saving a 0 in either field SHALL record the
place as free, with no amount in either currency.

A form opened on a place with a local price SHALL show it in the second field. When the
city chosen in the form would clear a local price the place already has — a city with a
different second currency, one with none, or no city — the form SHALL say so beside the
price fields, naming the amount that saving will clear, before it is saved. Choosing the
original city again SHALL restore the amount, because nothing is cleared until the place
is saved.

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

#### Scenario: A place in a city with a second currency

- **WHEN** a person fills in the form for a place filed under a city whose second
  currency is JPY
- **THEN** the form shows `Price (USD)` and, under it, `Price (JPY)`
- **AND** either, both or neither can be filled in and saved

#### Scenario: A place in a city without a second currency

- **WHEN** a person fills in the form for a place filed under a city with no second
  currency, or under no city
- **THEN** the form shows `Price (USD)` and `Free` only

#### Scenario: Editing a place with both amounts

- **WHEN** a person opens the form on a place with a price of 25 and a local price of
  3800, and changes the price to 30
- **THEN** saving records a price of 30
- **AND** the local price is still 3800

#### Scenario: Free empties both fields

- **WHEN** a person has typed amounts in both price fields and then turns on `Free`
- **THEN** both fields are emptied and shown as unavailable
- **AND** saving records the place as free, with no amount in either currency

#### Scenario: A 0 is typed as the local price

- **WHEN** a person types 0 in the second price field and saves
- **THEN** the place is recorded as free
- **AND** its card shows `Free`, not an amount

#### Scenario: A place is moved to a city with a different currency

- **WHEN** a person editing a place with a local price of 3800 in a JPY city chooses a
  city whose second currency is KRW
- **THEN** the second field is labelled `Price (KRW)` and is empty
- **AND** the form says that saving will clear `JPY 3,800`
- **AND** choosing the original city again shows `3800` in `Price (JPY)`


### Requirement: A city can be renamed and removed

Any member of a trip SHALL be able to change a city's name after it has been created,
and SHALL be able to remove a city. A city SHALL have no settings other than its name and
an optional second currency. Creating or editing one SHALL ask for nothing else, on every
application. That includes creating one from within the place form. The second currency
SHALL be optional wherever it is asked for, SHALL be chosen by searching a list by code or
name, and SHALL be removable when editing.

Changing or removing a city's second currency SHALL require an explicit confirmation
when any marker filed under that city has a local price. The confirmation SHALL name how
many markers lose their local price, and SHALL say that their prices in US dollars stay.
When no marker has a local price, the change SHALL be saved without asking.

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
unassign, because the consequence falls on records the person is not looking at. When
some of those markers have a local price, the same confirmation SHALL also name how many
lose it, and SHALL say that their prices in US dollars stay.

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
- **THEN** they are asked for its name and, optionally, a second currency

#### Scenario: A city is created from the place form with a second currency

- **WHEN** a person creates a city named Seoul with the second currency KRW from within
  the place form
- **THEN** the place form shows `Price (KRW)` straight away
- **AND** nothing already typed in the form is lost

#### Scenario: Removing a second currency that places use

- **WHEN** a member removes JPY from a city where 4 markers have a local price
- **THEN** they are asked to confirm first
- **AND** the confirmation says that 4 places lose their JPY price and that their USD
  prices stay

#### Scenario: Changing a second currency that places use

- **WHEN** a member changes a city's second currency from JPY to KRW while 4 of its
  markers have a local price
- **THEN** they are asked to confirm first
- **AND** the confirmation says that those 4 places lose their JPY price rather than
  have it converted

#### Scenario: Changing a second currency that no place uses

- **WHEN** a member changes or removes a city's second currency and no marker filed under
  it has a local price
- **THEN** the change is saved without a confirmation

#### Scenario: A city is removed

- **WHEN** a member confirms removing a city that holds markers
- **THEN** the confirmation states how many markers will become unassigned
- **AND** those markers remain among the trip's markers afterwards

#### Scenario: A city whose places have local prices is removed

- **WHEN** a member removes a city holding 9 markers, 4 of which have a local price in JPY
- **THEN** the confirmation states that 9 places become unassigned
- **AND** it states that 4 of them lose their JPY price and that their USD prices stay

