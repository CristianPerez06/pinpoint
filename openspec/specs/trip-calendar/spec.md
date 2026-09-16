# trip-calendar Specification

## Purpose

Define how a trip's saved places are read and arranged by day: setting the dates a trip
runs between, giving a place the day it is planned for, and the screen that shows one day
at a time along with the places still waiting for one. Days are a second grouping beside
cities rather than a level underneath them, and this capability is deliberately a wishlist
arranged by day rather than a schedule.

## Requirements

### Requirement: A trip's dates are offered when it is created and can be changed afterwards

The system SHALL offer a start date and an end date while a trip is being created, and
SHALL allow both to be left blank. Creating a trip SHALL NOT require either.

Any member SHALL be able to set, change, and clear a trip's dates after it has been
created, without creating another trip and without affecting its name, its cities, its
markers, its memberships, or any recorded interest.

Where a submission states an end date falling before the start date, the system SHALL
refuse it, SHALL name the offending field, and SHALL preserve everything else entered.

Rationale for leaving both optional at creation: a trip is frequently created before its
dates are known — the list of places is what accumulates first, and the dates are settled
later or never. Requiring them would make the product refuse the state most trips start
in, to obtain a value that constrains nothing.

#### Scenario: A trip is created without dates

- **WHEN** a person creates a trip and leaves both dates blank
- **THEN** the trip is created
- **AND** they are not asked for dates again before using it

#### Scenario: A trip is created with dates

- **WHEN** a person creates a trip and supplies a start and an end date
- **THEN** both are recorded on the trip

#### Scenario: Dates are added to an existing trip

- **WHEN** a member sets the dates on a trip that had none
- **THEN** the dates are recorded
- **AND** its name, cities, markers, members and recorded interest are unchanged

#### Scenario: Dates are cleared

- **WHEN** a member clears a trip's dates
- **THEN** the trip carries no dates
- **AND** no marker's date is changed

#### Scenario: An end date before the start date

- **WHEN** a member supplies an end date falling before the start date
- **THEN** the submission is refused
- **AND** the refusal names the offending field
- **AND** everything else entered is preserved

### Requirement: A place is given its day on the place itself

The day a place is planned for SHALL be set and changed on the place, in the same form
that captures what else is known about it, offered beside the city rather than as a
separate act.

Rationale: a city and a date are the same kind of thing — two groupings a person chooses
for a place, neither inside the other. Changing a place's day should therefore work the
way changing its city already works, so that there is nothing new to learn and only one
place to look.

The control SHALL be a field within that form. It SHALL NOT raise a further panel over
the form, because the form is itself already raised over what the person was reading, and
a second layer buries the thing being edited underneath two.

Clearing the date SHALL be possible from the same field, and SHALL return the place to
having no day rather than to any particular one.

Saving a change of date SHALL be governed by the same rules as any other change to a
place, including the refusal of a save based on a stale read.

#### Scenario: A day is chosen while a place is being saved

- **WHEN** a person saves a place and chooses a date in the form
- **THEN** the place is stored carrying that date

#### Scenario: A place's day is changed

- **WHEN** a person edits a saved place and changes its date
- **THEN** the place carries the new date
- **AND** nothing else about the place is changed

#### Scenario: A place's day is cleared

- **WHEN** a person edits a saved place and clears its date
- **THEN** the place carries no date
- **AND** it appears among the places waiting for a day

#### Scenario: The date field raises nothing over the form

- **WHEN** the date field is used
- **THEN** no panel of the product's own is raised over the form
- **AND** what has been typed into the form remains visible or is preserved

#### Scenario: A date change based on a stale read

- **WHEN** two members change the same place and one saves first
- **THEN** the second save is refused rather than applied
- **AND** what that member entered is preserved

### Requirement: A trip's places can be read one day at a time

The system SHALL provide a screen showing a single day of a trip and the places dated to
that day, with each place named and identifiable as the place it is.

A day holding no places SHALL say so rather than appearing as an error or as a blank
region. An empty day is the ordinary state of most days on most trips and is information
in its own right.

The screen SHALL open on the day most likely to be wanted, determined as follows: today,
where the trip carries dates and today falls within them; otherwise the trip's start
date, where it carries one; otherwise today.

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

#### Scenario: The same day read twice

- **WHEN** a person reads one day, leaves, and reads it again
- **THEN** its places are presented in the same order

### Requirement: The day being read is changed by stepping or by choosing, and never by scrolling

The system SHALL offer stepping to the previous day and to the next day, and SHALL offer
choosing a day directly.

Scrolling SHALL move through what the screen holds and SHALL NOT change the day being
read.

Rationale, and it is the reason this is stated rather than left to judgement: a day can
hold more places than fit, so the screen has to scroll to show the rest of that day. If
scrolling also stepped to another day, the two meanings would be indistinguishable before
the gesture is made, and reaching the last place of a busy day would require passing
through the boundary that moves off it. The day changes only when a person asks for
another day.

Stepping and choosing SHALL agree: whichever is used, the other SHALL reflect the day
now being read.

The controls SHALL state in words which day they lead to, in every rendering, so that the
step is announced to somebody who is not looking at the screen. An arrow alone conveys
nothing to a screen reader.

Stepping SHALL NOT be bounded by the trip's dates. Any day SHALL be reachable, so that a
place dated outside the trip is reachable rather than existing on a day the screen refuses
to show.

#### Scenario: Stepping to another day

- **WHEN** a person steps to the next day
- **THEN** that day's places are shown
- **AND** the control for choosing a day names the day now being read

#### Scenario: Choosing a day directly

