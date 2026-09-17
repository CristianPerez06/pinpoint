## ADDED Requirements

### Requirement: The calendar wears the product's header without being the workspace

This screen SHALL carry the same header the trip workspace carries, in the same
arrangement: the product's mark, then the trip's name as the control that reveals the
actions acting on that trip, then the account at the far end.

It SHALL show, of the workspace's controls, only those it can act on. The city being
worked in, finding a place, placing one by hand and narrowing the trip SHALL NOT appear
here. There is no camera to frame, no map to narrow and nowhere to drop, so each of them
would be a control that appears to offer more than it offers — which the chrome already
forbids.

**This screen is not a trip workspace, and SHALL NOT be read as one.** The requirements
written about the workspace — that it displays the city being worked in, that the
session's tools stay reachable — describe the screen the map is on. This one replaces
that screen rather than sitting inside it, which is the distinction `marker-filtering`
already draws about what a filter reaches.

Stating this is the point of the requirement. A bar carrying a trip's name and no city
beside it is, to anyone reading the chrome's rules, either a decision or a defect, and
nothing else on the screen says which.

#### Scenario: The header is the product's

- **WHEN** a person opens this screen
- **THEN** the mark, the trip's name and the account are placed as they are on the map
- **AND** the bar reads as the same bar rather than as this screen's own

#### Scenario: The controls with nothing to act on are absent

- **WHEN** this screen is shown
- **THEN** no control for the city being worked in, for finding a place, for placing one
  by hand, or for narrowing the trip appears in its header

#### Scenario: The absent city is not a defect

- **WHEN** the chrome's rules are read against this screen
- **THEN** this screen is not one of the workspaces they describe
- **AND** the absence of a city control is the stated decision rather than an omission

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

#### Scenario: Another trip is chosen

- **WHEN** a person opens the trip's actions from this screen and chooses another trip
- **THEN** that trip's calendar is shown
- **AND** they are not returned to the map to get there

#### Scenario: The day does not travel between trips

- **WHEN** a person reading one trip's calendar changes to another trip
- **THEN** the day shown is the one a fresh arrival at that trip would have been given
- **AND** not the day they were reading

#### Scenario: A person on one trip

- **WHEN** a person who belongs to exactly one trip opens this screen
- **THEN** they are not asked to choose between trips

## MODIFIED Requirements

### Requirement: A trip's places can be read one day at a time

The system SHALL provide a screen showing a single day of a trip and the places dated to
that day, with each place named and identifiable as the place it is.

A day holding no places SHALL say so rather than appearing as an error or as a blank
region. An empty day is the ordinary state of most days on most trips and is information
in its own right.

The screen SHALL open on the day most likely to be wanted, determined as follows: today,
where the trip carries dates and today falls within them; otherwise the trip's start
date, where it carries one; otherwise today.

**That same rule SHALL decide the day whenever the trip being read changes**, rather than
a second rule written for switching. Changing trip is arriving at that trip, and one rule
stated once cannot drift from itself.

Places SHALL be presented in an order the system defines consistently. This specification
does not fix an order within a day, because a day is a set of places rather than a
sequence — but the same day SHALL NOT be presented in a different order each time it is
read.

#### Scenario: A day holding places

- **WHEN** a person reads a day to which places are dated
- **THEN** each of those places is named
- **AND** no place dated to another day appears among them

#### Scenario: A day holding nothing

- **WHEN** a person reads a day to which no place is dated
- **THEN** the screen states that the day holds nothing
- **AND** it is not presented as a failure

#### Scenario: Opening during the trip

- **WHEN** a person opens the screen for a trip whose dates include today
- **THEN** today is the day shown

#### Scenario: Opening before or after the trip

- **WHEN** a person opens the screen for a trip whose dates do not include today
- **THEN** the trip's start date is the day shown

#### Scenario: Opening for a trip with no dates

- **WHEN** a person opens the screen for a trip carrying no dates
- **THEN** today is the day shown

#### Scenario: Arriving by changing trip

- **WHEN** the trip being read changes
- **THEN** the day shown is the one this rule gives for the trip arrived at
- **AND** it is the same day a fresh arrival at that trip would have been given

#### Scenario: The same day read twice

- **WHEN** a person reads one day, leaves, and reads it again
- **THEN** its places are presented in the same order

### Requirement: The calendar's shape follows the shape of the screen

Where the screen is wide enough, the system SHALL show the day being read together with
the day before it and the day after it, so that what is already arranged either side is
visible while a day is being filled in.

Where it is not, the system SHALL show the day being read alone.

The controls for choosing and stepping SHALL be the first thing below the header and
SHALL NOT sit within it. They belong to the screen rather than to the product: the header
says which trip and who is reading it, and neither changes as the day does.

The controls for choosing and stepping SHALL be reachable without scrolling in both
shapes, because they are how the screen is navigated and a screen whose navigation
scrolls away strands whoever is at the bottom of a long day. Placing them below the
header does not relax this: they are pinned above whatever scrolls rather than carried
along by it.

The places waiting for a day SHALL be shown once, above the days, in both shapes, rather
than once per day shown.

Rationale: this follows the rule already in force that chrome follows the shape of the
screen rather than the platform, so it binds any application whose screen takes that
shape rather than one particular application.

#### Scenario: A wide screen

- **WHEN** this screen is read on a screen wide enough for it
- **THEN** the previous day, the day being read, and the next day are shown together
- **AND** which of them is the day being read is apparent

#### Scenario: A narrow screen

- **WHEN** this screen is read on a screen that is not wide enough
- **THEN** the day being read is shown alone

#### Scenario: The day controls are below the header

- **WHEN** this screen is shown
- **THEN** the controls for stepping and for choosing a day are the first thing beneath
  the header
- **AND** they are not among the header's own controls

#### Scenario: The navigation stays put

- **WHEN** a person scrolls to the end of a day holding many places
- **THEN** the controls for stepping and for choosing a day are still reachable

#### Scenario: The waiting places are not repeated

- **WHEN** more than one day is shown at once
- **THEN** the places waiting for a day are shown once
- **AND** not beneath or beside each day

### Requirement: The calendar is reached from the trip and gives the trip back

The system SHALL make this screen reachable from the trip it belongs to, through the
control that already reveals the actions acting on that trip.

That control SHALL name the view the person is **not** in. On the map it offers this
screen; on this screen it offers the map. A menu that offers to take somebody where they
already are is a row that does nothing, and the person has to press it to find that out.

Leaving for it and returning SHALL be governed by the rule the chrome already carries: the
screen presents a visible way back, and returning restores the same trip and the same city
rather than what a fresh arrival would have chosen.

**The visible way back SHALL be in the header**, among the controls the map spends on the
session — finding a place, placing one and narrowing the trip — because that is the band
this screen leaves empty and going back is the only such control it has.

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

#### Scenario: Coming back

- **WHEN** a person leaves this screen to return to the trip
- **THEN** the same trip is shown
- **AND** the same city is the one being worked in
