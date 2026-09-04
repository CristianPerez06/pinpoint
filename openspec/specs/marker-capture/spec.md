# marker-capture Specification

## Purpose

Define how a place gets onto a trip's map and how it is changed afterwards: the
two ways of starting, the unsaved marker they both produce, the fields captured
when it is saved, and editing and removing a marker once it exists.
## Requirements
### Requirement: A place can be added by searching or by pointing at the map

The system SHALL provide two ways to begin adding a place: choosing a candidate
returned by place search, and indicating a position on the map. Both SHALL produce
the same unsaved position, and both SHALL lead to the same form.

Choosing a candidate SHALL begin a capture only when the current trip does not already
hold a marker at that candidate's position. Where it does, the marker already saved SHALL
be opened instead and no unsaved position SHALL be taken — see `place-search`, which
defines when a candidate counts as already saved. This narrows when the search path
produces an unsaved position; it does not change what happens once one is produced.

How a position is indicated SHALL follow the shape of the screen rather than the
platform. A pointer-driven screen indicates a coordinate directly. A screen
operated by touch MAY instead offer a fixed sight that the map is framed under,
where the position indicated is the one under the sight when the person confirms.
Both SHALL satisfy this requirement, and neither SHALL be described as a fallback
for the other.

Indicating a position SHALL require the person to arm that mode deliberately
beforehand. Panning, zooming, and selecting an existing marker SHALL never create
anything. This SHALL hold however the position is indicated: a sight that is armed
is armed, and a map being framed while nothing is armed SHALL create nothing.

Pointing SHALL always begin a capture. A position indicated on the map SHALL NOT be
matched against saved markers, because there is nothing to match: a person pointing at a
spot has stated the position themselves, and a place they meant to add beside one they
already saved is an ordinary thing to want.

Where a fixed sight is used, it SHALL be positioned at the centre of the map as
drawn rather than at the centre of the screen, so that the position taken is the
one the sight appears over.

Pointing is not a fallback for search failing. Places that are small, new, or
known locally by a name the map data does not carry are frequently unfindable by
name, so for some kinds of place — food especially — pointing is expected to be
the ordinary path.

#### Scenario: A candidate is chosen from search

- **WHEN** a person chooses a candidate returned by search
- **AND** no marker on the current trip holds that candidate's position
- **THEN** an unsaved position is taken at that candidate's position
- **AND** the form opens with the candidate's name already filled in

#### Scenario: A candidate the trip has already saved is chosen

- **WHEN** a person chooses a candidate whose position a marker on this trip already holds
- **THEN** no unsaved position is taken
- **AND** the saved marker is opened instead of the form

#### Scenario: A position is chosen on the map

- **WHEN** a person arms the drop mode and points at a position
- **THEN** an unsaved position is taken there
- **AND** the form opens with no name filled in

#### Scenario: A position is pointed at where a marker already sits

- **WHEN** a person arms the drop mode and points at a position a marker already holds
- **THEN** an unsaved position is taken there
- **AND** the form opens, as it does for any other pointed position

#### Scenario: A position is chosen by framing it under a sight

- **WHEN** a person arms the drop mode, frames the map under the sight, and confirms
- **THEN** an unsaved position is taken at the point under the sight
- **AND** the form opens with no name filled in

#### Scenario: The sight is centred on the map, not the screen

- **WHEN** a fixed sight is offered on a screen where chrome occupies part of the height
- **THEN** the position taken is the one the sight is drawn over
- **AND** it is not offset by the chrome above or below the map

#### Scenario: The map is used without arming the drop mode

- **WHEN** a person pans, zooms, or selects an existing marker without arming
- **THEN** no unsaved position is created

#### Scenario: The drop mode is armed and then abandoned

- **WHEN** a person arms the drop mode and then cancels it
- **THEN** no marker is created
- **AND** the map returns to its ordinary behaviour

### Requirement: An unsaved marker can be repositioned and costs nothing to abandon

An unsaved position SHALL be correctable before it is saved, and the position it
is left at SHALL be the position stored.

Correcting it SHALL be reachable from the form, so that a position arrived at by
either entry path can be changed without abandoning what has been typed. Returning
from a correction SHALL preserve every value already entered.

Correcting SHALL NOT be a mandatory step on either entry path. A position that is
already right SHALL be saveable without passing through a correction, because the
error a correction fixes is small and the step would be paid on every save.

Nothing SHALL be stored until the person saves. Abandoning an unsaved position
SHALL leave the trip exactly as it was.

Repositioning exists because both entry paths land imprecisely: a geocoded result
is placed where the map data says the place is, which is often the building's
centroid or its administrative address rather than its door, and an indicated
position is placed wherever a finger or cursor landed.

#### Scenario: An unsaved marker is moved before saving

- **WHEN** a person corrects an unsaved position and then saves
- **THEN** the stored position is where they left it
- **AND** not where it first appeared

#### Scenario: A correction preserves what has been typed

