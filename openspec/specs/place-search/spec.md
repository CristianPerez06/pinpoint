# place-search Specification

## Purpose

Define how a person finds a place by name so it can be saved, without having to
know its coordinates: querying an external geocoding service as they type,
biasing results toward where they are working, and behaving predictably when
that service is slow, empty, or unreachable.
## Requirements
### Requirement: Place search costs nothing and requires no account

The geocoding service SHALL be usable without a signup, without an API key, and
without per-request billing. No credential for it SHALL be required by either
application, and therefore none SHALL be embedded in a shipped client bundle.

If continuing to search would require paying, or would require a credential that
could be exhausted or revoked, search SHALL be withdrawn rather than made
conditional on it. Every other way of adding a place SHALL continue to work,
which is what makes withdrawal survivable.

#### Scenario: The application is built for release

- **WHEN** the web application's production bundle is built
- **THEN** it contains no credential for the geocoding service
- **AND** search works without any account having been created for it

#### Scenario: The service adds a paid tier

- **WHEN** the chosen service can no longer be queried for free
- **THEN** search is withdrawn or moved to another free service
- **AND** adding a place by pointing at the map is unaffected

### Requirement: Searching offers candidates while the person types

The system SHALL query for candidates as the person types, rather than requiring
them to submit the query.

It SHALL NOT issue one request per keystroke. A request SHALL be made only after
typing has paused.

When a newer query supersedes an older one, the older one's results SHALL be
discarded even if they arrive later. What is displayed SHALL always correspond to
what is currently typed.

Each candidate SHALL carry at least a name and a position, because those are the
two things a marker cannot be created without.

#### Scenario: Typing a query quickly

- **WHEN** a person types eight characters in rapid succession
- **THEN** the service is queried after they pause
- **AND** not once per character

#### Scenario: An earlier response arrives late

- **WHEN** the response to an earlier query arrives after the response to a later one
- **THEN** the earlier response is discarded
- **AND** the displayed candidates correspond to the current query text

#### Scenario: A candidate is offered

- **WHEN** a candidate place is shown to the person
- **THEN** it carries a name and a position
- **AND** choosing it is enough to place a marker without further lookup

### Requirement: Search is biased toward where the person is working

The system SHALL bias results toward the area the person is currently working in.
When a city is selected and has saved markers, the bias SHALL be derived from
those markers' positions. Otherwise the bias SHALL be derived from the area the
map is currently showing.

Bias SHALL affect ranking only. A place outside the biased area SHALL still be
findable, because a trip includes day trips and a search restricted to the
current city would make them unreachable.

The bias SHALL NOT require the city's name to be looked up or resolved to a
position. A city is a name a person chose for a group of markers, and the markers
already say where that group is.

#### Scenario: An ambiguous name with a city selected

- **WHEN** a person searches for a name that matches places in several countries
- **AND** a city is selected whose markers are all in one of them
- **THEN** the places near those markers are ranked first

#### Scenario: Searching for somewhere far away

- **WHEN** a person searches for a place well outside the biased area
- **THEN** it is still returned among the candidates
- **AND** it is not excluded for being distant

#### Scenario: A city with no markers yet

- **WHEN** a city has just been created and holds no markers
- **THEN** the bias is derived from the visible map area instead
- **AND** search still returns candidates

### Requirement: A candidate suggests a marker type but never dictates one

The system SHALL map a candidate's classification from the geocoding service onto
one of the product's marker types, and SHALL offer that type as a pre-selection
the person can change before saving.

A classification the product does not recognise SHALL resolve to the fallback
type. A candidate SHALL NOT be withheld, rejected, or degraded because its
classification is unrecognised — the service's vocabulary is external and will
grow without this product being told.

#### Scenario: A recognised classification

- **WHEN** a person chooses a candidate the service classifies as a restaurant
- **THEN** the form opens with a food type pre-selected

#### Scenario: An unrecognised classification

- **WHEN** a candidate carries a classification the product has no mapping for
- **THEN** it is still offered as a candidate
- **AND** choosing it pre-selects the fallback type

#### Scenario: The person disagrees with the guess

- **WHEN** a person changes the pre-selected type before saving
- **THEN** the marker is stored with the type they chose
- **AND** the guess is not reapplied

