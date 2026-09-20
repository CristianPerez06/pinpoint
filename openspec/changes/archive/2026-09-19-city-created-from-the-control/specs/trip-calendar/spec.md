## MODIFIED Requirements

### Requirement: A place opened from the calendar shows what it shows on the map

Opening a place from this screen SHALL present the same account of it that opening it
from the map presents — the same fields, recording interest, marking it visited, and the
same route to editing and removing it.

A person SHALL NOT have to return to the map to learn or change anything about a place
they have found here.

One thing SHALL be excepted, and it is not about the place: creating a **city** SHALL NOT
be offered from this screen, on either application. The option SHALL be absent rather than
present and refusing.

This is not the lesser account the requirement forbids. Everything recorded about the
place is shown and everything about it can be changed, the city it is filed under
included — what is unavailable is making a *new* city, which is a statement about the trip
rather than about this place. A city is where its places are and nothing resolves a city's
name to a position, so a screen that never shows where anything is cannot show what it
would be creating. The city control on the map is where a city is made, and the place form
raised from the map still offers it.

Where a place on this screen needs a city that does not exist yet, the person SHALL be
able to make it from the city control and return — so the route exists and is one step
longer, rather than being closed.

Where a change made here alters which day a place belongs to, the screen SHALL reflect it
without having to be read again.

Rationale: the map and this screen are two ways of arriving at one place. Presenting a
lesser account of it in one of them would make the screen a dead end for every question
except which day it is on, and a person would learn to leave it to do anything.

#### Scenario: A place is opened from the calendar

- **WHEN** a person opens a place from this screen
- **THEN** they are shown what opening it from the map shows
- **AND** they are offered the same actions on it

#### Scenario: A place is moved to another day from here

- **WHEN** a person changes a place's date from this screen
- **THEN** the place appears on its new day
- **AND** the day being read is not re-read by hand to see it

#### Scenario: Interest is recorded from here

- **WHEN** a person records interest in a place opened from this screen
- **THEN** it is recorded as it would be from the map

#### Scenario: Creating a city is not offered here

- **WHEN** a person opens a place from this screen and looks at its city
- **THEN** no option to create a city is offered
- **AND** no option to create one is shown that would then refuse
- **AND** the trip's existing cities and the unassigned option are offered

#### Scenario: Filing a place under an existing city from here

- **WHEN** a person changes which of the trip's cities a place is filed under, from this
  screen
- **THEN** it is filed there
- **AND** they did not have to return to the map to do it

#### Scenario: Both calendars leave it out

- **WHEN** a place is opened from the calendar on the laptop and on the phone
- **THEN** neither offers to create a city
