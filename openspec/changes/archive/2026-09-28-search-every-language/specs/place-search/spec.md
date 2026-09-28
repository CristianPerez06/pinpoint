## MODIFIED Requirements

### Requirement: Place search costs nothing and requires no account

Every geocoding service place search uses SHALL be usable without a signup, without an
API key, and without per-request billing. No credential for any of them SHALL be required
by either application, and therefore none SHALL be embedded in a shipped client bundle.

If continuing to search would require paying, or would require a credential that
could be exhausted or revoked, search SHALL be withdrawn rather than made
conditional on it. Every other way of adding a place SHALL continue to work,
which is what makes withdrawal survivable.

This applies to each service on its own. If only the service behind searching every
language stops being free, that search SHALL be withdrawn — the key stops doing anything
and the hint is no longer shown — and suggestions while typing SHALL continue to work.

#### Scenario: The application is built for release

- **WHEN** the web application's production bundle is built
- **THEN** it contains no credential for any geocoding service
- **AND** search works without any account having been created for it

#### Scenario: The service adds a paid tier

- **WHEN** the chosen service can no longer be queried for free
- **THEN** search is withdrawn or moved to another free service
- **AND** adding a place by pointing at the map is unaffected

#### Scenario: Only the every-language service adds a paid tier

- **WHEN** the service behind searching every language can no longer be queried for free
- **THEN** submitting a query no longer searches every language and the hint is not shown
- **AND** suggestions while typing are unaffected

## ADDED Requirements

### Requirement: Submitting a query searches names in every language

The suggestions offered while a person types come from a service that knows a place's
name only in a few languages, so a place is often unreachable by the name somebody knows
it by — "Torre Eiffel" finds a building in Mexico. When a person **submits** the query,
the system SHALL run one search against a service that matches names in every language
recorded for a place.

A submit is an explicit act: the Enter key in the web application's search field, and the
keyboard's search key on the phone. The system SHALL NOT run this search on a keystroke,
after typing pauses, or on any other occasion than a submit. Submitting an empty query
SHALL do nothing.

Its candidates SHALL **replace** the list rather than be added to it, so the list always
comes from one search and never shows one place twice. Changing the query in any way
SHALL return the list to suggestions while typing, under the rules of that requirement.

Its candidates SHALL be ordinary candidates in every other respect: they carry a name and
a position, a suggested marker type, the name of the city they are in, and their distance
from the bias point. They are biased toward where the person is working in the same way,
ranked rather than restricted. They SHALL be recognised when a marker on the trip already
holds their position, and SHALL save like any other candidate.

A candidate's name and its city SHALL be asked for in English, whatever language the
application is shown in. A city's name is compared with the trip's cities when a place is
saved, and suggestions while typing already name places in English — so the same city
arriving as "Rome" from one search and "Roma" from the other would offer a second city
for a place the trip already has.

The wait, an answer with no candidates, and a failure SHALL be shown exactly as they are
for suggestions while typing. When this service is unreachable, the person SHALL be told
search is unavailable, and suggestions while typing SHALL continue to work.

#### Scenario: A place known by its Spanish name

- **WHEN** a person types "Torre Eiffel" and submits it
- **THEN** the Eiffel Tower in Paris is among the candidates

#### Scenario: Typing never reaches the every-language service

- **WHEN** a person types a query and pauses without submitting
- **THEN** only suggestions while typing are requested
- **AND** the every-language service is not called

#### Scenario: Submitted results replace the list

- **WHEN** a person submits a query while suggestions for it are shown
- **THEN** the list shows only the every-language search's candidates

#### Scenario: Typing again after a submit

- **WHEN** a person changes the query after submitting it
- **THEN** the list returns to suggestions while typing for what is now typed

#### Scenario: Names arrive in English

- **WHEN** a person using the application in Spanish submits "Coliseo"
- **THEN** the candidate is named "Colosseum" and its city is "Rome"

#### Scenario: A submitted result is saved

- **WHEN** a person chooses a candidate from a submitted search
- **THEN** the form opens with a suggested type and the candidate's city, as for any candidate

#### Scenario: A place already on the trip, found by submitting

- **WHEN** a person chooses a submitted candidate whose position a marker on this trip holds
- **THEN** that marker is opened, as for any candidate

#### Scenario: The every-language service is unreachable

- **WHEN** a person submits a query and the every-language service cannot be reached
- **THEN** they are told search is unavailable
- **AND** changing the query brings suggestions while typing back as normal

#### Scenario: Submitting an empty field

- **WHEN** a person submits while the field is empty
- **THEN** nothing is requested and nothing changes

### Requirement: A hint says that submitting searches every language

While suggestions while typing are showing an answer to what is currently typed —
candidates, or no matches — the system SHALL show a hint beneath them saying that
submitting searches every language. It SHALL name the act as it is on that platform: the
Enter key on the web, the keyboard's search key on the phone.

The hint SHALL NOT be shown while the field is empty, while no answer has arrived for
what is typed, when search failed, or while the list shows a submitted search. In each of
those there is either nothing to fall back from or nothing further that submitting would
do.

The hint SHALL be worded in every language the product speaks.

#### Scenario: Suggestions are showing

- **WHEN** suggestions while typing have answered the current query with candidates
- **THEN** the hint is shown beneath them

#### Scenario: Nothing matched

- **WHEN** suggestions while typing have answered the current query with no matches
- **THEN** the hint is shown with the no-matches message

#### Scenario: After submitting

- **WHEN** the list shows a submitted search's candidates
- **THEN** the hint is not shown

#### Scenario: On the phone

- **WHEN** the hint is shown on the phone
- **THEN** it names the keyboard's search key rather than an Enter key

### Requirement: The every-language service is asked within its usage policy

The every-language service is free on the condition that it is not used for suggestions
while typing, is asked at most once per second, and is told which application is asking.
Each application calls it directly from the person's device, so these limits SHALL be
kept on each device.

- A device SHALL NOT send the service more than one request per second. A submit that
  arrives sooner SHALL wait until a second has passed rather than be refused.
- A query already submitted in this session SHALL be answered from what the device
  already has, without asking the service again.
- Every request SHALL identify the application: the phone by naming it in the request,
  and the web application by the address the browser sends with the request.

#### Scenario: Submitting twice in quick succession

- **WHEN** a person submits two different queries less than a second apart
- **THEN** the second request is sent no sooner than one second after the first

#### Scenario: Submitting the same query again

- **WHEN** a person submits a query they already submitted in this session
- **THEN** the candidates are shown without a new request to the service

#### Scenario: A request from the phone

- **WHEN** the phone sends a request to the every-language service
- **THEN** the request names the Pinpoint application
