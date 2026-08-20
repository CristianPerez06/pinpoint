## ADDED Requirements

### Requirement: Every application that shows a trip offers filtering

Every application that displays a trip's markers SHALL offer narrowing them, by who wants
to go and by whether a place has been visited.

Each application SHALL present the control in the form native to it. What each choice
selects SHALL remain defined once and shared, so that the same trip narrowed the same way
shows the same places on either platform.

Rationale: the existing requirements in this capability say what a filter *selects*, not
who offers one — deliberately, because meaning is shared and controls are not. That leaves
a gap this change has to close: an application that never offered a filter at all would
satisfy every word already written here, which was true of the phone until now and should
not be true again by omission.

The guarantees already stated apply wherever filtering is offered: a trip opens
unfiltered, a narrowed view says it is narrowed and can be cleared from there, and a
filter matching nothing is distinguished from a trip with nothing in it. They are
properties of filtering rather than of a platform.

#### Scenario: Filtering on either platform

- **WHEN** a trip with markers is opened on either application
- **THEN** a way to narrow it by who wants to go is offered
- **AND** a way to narrow it by visited is offered

#### Scenario: The same filter on both platforms

- **WHEN** the same trip is narrowed the same way on either application
- **THEN** both show the same markers

#### Scenario: A narrowed view on a phone

- **WHEN** a filter is applied on the mobile application
- **THEN** it indicates that the view is narrowed
- **AND** clearing the filter is available from there
- **AND** a filter matching nothing is not presented as a trip with no markers
