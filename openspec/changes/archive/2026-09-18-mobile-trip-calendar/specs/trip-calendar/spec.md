## REMOVED Requirements

### Requirement: This capability is offered by the web application only, for now

**Reason**: This change is what that requirement was waiting for. The arrangement has
been read in both of the web application's shapes and is now built on the phone, so the
exception has nothing left to be an exception for.

**Migration**: Replaced by "Both applications offer the calendar" under ADDED below,
which is the positive both-applications rule `marker-capture` and `trips` already carry.
Nothing stored changes and nothing is re-entered: the phone reads and writes the same
records it already did, and a day set on either application is present on the other.

## ADDED Requirements

### Requirement: Both applications offer the calendar

Every application that displays a trip's markers SHALL offer every capability of this
specification: setting, changing and clearing the trip's dates; giving a place the day it
is planned for, changing it and clearing it; and the screen that reads a trip one day at a
time together with the places still waiting for a day.

Each application SHALL present these in the form native to it and SHALL NOT share rendered
markup with the other. What is shared is the behaviour that groups a trip's places by day,
steps from one day to another, and decides which day to open on — which SHALL remain a
single implementation usable from either platform, so that the two cannot disagree about
what is on a given day.

An application SHALL NOT be the only place a capability of this specification can be
exercised. Either application SHALL be sufficient on its own: a person SHALL be able to
arrange an entire trip by day from one of them and never open the other.

Rationale: this replaces the requirement that the calendar was offered by the web
application only, and it is deliberately stated as the positive rule rather than left as
an absence. The exception was taken because the web application renders both a wide and a
narrow shape, so the arrangement could be read in both before being built a second time;
that reason has now been spent. Stated positively, the rule is what stops the next thing
built on days being built on one platform and called done.

#### Scenario: Arranging a trip by day on either platform

- **WHEN** a person opens a trip on either application
- **THEN** they are offered the screen that reads it one day at a time
- **AND** a way to give a place a day, to change it, and to clear it

#### Scenario: The trip's dates on either platform

- **WHEN** a person opens a trip on either application
- **THEN** they are offered a way to set, change and clear its start and end dates
- **AND** neither application directs them to the other to do it

#### Scenario: A day set on one platform is seen on the other

- **WHEN** a person dates a place on one application and the trip is opened on the other
- **THEN** the place is shown on that day
- **AND** nothing has to be re-entered

#### Scenario: One application is never opened

- **WHEN** a person uses only one of the applications for an entire trip
- **THEN** no capability of this specification is unavailable to them

## MODIFIED Requirements

### Requirement: The calendar is reached from the trip and gives the trip back

The system SHALL make this screen reachable from the trip it belongs to, through the
control that already reveals the actions acting on that trip.

That control SHALL name the view the person is **not** in. On the map it offers this
screen; on this screen it offers the map. A menu that offers to take somebody where they
already are is a row that does nothing, and the person has to press it to find that out.

Leaving for it and returning SHALL be governed by the rule the chrome already carries: the
screen presents a visible way back, and returning restores the same trip and the same city
rather than what a fresh arrival would have chosen.

**The visible way back SHALL be in the header**, and SHALL stand in the space this screen
frees there. Which space that is follows the shape of the screen rather than the platform:

- Where the chrome is wide, that is the band the map spends on the session — finding a
  place, placing one and narrowing the trip — because this screen leaves that band empty
  and going back is the only such control it has.
- Where the chrome is phone-shaped, those three controls stand on the bottom edge rather
  than in the header, and the header's second line is what the map spends on the city.
  This screen names no city, so the way back SHALL take that line, on its own, beneath the
  trip's name.

One rule stated twice rather than two rules: the way back stands where this screen has
stopped spending the header, whichever band that is. This is also where the web
application already places it once its bar takes its phone shape, so the two shapes of one
application agree with each other as well as with the other application.

It SHALL NOT be placed beside the account. Signing out is reached from there, and the
chrome keeps rare destructive controls away from frequent ones so that neither is reached
while aiming for the other. The way out of this screen is the most frequent control on it.

The route through the trip's actions is a second way back and does not satisfy this on its
own: a control that must be opened before it can be seen is not visible.

#### Scenario: The calendar is reached

- **WHEN** a person opens the actions that act on the trip from the map
- **THEN** reaching this screen is among them

#### Scenario: The trip's actions name the other view

- **WHEN** a person opens the actions that act on the trip from this screen
- **THEN** the map is what is offered
- **AND** this screen is not offered to somebody already reading it

#### Scenario: The way back is visible without opening anything

- **WHEN** this screen is shown
- **THEN** a control returning to the map is in the header
- **AND** it is not adjacent to the account

#### Scenario: The way back on a phone-shaped screen

- **WHEN** this screen is shown where the chrome takes its phone shape
- **THEN** the control returning to the map occupies its own line beneath the trip's name
- **AND** it is reachable without scrolling and without opening anything first

#### Scenario: Coming back

- **WHEN** a person leaves this screen to return to the trip
- **THEN** the same trip is shown
- **AND** the same city is the one being worked in

### Requirement: The trip can be changed from the calendar

The trip's name on this screen SHALL open the same actions it opens on the map, and
choosing a different trip SHALL show that trip's calendar rather than returning to the
map.

Where a person belongs to exactly one trip, no choice SHALL be required of them, as
elsewhere.

Changing the trip SHALL replace everything scoped to a trip, and the day being read SHALL
be decided as it is on arrival rather than carried across. Two trips rarely cover the same
dates, so a day carried from one is a day that means nothing in the other — and a calendar
opening on a day outside the trip, holding nothing, reads as a trip with nothing planned.

Where the trip has been changed from this screen, going back SHALL give the map the trip
now being read, not the one the person arrived with. The trip being read is one fact, and
a way back that restores an older answer to it would silently undo a choice somebody made
deliberately — on a platform that holds that choice in the screen being left rather than
in an address, that is what happens unless it is said.

#### Scenario: Another trip is chosen

- **WHEN** a person opens the trip's actions from this screen and chooses another trip
- **THEN** that trip's calendar is shown
- **AND** they are not returned to the map to get there

#### Scenario: The day does not travel between trips

- **WHEN** a person reading one trip's calendar changes to another trip
- **THEN** the day shown is the one a fresh arrival at that trip would have been given
- **AND** not the day they were reading

#### Scenario: Going back after changing the trip

- **WHEN** a person changes the trip from this screen and then returns to the map
- **THEN** the map shows the trip they changed to
- **AND** not the trip they arrived on this screen with

#### Scenario: A person on one trip

- **WHEN** a person who belongs to exactly one trip opens this screen
- **THEN** they are not asked to choose between trips
