## MODIFIED Requirements

### Requirement: A trip's places can be read one day at a time

The system SHALL provide a screen showing a single day of a trip and the places dated to
that day, with each place named and identifiable as the place it is.

**A place planned for a run of days SHALL appear on every day of that run**, from its
first through its last, and SHALL be counted on each of them wherever that day's places
are counted. It SHALL be the same place on each: opening it from any day of its run SHALL
present the one place, and there SHALL be no separate entry per day.

**On every day of a run, the place SHALL state which day of the run it is and how many
days the run holds** — the first day included, so that it reads the same way throughout.
A place planned for a single day SHALL state nothing of the kind, there being no run to
place it in.

**Saying so SHALL NOT take room from the place's name.** The name is what the row is for,
and it SHALL have the same room on a row carrying this count as on a row without one, at
every width the application renders. A place's name SHALL NOT be shortened, clipped or
ellipsised to make room for it.

Rationale: a day in the middle of a stay is not a day you are doing that place, and
without the count it reads as something newly planned for that day. With it, a reader can
see at a glance that it carries over and how far through it they are. Stating it on the
first day as well as the rest avoids a place that reads one way on one day and another way
on the next, which would make the wording itself something to interpret.

Rationale for protecting the name, which is the part worth stating rather than leaving to
whoever draws it: the obvious place for a short count is beside the name on the same line,
where a place row already carries whether somewhere has been visited. That row gives the
name the space left over — so on a phone the count is taken out of the name, and a place
called `Kyōto International Manga Museum` is cut to a few characters to make room for
`Day 3 of 5`. It compounds where a place is both visited and part of a run, which is the
ordinary state of a hotel halfway through a stay: two such marks, one name, and the name
is what gives way. The rule is written as an obligation about the name rather than as an
instruction to put the count on a second line, because the second line is one way to keep
it and the requirement is the keeping.

A day holding no places SHALL say so rather than appearing as an error or as a blank
region. An empty day is the ordinary state of most days on most trips and is information
in its own right. **A day holding only places that are part of a run SHALL NOT be shown as
holding nothing**: those places are on that day, and a day that says it is empty while
showing a hotel would contradict itself.

The screen SHALL open on the day most likely to be wanted, determined as follows: today,
where the trip carries dates and today falls within them; otherwise the trip's start
date, where it carries one; otherwise today.

**Today SHALL mean today where the reader is standing**, and the screen SHALL NOT be
drawn showing a today worked out anywhere else — including, where an application draws
part of a screen before it reaches the reader, a today belonging to whatever prepared it.

Where the day depends on which clock is asked, whatever prepares the screen SHALL draw it
as waiting for its day rather than committing to one, and the reader's own device SHALL
supply it. No day other than the reader's SHALL be shown, even briefly, and no day already
shown SHALL be replaced by a different one.

Where the day does not depend on which clock is asked — a trip whose start date is the
answer whichever of the three possible todays is used — it SHALL be drawn straight away,
so that waiting is confined to the case that needs it.

Rationale: a trip is read while travelling, which is exactly when the reader's day and a
server's day differ. A calendar that opens on yesterday is not obviously wrong to look at
— it is a real day, correctly drawn, holding whatever that day holds — so nothing on
screen invites the reader to doubt it.

**That same rule SHALL decide the day whenever the trip being read changes**, rather than
a second rule written for switching. Changing trip is arriving at that trip, and one rule
stated once cannot drift from itself.

**A day's places SHALL be presented in that day's order** — the order the people on the
trip have put them in, as described in *A day's places can be put in order*. The same day
SHALL NOT be presented in a different order each time it is read. A place appearing on
several days SHALL hold its own position on each of them, set independently on each day
like that of any other place on it.

#### Scenario: A day holding places

- **WHEN** a person reads a day to which places are dated
- **THEN** each of those places is named
- **AND** no place dated to another day appears among them

#### Scenario: A day in the middle of a run

- **WHEN** a person reads the 4th, and a place is planned for the 3rd through the 6th
- **THEN** that place is shown on the 4th
- **AND** it states that it is the second of four days

#### Scenario: The first day of a run

- **WHEN** a person reads the 3rd, and a place is planned for the 3rd through the 6th
- **THEN** that place states that it is the first of four days
- **AND** it reads the same way it does on the days that follow

#### Scenario: A day holding only a run

- **WHEN** a person reads a day whose only place is one planned for a run of days
- **THEN** that place is shown
- **AND** the day is not stated to hold nothing

#### Scenario: A place on a run is opened from any of its days

- **WHEN** a person opens a place from the 4th and again from the 6th of its run
- **THEN** the same one place is presented each time
- **AND** it is not presented as two places

#### Scenario: A place planned for one day says nothing of a run

- **WHEN** a person reads a day holding a place planned for that day alone
- **THEN** that place states no count of days

#### Scenario: A long name on a narrow screen, on a day of a run

- **WHEN** a place with a long name, planned for a run of days, is read on the narrowest
  screen the application renders
- **THEN** its name has the room it would have had without the count
- **AND** it is not shortened or clipped to make room for it

#### Scenario: A place that is both visited and part of a run

- **WHEN** a person reads a day holding a place that is marked visited and is part of a
  run of days
