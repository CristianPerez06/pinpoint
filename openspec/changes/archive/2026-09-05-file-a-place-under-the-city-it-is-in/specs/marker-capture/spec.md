## MODIFIED Requirements

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
