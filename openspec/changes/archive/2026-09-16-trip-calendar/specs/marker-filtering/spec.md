## MODIFIED Requirements

### Requirement: A filter applies to every view of the trip at once

When a filter is applied, the system SHALL apply it to every view of that trip's markers
**that is visible alongside the others** — the map and any list among them.

Rationale: the map and the list are two views of one set, and the roadmap treats them as
co-equal. A filter that narrowed one and not the other would make them disagree about
what the trip contains, and the person would have to work out which to believe.

A screen that replaces the workspace rather than sitting inside it SHALL NOT be bound by
this, and SHALL state for itself what it shows. The filter is a property of the workspace
the controls that set it live in, not a property of the trip, so a screen reached by
leaving the workspace does not inherit it.

Rationale for the bound: the reasoning above is about two views a person is reading at the
same moment, which is why it is stated as a guarantee against disagreement rather than as a
rule about every screen that ever lists markers. Applied to a screen a person has navigated
to, it produces the opposite of what it was written for — a view that quietly omits places
while presenting itself as complete, with the control that would explain why left behind on
another screen. `trip-calendar` states the consequence for the one such screen that exists.

#### Scenario: The map and the list agree

- **WHEN** a filter is applied while both a map and a list of the trip are visible
- **THEN** both show the same set of markers
- **AND** neither shows a marker the other has hidden

#### Scenario: A screen reached by leaving the workspace

- **WHEN** a filter is applied and a person leaves the workspace for another screen
  showing the trip's markers
- **THEN** that screen is not required to apply the filter
- **AND** it states what it shows rather than leaving it to be inferred
