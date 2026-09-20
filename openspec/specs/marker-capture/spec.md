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

### Requirement: Saving a place captures its name, note, city, type, link, price, and the day it is planned for

One form SHALL capture a place's name, note, city, type, link, price, and the day it
is planned for, and the same form SHALL be used when editing an existing marker.

A name and a position SHALL be required. Every other field SHALL be optional, and
an optional field left blank SHALL be recorded as absent rather than as empty
text.

**No label SHALL state that a field is optional.** A field that may be left empty SHALL
say so in the guidance beneath it, in a sentence, and SHALL NOT repeat it as a
parenthetical in its own label. A field whose guidance would otherwise say nothing SHALL
gain a sentence rather than keep the parenthetical.

The price field SHALL say that it is in US dollars. Beside it the form SHALL offer a
`Free` control, on every application. Turning `Free` on SHALL empty the price field and
show it as unavailable. Turning `Free` off again, or going into the price field, SHALL
return the field to an ordinary empty price. A price and `Free` SHALL never both be set.
Saving with `Free` on SHALL record the place as free, and saving a price of 0 SHALL do the
same. A form opened on a place that is free SHALL open with `Free` on.

**The prices SHALL read as one bounded section**, carrying a single label `Price`, with
the amounts and the `Free` control inside it. Each amount field SHALL carry its currency's
code on the field itself rather than in a label above it. The section SHALL be drawn so
that where it begins and ends is visible without reading its contents.

When the city chosen in the form has a second currency, the form SHALL show a second
price field beside the price in US dollars, within the same section, carrying that
currency's code, and SHALL say beneath them that the amount is typed as seen and is not
converted. Where the two fields cannot both sit on one row at a readable width, they
SHALL wrap rather than shrink: an amount field SHALL never be narrowed past the width
its currency's plausible amounts need. When the chosen city has no second currency, or no
city is chosen, the form SHALL show no second field. The field SHALL follow the city
chosen in the form as it changes, before anything is saved.

Because the currency is no longer named in a label, any message about one of the two
amounts SHALL name the currency it concerns.

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
- **THEN** the form shows one `Price` section holding a `USD` amount and a `JPY` amount
- **AND** either, both or neither can be filled in and saved

#### Scenario: A place in a city without a second currency

- **WHEN** a person fills in the form for a place filed under a city with no second
  currency, or under no city
- **THEN** the form shows one `Price` section holding a `USD` amount and `Free` only

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

#### Scenario: No label says a field is optional

- **WHEN** a person opens the place form
- **THEN** no field label contains the word `optional`
- **AND** the day field says beneath it that it can be left blank to decide later

#### Scenario: A message about one of two amounts

- **WHEN** a place in a city whose second currency is JPY is saved with an unacceptable
  amount in the second field
- **THEN** the refusal names the `JPY` amount rather than "the second price"

#### Scenario: Both amounts at a width too narrow for one row

- **WHEN** the form is shown in a card too narrow to hold both amount fields and `Free`
  on one row
- **THEN** the fields wrap onto a further line within the same `Price` section
- **AND** neither amount field is narrowed past a readable width

#### Scenario: A place is moved to a city with a different currency

- **WHEN** a person editing a place with a local price of 3800 in a JPY city chooses a
  city whose second currency is KRW
- **THEN** the second field carries the code `KRW` and is empty
- **AND** the form says that saving will clear `JPY 3,800`
- **AND** choosing the original city again shows `3800` in the `JPY` field

### Requirement: A place is filed under a city chosen as it is saved

The form SHALL offer the trip's existing cities and SHALL default to the city the place
is most likely to belong to, determined from **what is known about the place** rather than
from what is currently selected.

Where the geocoding service reported a city for the place and the trip holds a city of that
name, the form SHALL default to that city. The service is answering the question directly;
everything below infers the same answer from position, which is a proxy for it.

Name comparison SHALL be on normalised text — case, surrounding whitespace and accents — and
SHALL NOT be fuzzy. A city a person named for their own purposes, which is frequently not a
city name at all and frequently not in the same language, SHALL simply not match, and the
place SHALL be decided by position instead.

Where there is no such city, or the service reported no city, position SHALL decide.