- **WHEN** a person has filled in the form, corrects the position, and returns
- **THEN** every value they had entered is still there
- **AND** the corrected position is the one that will be stored

#### Scenario: A position is accepted as it arrived

- **WHEN** a person saves without correcting the position
- **THEN** it is stored at the position the entry path produced
- **AND** they were not required to confirm it first

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

### Requirement: A marker can be edited and removed by any member of the trip

Any member of a trip SHALL be able to edit and to remove any of that trip's
markers, reached from the surface that shows what was recorded about it. Editing
SHALL offer the same fields as creating, filled in with what is stored.

Removing SHALL require an explicit confirmation, and the person SHALL be told
that it cannot be undone, because it cannot.

Concurrent edits are governed by "A save based on a stale read is refused" below.

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
- **THEN** the save based on the older read is refused rather than applied
- **AND** what that member typed is preserved

Note: this scenario previously asserted the opposite — that neither save is
rejected and the later write wins. That was superseded by "A save based on a stale
read is refused" below and left behind, so the two requirements contradicted each
other. It is corrected here to agree.

### Requirement: A marker records when it was last changed

Every marker SHALL carry the time it was last modified, and that value SHALL be maintained
where the data is stored rather than supplied by whoever writes.

Rationale: a value a caller supplies is a value a caller can forget, reuse or fabricate,
and the guarantee below is only worth having if it holds for every writer rather than for
the ones that remembered. It is the same reasoning that puts row-level security in the
database rather than in the interface.

#### Scenario: A marker is changed

- **WHEN** any field of a marker is modified
- **THEN** its last-changed time is updated
- **AND** the writer does not have to supply it

#### Scenario: A marker is read

- **WHEN** a marker is read
- **THEN** its last-changed time is part of what is returned

### Requirement: A save based on a stale read is refused

A request to modify a marker SHALL state the last-changed time the edit was based on. If
the marker has been modified since, the system SHALL refuse the write and SHALL NOT apply
any part of it.

The refusal SHALL be reported distinctly from a validation failure and from a permission
refusal, because the three call for different things from the person: correct what you
typed, you may not do this, and somebody else changed this while you were working.

What was entered SHALL be preserved when a save is refused this way. The person has typed
something they still want, and losing it would make the safeguard more expensive than the
problem it prevents.

The system SHALL NOT merge the two versions, and SHALL NOT choose between them. Which
version is right is a question about a trip, and answering it automatically would replace
a visible disagreement with an invisible one.

Rationale: two people editing the same place at once is ordinary for a product built for
travellers planning together. Without this, the later save wins silently — the person
whose work vanished never learns, and the person who overwrote it never knows they did.

#### Scenario: Two members edit the same marker

- **WHEN** two members read the same marker, and one saves a change
- **AND** the other then saves a change based on what they read before
- **THEN** the second save is refused
- **AND** the first member's change remains

#### Scenario: A refused save keeps what was typed

- **WHEN** a save is refused because the marker changed underneath it
- **THEN** the person is told that somebody else changed the place
- **AND** what they entered is still there

#### Scenario: An ordinary edit is unaffected

- **WHEN** a member saves a change to a marker nobody else has touched since they read it
- **THEN** the save is applied

#### Scenario: A conflict is not a validation error

- **WHEN** a save is refused because the marker changed underneath it
- **THEN** the report distinguishes it from a field being invalid
- **AND** from the write being refused by policy

### Requirement: Both applications offer capture

Every application that displays a trip's markers SHALL offer adding a place,
editing one, and removing one.

Each application SHALL present these in the form native to it and SHALL NOT share
rendered markup with the other. What is shared is the behaviour that validates and
writes them, which SHALL remain a single implementation usable from either
platform.

An application SHALL NOT be the only place a capability of this specification can
be exercised. Either application SHALL be sufficient on its own: a person SHALL be
able to plan an entire trip from one of them and never open the other.

Rationale: this replaces the requirement that capture was offered by the web
application only, and it is deliberately stated as the positive rule rather than
left as an absence. The earlier asymmetry was the whole reason a second platform
was ever "a fraction of the work"; removing it means each application is a full
client, and a rule that says so is what stops the next change quietly reintroducing
a laptop-only capability.

#### Scenario: Adding a place on either platform

- **WHEN** a person opens a trip on either application
- **THEN** they are offered both ways of adding a place
- **AND** both lead to a form capturing the same fields

#### Scenario: Editing and removing on either platform

- **WHEN** a person opens a marker on either application
- **THEN** they are offered a way to edit it and a way to remove it

#### Scenario: A place saved on one platform is seen on the other

- **WHEN** a person saves a place on one application and the trip is opened on the other
- **THEN** the place is present
- **AND** it is indistinguishable from one saved on that platform

#### Scenario: One application is never opened

- **WHEN** a person uses only one of the applications for an entire trip
- **THEN** no capability of this specification is unavailable to them

