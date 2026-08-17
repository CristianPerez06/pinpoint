## Purpose

Define how a trip's markers are narrowed to a subset worth looking at — by who wants to
go and by whether the place has been visited — and the guarantees that keep a narrowed
view from being mistaken for the whole trip.

## ADDED Requirements

### Requirement: A trip can be narrowed by who is interested

The system SHALL offer filtering a trip's markers by the combination of members who have
recorded interest, with at least these choices:

- **Both** — every member of the trip has recorded interest.
- **Either** — at least one member has recorded interest.
- **Only one of you** — exactly one member has recorded interest.
- **Nobody yet** — no member has recorded anything about the marker.

"Nobody yet" SHALL mean the absence of every record, not that every member declined. A
marker everyone has actively declined is a decision that was made; a marker nobody has
answered is a decision waiting to be made, and collapsing the two would bury the second
inside the first.

A member who has recorded *not interested* SHALL NOT count as interested for any of
these choices.

#### Scenario: Both members want to go

- **WHEN** every member of the trip has recorded interest in a marker
- **AND** the filter is set to Both
- **THEN** the marker is shown

#### Scenario: One member wants to go and the other declined

- **WHEN** one member has recorded interest and another has recorded not interested
- **AND** the filter is set to Only one of you
- **THEN** the marker is shown
- **AND** it is not shown under Both

#### Scenario: Nobody has answered

- **WHEN** no member has recorded anything about a marker
- **AND** the filter is set to Nobody yet
- **THEN** the marker is shown

#### Scenario: Everybody declined

- **WHEN** every member has recorded not interested
- **AND** the filter is set to Nobody yet
- **THEN** the marker is not shown, because a recorded decision is not an absent one

### Requirement: Every marker remains reachable

The system SHALL provide a way to view a trip unfiltered, and that SHALL be the state a
trip opens in.

Rationale: the interest choices do not partition the trip — a marker every member has
declined matches none of them. Without an unfiltered view such a marker would be
unreachable through the interface while still existing in the trip, which is the same
class of defect as a marker hidden underneath another one.

#### Scenario: A trip opens unfiltered

- **WHEN** a trip is opened
- **THEN** every marker on it is shown
- **AND** no interest or visited filter is applied

#### Scenario: A marker everybody declined is still reachable

- **WHEN** every member has declined a marker
- **AND** no filter is applied
- **THEN** the marker is shown

### Requirement: A trip can be narrowed by whether a place has been visited

The system SHALL offer filtering by visited state, so that places already seen can be set
aside without being deleted.

Filtering by visited SHALL combine with filtering by interest rather than replacing it:
selecting both narrows to markers satisfying both.

#### Scenario: Hiding places already visited

- **WHEN** the filter excludes visited markers
- **THEN** visited markers are not shown
- **AND** they remain on the trip

#### Scenario: Interest and visited together

- **WHEN** the filter is set to Both and to exclude visited markers
- **THEN** only markers wanted by every member and not yet visited are shown

### Requirement: A filter applies to every view of the trip at once

When a filter is applied, the system SHALL apply it to every view of that trip's markers
simultaneously — the map and any list among them.

Rationale: the map and the list are two views of one set, and the roadmap treats them as
co-equal. A filter that narrowed one and not the other would make them disagree about
what the trip contains, and the person would have to work out which to believe.

#### Scenario: The map and the list agree

- **WHEN** a filter is applied while both a map and a list of the trip are visible
- **THEN** both show the same set of markers
- **AND** neither shows a marker the other has hidden

### Requirement: A narrowed view declares that it is narrowed

Whenever a filter is applied, the system SHALL indicate that fact, and SHALL make
clearing it available from where the narrowing is visible.

When a filter matches no markers, the system SHALL say that nothing matches the filter,
and SHALL NOT present it as a trip with no markers.

Rationale: a filtered trip and a trip that lost its places render identically — fewer
pins, or none. The difference between "nothing matches what you asked for" and "there is
nothing here" is not one a person can recover on their own, and the second is alarming
in a way the first is not.

#### Scenario: A filter is active

- **WHEN** any filter is applied
- **THEN** the interface indicates that the view is narrowed
- **AND** clearing the filter is available from there

#### Scenario: A filter matches nothing

- **WHEN** an applied filter matches no markers on a trip that has markers
- **THEN** the interface states that no markers match the filter
- **AND** does not state or imply that the trip has no markers

### Requirement: What a filter means is defined once and shared

The meaning of each filter — which markers "Both" selects, and the rest — SHALL be
defined in shared code used by every platform that offers filtering, rather than
implemented per application.

Rationale: these are definitions, not rendering. Two implementations of "Both" would
eventually disagree, and the disagreement would show up as a place appearing on a laptop
and missing on a phone, which reads as a data problem and is not one.

Filtering SHALL NOT be used to hide markers the reader is not entitled to see; what a
member may read is decided where the data is stored, and re-deciding it while filtering
would conceal a policy defect rather than reveal one.

#### Scenario: Both platforms agree on what a filter selects

- **WHEN** the same trip and the same filter are evaluated by either application
- **THEN** both select the same markers

#### Scenario: Filtering is not a permission boundary

- **WHEN** markers are filtered
- **THEN** the filter narrows only what is shown
- **AND** what may be read is still decided where the data is stored