Every application SHALL offer a way to select the city being worked on. Selecting one
frames the map and biases search, and both are unaffected here.

What selection SHALL NOT do any longer is decide what a place is filed under, whether a
city is selected or none is. It is a statement about what is being *looked at*, and this
requirement is about where a place *is*.

Viewing the whole trip SHALL therefore be treated no differently: a place saved while
nothing is selected is decided by the same rule, and defaults to no city only when the rule
reaches no answer rather than because the view was wide.

Rationale: selecting nothing has never been a way of saying "file this nowhere". It is the
value that means *all places*, which is a view, and reading a viewing state as an
instruction about filing was only ever tenable while selection was the whole rule. It is
also a common view, so leaving it out would preserve the defect this requirement exists to
remove in exactly the place somebody planning a whole trip is most likely to be standing.

What this costs is worth stating: selecting the whole trip used to be a dependable way to
reach an unfiled place, and is no longer. Choosing no city in the form remains one action
away, and is now the only thing that means it — which is the honest arrangement, since it
is the only one of the two that was ever a statement about filing.

A city SHALL be treated as being where its markers are. No city name SHALL be resolved to
a position by lookup — a city is a name somebody chose for a group of nearby places, and
the places filed under it already say where that group is.

A city SHALL claim a place when the place is within **15 km** of that city's nearest
marker. The distance SHALL be biased toward claiming less rather than more: a place left
unclaimed is reported, while a place wrongly claimed is filed under a city it is not in,
which is the defect this requirement exists to prevent.

The number is floored by measurement and chosen above that floor, and SHALL be described
that way rather than as derived. Measured on the trip in hand: a place sits within 4.61 km
of the nearest other place in its own city, and 360.78 km from the nearest place in a
different one. Those distributions do not overlap, which is what establishes that a
threshold exists at all — but they are so far apart that any value between about 5 km and
360 km satisfies them equally, so the data sets a floor and does not choose the value.

15 km is roughly three times the observed maximum, so a city whose places are more spread
than any measured still holds together, and it is comfortably below the distance separating
two cities close enough to be day trips of one another, so neither can claim the other's
places.

This SHALL be revisited against a trip whose cities are near each other. The trip it was
taken from has two cities 360 km apart and therefore cannot test the case the distance
exists to get right.

The default SHALL follow from how many cities claim the place:

- **Exactly one** — the form defaults to that city.
- **None** — the form defaults to no city, and SHALL offer the city the place is actually
  in, named from what the geocoding service reported, one action from being created. A city
  SHALL NOT be offered for creation under a name the trip already holds — a city that exists
  but holds no markers claims nothing, and offering to create it again would produce two
  cities of one name from the feature meant to prevent exactly that.
- **More than one** — the form defaults to no city, and SHALL offer the cities that claim
  it. One SHALL NOT be chosen on the person's behalf.

Where exactly one city claims the place and it is the city being worked in, nothing SHALL
be announced. This is the ordinary case, and a form that remarks on every save is noise
that buries the three times a trip it matters.

Where the form fills in or withholds a city other than the one being worked in, that SHALL
be apparent in the form before saving, and SHALL be changeable in one action.

A guess SHALL NOT be made silently, and this includes a guess of **no city**. Leaving a
place unfiled substitutes an answer as surely as filing it does, so it is done visibly or
not at all — the rule `markers` already states for a rejected city reference.

Both ways of adding a place SHALL be subject to this rule. A position indicated on the map
carries no city name, so only the position half applies to it.

The two paths MAY therefore reach different cities for one position, and that is accepted
rather than corrected. Guaranteeing they agree is only achievable by discarding a fact the
product holds — a searched place knows which city the service says it is in, and a pointed
one cannot. Levelling down to what pointing can know would make every searched place worse
to protect a consistency nobody is looking for.

This replaces a per-device "city most recently used" fallback, which existed only to
serve an application that could not express a city at all. Selecting a city already
carries that convenience and more: one selection frames the map and biases search. A
remembered last-used city on top of a selection would be a second, invisible answer to a
question the selection is already answering out loud.

A person SHALL be able to create a city from within the form, without abandoning
the place they are saving. A newly created city SHALL become immediately
available and SHALL be applied to the place being saved. Where the form offered a city
that does not exist, creating it SHALL take the offered name as its starting point,
editable before it is created.

