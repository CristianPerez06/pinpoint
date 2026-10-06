## MODIFIED Requirements

### Requirement: Every list a trip is made of is covered, on both platforms

This SHALL cover the trips a person belongs to, and a trip's markers, cities, members,
recorded interest and the order of each day's places, on both applications, by the same
rules.

No list a person can see SHALL be left out, and a list added later SHALL be covered by the
same mechanism rather than by a decision made again at its call site.

Rationale: the trips list is where staleness shows first, because a trip's name sits in
the chrome of both applications and the list is also the switcher. It is not where it
stops: markers, cities, members and interest are read the same way and go stale for the
same reason.

#### Scenario: A trip's contents change elsewhere

- **WHEN** somebody else adds or edits a marker, a city, a member, their interest, or the
  order of a day's places on a trip open on this device
- **THEN** the change is shown after this device's stated trigger

#### Scenario: The other platform

- **WHEN** the same list is looked at on the other application
- **THEN** it goes stale and refreshes by the same rules