- **THEN** both are stated
- **AND** neither is stated at the cost of the place's name

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

#### Scenario: Opening away from where the screen was prepared

- **WHEN** a person in one timezone opens the screen for a trip carrying no dates, and
  the part of the screen prepared before it reached them was prepared where the date
  differs
- **THEN** the screen is drawn waiting for its day rather than carrying one
- **AND** the day it settles on is the reader's own today
- **AND** no other day is shown first

#### Scenario: A trip whose opening day no clock can disagree about

- **WHEN** a person opens the screen for a trip whose start date is the answer wherever
  the screen is prepared
- **THEN** that day is drawn without waiting for the reader's own device

#### Scenario: Arriving by changing trip

- **WHEN** the trip being read changes
- **THEN** the day shown is the one this rule gives for the trip arrived at
- **AND** it is the same day a fresh arrival at that trip would have been given

#### Scenario: The same day read twice

- **WHEN** a person reads one day, leaves, and reads it again
- **THEN** its places are presented in the same order

## ADDED Requirements

### Requirement: A day's places can be put in order

Every application SHALL let a person put the places on a day in the order they plan to do
them, from the calendar, by dragging a place up or down within its day. The list SHALL
show the new order as soon as the place is let go, before anything is saved.

Ordering SHALL be confined to one day: a place SHALL NOT be dragged onto another day, and
nothing else about a place — its day, its city, anything recorded on it — SHALL change by
reordering it. A place's day SHALL still be changed on the place itself.

**Dragging SHALL have a second route.** Every place in a day's list SHALL be movable one
step up or one step down without dragging, by keyboard where there is one and by a
screen reader's own actions on both applications. Each step SHALL be announced with the
place's new position and how many places the day holds. A place already first SHALL NOT
offer to move up, and one already last SHALL NOT offer to move down.

**Starting a drag SHALL NOT be possible from the place's name.** Pressing a place SHALL
still open it, and on the phone a vertical swipe over a place SHALL still scroll the list.
Dragging SHALL begin from a handle drawn on each row for that purpose.

**The order SHALL be saved one second after the last change to that day**, as a single
save of the whole day's order. Several changes made within that second of each other SHALL
result in one save, of the final order. Leaving the calendar, or the day, before the
second has passed SHALL save the pending order rather than discard it.

**Where that save fails**, the day SHALL return to the last order that was saved, and the
calendar SHALL say, in the line it uses to report on the trip, that the order could not
be saved. The order shown SHALL NOT stay in a state the trip does not hold.

**Every place on a day SHALL have a position on it**, determined as follows:

- A place that joins a day — given a day for the first time, moved from another day, or
  given a run of days that now reaches this one — SHALL be placed last on that day.
- A place that leaves a day — moved to another day, cleared of its day, removed from the
  trip, or no longer reached by its run — SHALL leave no gap: the places after it SHALL
  each move up one.
- Places that were planned for a day before days could be ordered SHALL keep the order
  they were presented in until then, which was by name.

While a day's new order is waiting to be saved, a re-read of the trip SHALL NOT replace
it with the order held before the change.

Where two people change the same day's order at the same time, the later save SHALL be
the order the day holds; a place added to the day by somebody else meanwhile SHALL NOT be
lost from it by either save, and SHALL appear last.

The places waiting for a day SHALL NOT be ordered by anyone: they stay grouped by city and
listed as they are today.

#### Scenario: Dragging a place up

- **WHEN** a person drags the third place on a day above the first
- **THEN** the list shows it first straight away
- **AND** the others follow in their previous order

#### Scenario: Several quick changes save once

- **WHEN** a person moves three places in a day within a second of each other
- **THEN** one save of the day's final order is made, a second after the last move
- **AND** reading the day again shows that order

#### Scenario: Leaving before the save

- **WHEN** a person reorders a day and leaves the calendar within the second
- **THEN** the new order is saved
- **AND** it is the order shown when the day is read again

#### Scenario: A failed save

- **WHEN** saving a day's new order fails
- **THEN** the day shows the last order that was saved
- **AND** the calendar says the order could not be saved

#### Scenario: Moving a place without dragging

- **WHEN** a person using a screen reader moves the second of four places down one step
- **THEN** it becomes the third
- **AND** its new position and the day's count are announced

#### Scenario: Pressing a place still opens it

- **WHEN** a person presses a place's name in a day's list
- **THEN** the place opens
- **AND** no drag begins

#### Scenario: A place given a day goes last

- **WHEN** a place is given a day already holding three places
- **THEN** it is the fourth place on that day

#### Scenario: A place moved to another day

- **WHEN** the second of four places on the 3rd is moved to the 5th
- **THEN** it is last on the 5th
- **AND** the 3rd holds three places, numbered one to three

#### Scenario: A place planned for several days

- **WHEN** a place planned for the 3rd through the 6th is moved to the top of the 4th
- **THEN** it is first on the 4th
- **AND** its position on the 3rd, the 5th and the 6th is unchanged

#### Scenario: Days planned before ordering existed

- **WHEN** a day planned before this change is first read after it
- **THEN** its places are in the order they were shown in before, by name

#### Scenario: Somebody else adds a place while the day is being ordered

- **WHEN** one person is reordering a day and another gives a place that day
- **THEN** after both saves the added place is on the day, last
