## ADDED Requirements

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
