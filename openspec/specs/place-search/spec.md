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