A city holding no markers SHALL claim nothing, because there is nothing to measure from.
A place belonging to it SHALL be reported as belonging to no city and filed by hand. This
state ends with that city's first marker.

A place SHALL be saveable with no city, and SHALL remain visible and addressable
rather than being hidden until it is filed.

#### Scenario: Saving with a city selected

- **WHEN** a city is selected and a person saves a place the rule assigns elsewhere
- **THEN** the form defaults to where the rule assigns it
- **AND** the selection does not override it
- **AND** they can change it before saving

#### Scenario: Saving with nothing selected

- **WHEN** a person saves a place while no city is selected
- **THEN** the same rule decides the default city
- **AND** it is not defaulted to no city on account of the selection

#### Scenario: Selection still frames and biases

- **WHEN** a city is selected
- **THEN** the map frames that city and search is biased toward it
- **AND** neither behaviour is changed by this requirement

#### Scenario: The trip already has a city of the name the service reported

- **WHEN** a person saves a searched place the geocoding service reports as being in Nara
- **AND** the trip holds a city named Nara
- **THEN** the form defaults to that city
- **AND** it does so whether or not that city's markers are near the place

#### Scenario: A city of that name exists but holds no markers

- **WHEN** the trip holds a city named Nara with nothing filed under it
- **AND** a person saves a searched place the service reports as being in Nara
- **THEN** the form defaults to that city
- **AND** creating a second city of that name is not offered

#### Scenario: The city name does not match anything the trip holds

- **WHEN** the service reports a city no city on the trip is named for
- **THEN** the place is decided by position instead

#### Scenario: A place near the city being worked in

- **WHEN** a person saves a place near the markers of the city they are working in
- **THEN** the form defaults to that city
- **AND** nothing is announced about the choice

#### Scenario: A place near a different city on the trip

- **WHEN** a person saves a place near the markers of a city other than the selected one
- **THEN** the form defaults to that other city
- **AND** the choice is apparent before saving
- **AND** they can change it in one action

#### Scenario: A place near no city the trip holds

- **WHEN** a person saves a place that no city on the trip claims
- **THEN** the form defaults to no city
- **AND** the city the place is in is offered, named from the geocoding service
- **AND** creating it files the place there without losing what was typed

#### Scenario: Two cities both claim the place

- **WHEN** a place is within the claiming distance of more than one city
- **THEN** the form defaults to no city
- **AND** the cities that claim it are offered
- **AND** neither is chosen on the person's behalf

#### Scenario: A place added by pointing at the map

- **WHEN** a person adds a place by indicating a position rather than by searching
- **THEN** the position half of the rule decides the default city
- **AND** no city name is consulted, because none was reported

#### Scenario: A city that holds no markers yet

- **WHEN** a trip has a city with no markers filed under it
- **THEN** that city claims nothing
- **AND** a place belonging to it is reported as belonging to no city

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

### Requirement: A marker can be edited and removed by any member of the trip

Any member of a trip SHALL be able to edit and to remove any of that trip's
markers, reached from the surface that shows what was recorded about it. Editing
SHALL offer the same fields as creating, filled in with what is stored.

Removing SHALL require an explicit confirmation, and the person SHALL be told
that it cannot be undone, because it cannot.

Concurrent edits are governed by "A save based on a stale read is refused" below.

Where the edit was reached from the map, saving it SHALL close the place's details and
leave the map unobstructed, in both applications. The saved place is on the map where it
was, and opening it again shows what was just saved. The two applications SHALL NOT differ
here: an edit saved on the laptop and the same edit saved on the phone end in the same
state.

Rationale: the laptop has always closed the card on saving and the phone has always
brought the sheet back, and nothing written down said which was intended — so a rule that
depends on whether the details are still open after an edit (the calendar's way back from
the map) behaved differently on each. Closing is the one chosen: the edit is confirmed by
the save itself, and the map is what the person was using before they opened the place.

#### Scenario: Editing a marker

- **WHEN** a person edits a marker
- **THEN** they are offered the same fields as when it was created
- **AND** each is filled in with what is currently stored

#### Scenario: An edit saved from the map