### Requirement: A failing search never blocks saving a place

When the geocoding service is unreachable, returns an error, or does not respond
in reasonable time, the system SHALL report that search is unavailable and SHALL
leave every other way of adding a place working.

A failure SHALL NOT be presented as an absence of matches. Searching, finding
nothing, and being unable to search are three distinct states and SHALL be
distinguishable, because only one of them means the person should try different
words.

#### Scenario: The service is unreachable

- **WHEN** the geocoding service cannot be reached
- **THEN** the person is told search is unavailable
- **AND** adding a place by pointing at the map still works

#### Scenario: A query genuinely matches nothing

- **WHEN** a query returns no candidates
- **THEN** the person is told there are no matches
- **AND** this is distinguishable from search being unavailable

#### Scenario: A query is in flight

- **WHEN** a query has been sent and no response has arrived
- **THEN** the person is shown that a search is in progress
- **AND** it is not implied that there are no matches

### Requirement: A candidate shows how far away it is

Every candidate SHALL carry its distance from the point the search was biased
toward, and that distance SHALL be shown wherever candidates are offered.

When no bias point was available, a candidate SHALL carry no distance and none
SHALL be shown. There is no reference to measure from, and inventing one would
present a fabricated number in the same place a real one appears.

A candidate far from where the person is working SHALL be marked, so that it is
distinguishable while scanning rather than only on inspection.

Distance SHALL be presented and SHALL NOT be used to filter, reorder, or withhold
a candidate. A trip contains day trips — a place a few hundred kilometres away is
an ordinary thing to save — and excluding by distance would contradict the
requirement that bias ranks rather than restricts.

Rationale: the geocoder matches on whatever words a person wrote down, and a
saved place is usually written down with a note attached to it. Those extra words
routinely resolve to a real place with a similar name on another continent. The
result is indistinguishable from a correct one by name alone, and distance is the
one fact that separates them — already known when the list is drawn, and
previously not shown.

#### Scenario: A candidate near where the person is working

- **WHEN** a candidate a short distance from the bias point is offered
- **THEN** its distance is shown
- **AND** it is not marked as far away

#### Scenario: A candidate on the other side of the world

- **WHEN** a query resolves to a real place with a similar name on another continent
- **THEN** it is still offered
- **AND** its distance is shown
- **AND** it is marked as far away

#### Scenario: A place worth a day trip

- **WHEN** a candidate a few hundred kilometres from the bias point is offered
- **THEN** it is offered in its ranked position, neither removed nor demoted
- **AND** the person can tell from its distance how far it is

#### Scenario: No bias point was available

- **WHEN** candidates are offered for a search that had nothing to bias toward
- **THEN** no distance is shown for any of them
- **AND** none is marked as far away

### Requirement: A candidate already saved on this trip is recognised rather than offered again

When a person chooses a candidate whose position is already held by a marker on the
current trip, the system SHALL open that marker rather than beginning a new capture. No
second marker for the same place SHALL be offered or created.

A candidate SHALL match a saved marker when their positions are **equal**. Equality is
exact, and no tolerance SHALL be applied.

Rationale: a marker saved from search stores the position the geocoder gave, so searching
the same place again returns the same numbers and exact equality recognises it. A
tolerance would catch two further cases — a marker repositioned after saving, and one
added by pointing at the map — at the cost of matching a *different* place a few metres
away, and the distance between two premises on one street is the same distance a pin gets
corrected by. There is no radius that separates them. The two failures are not comparable:
offering a duplicate is visible and undone in one press, while silently refusing to save a
place somebody meant to save is neither.

A marker whose position was corrected after it was saved, and a marker added by pointing
at the map, therefore SHALL NOT match a candidate at the geocoder's position. This is a
stated limit rather than an omission — those cases behave as they did before this
requirement existed.

Matching SHALL consider **every marker on the current trip**, whatever city it is filed
under and whether or not the current filter is showing it. A filter decides what is drawn
and SHALL NOT decide what counts as already saved, or a narrowed view would be able to
produce the duplicate this requirement exists to prevent.

Matching SHALL be scoped to the current trip. A marker on another trip SHALL NOT match,
and the candidate SHALL be offered as new here.