- **WHEN** a person chooses a day directly
- **THEN** that day's places are shown
- **AND** stepping from there moves relative to the day chosen

#### Scenario: A day holding more places than fit

- **WHEN** a person scrolls through a day holding more places than the screen can show
- **THEN** the rest of that day's places are revealed
- **AND** the day being read does not change

#### Scenario: A day outside the trip's dates

- **WHEN** a person steps beyond the trip's start or end date
- **THEN** that day is shown
- **AND** any place dated to it is shown on it

#### Scenario: The step is announced in words

- **WHEN** the controls for stepping are read by a screen reader
- **THEN** each states which day it leads to
- **AND** the meaning does not depend on a glyph being resolved

### Requirement: The places waiting for a day are shown with the days

The system SHALL show, on the same screen, the places on the trip carrying no date,
placed above the day being read rather than behind a further act.

This SHALL be collapsed by default and SHALL state how many places it holds while
collapsed, so that the count is legible without opening it.

It SHALL remain present when it holds nothing, stating that nothing is waiting, rather
than being removed from the screen.

Rationale for its presence: these are the places a person came to this screen to deal
with, and on the map a place with no day is indistinguishable from one that has a day.
Without this, filling in a trip means opening places at random hoping to find undated
ones.

Rationale for keeping it when empty: a region that appears and disappears moves everything
below it, so the screen rearranges itself at the moment the last place is dated — which is
the moment a person is most likely to be still reading it. This repeats a decision already
in force for the control that declares a filter, for the same reason.

A place SHALL move out of this group as soon as it is given a date, and back into it as
soon as its date is cleared, without the screen having to be read again.

#### Scenario: Places are waiting

- **WHEN** a trip holds places carrying no date
- **THEN** they are reachable from the screen showing the days
- **AND** how many there are is stated without it having to be opened

#### Scenario: Nothing is waiting

- **WHEN** every place on the trip carries a date
- **THEN** the group is still present
- **AND** it states that nothing is waiting

#### Scenario: A place is given a day

- **WHEN** a place carrying no date is given one
- **THEN** it leaves the group of places waiting for a day
- **AND** it appears on the day it was given

#### Scenario: A place's day is cleared

- **WHEN** a place's date is cleared
- **THEN** it rejoins the places waiting for a day
- **AND** the stated count reflects it

### Requirement: A place opened from the calendar shows what it shows on the map

Opening a place from this screen SHALL present the same account of it that opening it
from the map presents — the same fields, recording interest, marking it visited, and the
same route to editing and removing it.

A person SHALL NOT have to return to the map to learn or change anything about a place
they have found here.

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

### Requirement: The calendar shows every place on the trip, whatever the map is narrowed to

This screen SHALL show every place on the trip, and SHALL NOT apply any filter set on the
workspace it was reached from.

Rationale: a filtered calendar would present a day as emptier than it is, and would
under-count the places still waiting for a day — so a person would believe they had
finished arranging a trip that they had not. The control that would have explained the
absence is on the screen they left, so nothing here could say why the places were missing.
`marker-filtering` bounds its own rule accordingly.

#### Scenario: A filter is applied and the calendar is opened

- **WHEN** a person narrows the map and then opens this screen
- **THEN** every place on the trip is shown on its day
- **AND** a place the filter hides is not omitted

#### Scenario: The places waiting for a day are counted in full

- **WHEN** a filter is applied on the workspace
- **THEN** the count of places waiting for a day counts every undated place on the trip
- **AND** not only those the filter would show

### Requirement: The calendar's shape follows the shape of the screen

Where the screen is wide enough, the system SHALL show the day being read together with
the day before it and the day after it, so that what is already arranged either side is
visible while a day is being filled in.

Where it is not, the system SHALL show the day being read alone.

The controls for choosing and stepping SHALL be reachable without scrolling in both
shapes, because they are how the screen is navigated and a screen whose navigation
scrolls away strands whoever is at the bottom of a long day.

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

Leaving for it and returning SHALL be governed by the rule the chrome already carries: the
screen presents a visible way back, and returning restores the same trip and the same city
rather than what a fresh arrival would have chosen.

#### Scenario: The calendar is reached

- **WHEN** a person opens the actions that act on the trip
- **THEN** reaching this screen is among them

#### Scenario: Coming back

- **WHEN** a person leaves this screen to return to the trip
- **THEN** the same trip is shown
- **AND** the same city is the one being worked in

### Requirement: This capability is offered by the web application only, for now

Until a subsequent change brings it to the other application, this capability SHALL be
offered by the web application alone. The other application SHALL continue to read and
write the same records, SHALL NOT be broken by the presence of a date it does not show,
and SHALL NOT present a partial version of this capability.

This is a stated exception to the rule that either application is sufficient on its own,
and it is temporary. It is taken because the web application renders both a wide and a
narrow shape, so the arrangement above can be read in both before it is built a second
time.

Stating it as a requirement rather than leaving it as an absence is deliberate, and
follows the route `marker-capture` already took: that specification carried a requirement
that capture was offered by the web application only, and a later change replaced it with
the positive both-applications rule that now stands. An absence records no decision and no
obligation; a requirement that has to be replaced records both.

#### Scenario: The other application opens a trip carrying dates

- **WHEN** a trip whose markers carry dates is opened on the application that does not
  offer this capability
- **THEN** every marker is shown as it was before
- **AND** nothing fails on account of a date it does not present

#### Scenario: A place is dated on one application

- **WHEN** a person dates a place on the web application
- **THEN** the date is stored on the trip
- **AND** it is present when the capability arrives on the other application, without
  anything being re-entered