- **WHEN** a person edits a place from its details on the map and saves
- **THEN** the details close and the map is unobstructed
- **AND** this is so on both applications

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

### Requirement: The place form captures one range of hours for the days a place is open

The form that saves and edits a place SHALL offer its opening hours, on every
application. It SHALL be optional and placed after the day the place is planned for.

**The hours SHALL read as one bounded section**, carrying a single label `Hours`, with
the days, the line naming them and the times inside it. The section SHALL be drawn so
that where it begins and ends is visible without reading its contents, and SHALL NOT rely
on a background fill to do so — a fill that is indistinguishable from the surface behind
it on either ground says nothing. Its fields SHALL keep the same appearance they have
elsewhere in the form.

**Days.** The form SHALL offer the seven days of the week as a row of letters in week
order, starting on Monday (`M T W T F S S`), each of which can be turned on and off.
Beneath the row the form SHALL name the days turned on in words, for example `Open Tue to
Sat`, `Open every day`, or `Open Mon, Wed, Fri`. While no day is on, it SHALL say instead
that the hours can be left empty if they are not known.

Rationale for the words: two letters in the row repeat, so the row alone cannot say which
Tuesday-or-Thursday was meant.

**Time fields appear with the first day.** While no day is on, the form SHALL show no
time fields. Saving with no day on SHALL record the place as having no hours, whatever
times had been entered before the days were turned off.

**One range.** The form SHALL offer one opening time and one closing time, which apply to
every day turned on. It SHALL NOT offer a second range, nor a way to give some days hours
of their own.

**Times** SHALL be entered and shown on a 24-hour clock.

**Hints while typing.** Where the closing time is earlier than the opening time, the form
SHALL say beneath it that the place closes at that time the next day, for example `Closes
02:00 the next day`. Where the two times are equal, it SHALL say `Open all day`.

**Refusal.** A range with only one of its two times, or a range breaking the rules for
opening hours, SHALL be refused. The refusal SHALL name the hours field and SHALL preserve
everything entered, in the hours and everywhere else in the form.

**Opening the form on a place that has hours.** The days SHALL be turned on as stored,
and the opening and closing times SHALL be those stored. Saving without changing
anything SHALL leave the hours exactly as they were.

Changing a place's hours SHALL be governed by the same rules as any other change to a
place, including the refusal of a save based on a stale read.

#### Scenario: Saving a place with hours

- **WHEN** a person turns on Monday to Friday, enters 09:00 to 17:00, and saves
- **THEN** the place is open Monday to Friday, 09:00–17:00
- **AND** it is closed on Saturday and Sunday

#### Scenario: The form offers one range only

- **WHEN** a person turns on any day
- **THEN** the form shows one opening time and one closing time
- **AND** it offers no way to add a second range
- **AND** it offers no way to give one day different hours

#### Scenario: The form opens with nothing to fill in

- **WHEN** a person opens the form on a place with no hours
- **THEN** no day is turned on
- **AND** no time fields are shown

#### Scenario: Turning every day off

- **WHEN** a person has entered times, turns every day off, and saves
- **THEN** the place is recorded as having no hours

#### Scenario: A late closing time

- **WHEN** a person enters 19:00 to 02:00
- **THEN** the form says `Closes 02:00 the next day`

#### Scenario: Open all day

- **WHEN** a person enters 00:00 to 00:00
- **THEN** the form says `Open all day`

#### Scenario: A range missing a time

- **WHEN** a person enters an opening time with no closing time and saves
- **THEN** the save is refused
- **AND** the refusal names the hours field
- **AND** everything else they entered is preserved

#### Scenario: Editing a place with hours

- **WHEN** a person opens the form on a place open Monday, Wednesday and Friday,
  09:00–17:00
- **THEN** Monday, Wednesday and Friday are turned on
- **AND** the times read 09:00 and 17:00

#### Scenario: Saving an edit that did not touch the hours

- **WHEN** a person opens the form on a place with hours, changes only its note, and saves
- **THEN** the place's hours are unchanged

#### Scenario: The hours are labelled

- **WHEN** a person opens the place form
- **THEN** the hours section is labelled `Hours`
- **AND** the label does not say that the hours are optional
- **AND** the line beneath the days says the hours can be left empty if they are not known