Recognition SHALL change only where choosing a candidate leads. It SHALL NOT withhold a
candidate, mark it, reorder it, or otherwise change what search returns — a person is
entitled to search a place they have already saved, and to be shown it in its ranked
position like any other result.

The camera SHALL behave the same way whether or not the candidate matched. A person who
chooses a place expects the map to go there in both cases, and moving the map only for
places that turn out to be new would make the trip's own contents the reason the map
behaves differently.

Where a candidate's position is held by more than one marker — which the geocoder makes
ordinary by answering with a building's centre — every marker at that position SHALL be
offered, and the person SHALL choose between them. One SHALL NOT be selected on their
behalf.

#### Scenario: Searching a place the trip already holds

- **WHEN** a person chooses a candidate whose position a marker on this trip already holds
- **THEN** that marker is opened
- **AND** no unsaved position is taken and no second marker is offered

#### Scenario: The map still goes there

- **WHEN** a chosen candidate matches a marker already on the trip
- **THEN** the map moves to it exactly as it does for a candidate that matches nothing

#### Scenario: A place saved on another trip

- **WHEN** a person chooses a candidate that is saved as a marker on a different trip
- **AND** no marker on the current trip holds that position
- **THEN** it is offered as a new place on this trip

#### Scenario: A place saved nowhere

- **WHEN** a person chooses a candidate no marker on this trip holds the position of
- **THEN** an unsaved position is taken and the form opens, unchanged

#### Scenario: A different venue a few metres away

- **WHEN** a candidate's position is close to a saved marker's but not equal to it
- **THEN** it is treated as a different place
- **AND** it is offered as new

#### Scenario: A marker filed under another city

- **WHEN** a chosen candidate matches a marker filed under a city other than the one
  currently selected
- **THEN** it is recognised as already saved
- **AND** the marker is opened

#### Scenario: A marker the current filter is hiding

- **WHEN** a chosen candidate matches a marker the current filter is not showing
- **THEN** it is recognised as already saved
- **AND** no second marker is offered

#### Scenario: Several places share the matched position

- **WHEN** a chosen candidate's position is held by more than one marker on the trip
- **THEN** all of them are offered
- **AND** the person chooses which one to open

#### Scenario: A recognised candidate is still an ordinary result

- **WHEN** a query returns a candidate the trip has already saved
- **THEN** it appears among the candidates in its ranked position
- **AND** it is neither withheld nor reordered for having been saved

### Requirement: A candidate carries the place name of the city it is in

Every candidate SHALL carry, as a field of its own, the name the geocoding service gave for
the city the place is in, or nothing where the service gave none.

It SHALL be carried in addition to the display context, not extracted from it. The context
exists to tell four identically-named coffee shops apart and joins several parts into one
string for reading; a name that is going to be offered as a city to create has to be the
city alone.

What this name is for is decided in `marker-capture`: it selects a city of that name where
the trip holds one, it names a city offered for creation where it does not, and where it
matches nothing the place is decided by position instead. This capability's obligation is
only to carry it faithfully.

Carrying it faithfully includes carrying it **unaltered**. It SHALL NOT be trimmed to a
shorter form, corrected against any list, or reconciled with anything else the service
returned. A name adjusted here would be compared against the trip's cities in
`marker-capture` and offered as a city to create, so an improvement made in passing becomes
a city named something the service never said.

A candidate SHALL NOT be withheld, reordered, or marked because of this name, or because of
what it is or is not near. What search returns and how it ranks are unchanged.

Where the service reported no city, the candidate SHALL carry nothing rather than a
substitute drawn from a wider area. A county or a state offered as a city to create would
produce a group nobody meant to make, named after something that is not a city.

#### Scenario: A candidate in a named city

- **WHEN** the geocoding service reports a city for a candidate
- **THEN** the candidate carries that name as its own field
- **AND** the display context is unaffected

#### Scenario: A candidate the service gave no city for

- **WHEN** the service reports no city for a candidate
- **THEN** the candidate carries no city name
- **AND** no wider area is substituted for one

#### Scenario: The name does not affect what is offered

- **WHEN** candidates are returned for a query
- **THEN** none is withheld, reordered, or marked on account of its city
- **AND** the ranking is the one the service and the bias produced

