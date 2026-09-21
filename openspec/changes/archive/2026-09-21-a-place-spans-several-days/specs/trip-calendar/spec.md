## MODIFIED Requirements

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

**A place may be given a run of days**, and the form SHALL offer that from the same field
rather than from anywhere else. The offer SHALL be made as follows:

- While the place has no day, the form SHALL show the day field alone. It SHALL NOT show a
  second date field, and SHALL NOT show anything offering one.
- Once a day has been chosen, the form SHALL offer, beneath that field, a way to extend
  the place to a run of days. Taking it SHALL reveal a second date field, within the same
  form, naming the last day of the run.
- **Neither the offer nor the second field SHALL name a kind of place.** A run of days is
  a fact about days, and any place may have one. The offer SHALL read `More than one day`
  and the field SHALL be labelled `Until`.
- Revealing the second field SHALL NOT raise a panel over the form, for the reason stated
  above, and SHALL NOT discard or disturb anything already entered.
- Clearing the last day SHALL put the second field away and return the place to a single
  day. This SHALL be the way back out, so that revealing the field is undoable by the same
  person who revealed it.
- Clearing the day SHALL clear the last day with it, and SHALL return the place to the
  ones waiting for a day.
- A form opened on a place that already carries a run of days SHALL open with the second
  field shown and filled, rather than requiring it to be revealed again.
- A last day falling before the day, or given with no day, SHALL be refused. The refusal
  SHALL name the offending field and SHALL preserve everything else entered, as any other
  refusal in this form does.

Rationale for revealing it rather than showing it: almost every place on a trip is one
day, and a second date field standing permanently beneath the first would be a field that
most places pass through empty — on the form every place passes through. The run of days
exists for somewhere you sleep, which is a minority of a trip's places and the one kind
that cannot be recorded truthfully without it. Making the common case cost nothing and the
uncommon case cost one press is the trade this states.

Rationale for clearing the last day as the way out: a separate control for putting the
field away would be a second thing to find, and it would leave open what happens to a date
already typed into a field being hidden. Emptying the field is the same act in both
readings.

Rationale for the wording, which is the part most likely to be changed by somebody who has
not read this: the obvious label is one that says what the run is *for* — `This is a stay`,
or an `Until` hint reading "the last day of the stay". Both are wrong, and in the same way.
`stay` is one of the eight marker types this product has, so a control named for it reads
as setting the type rather than the days; and a run of days is not only ever somewhere you
sleep — a rail pass, a festival, a park pass and a place you are simply going back to all
have one. Naming the days is the only wording true of all of them. This is the category
argument the project has been caught by before: the kind of thing a place is does not
decide what may be recorded about it.

The count of days is likewise days and SHALL NOT be stated in nights. A booking is quoted
in nights, and 8 to 12 April is four nights and five days — but the form asks which days a
place is planned for rather than a check-in and a check-out, so the days entered are the
days shown and nothing is converted. Nights would also be untrue of every run that is not
somewhere you sleep.

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

#### Scenario: The form shows one day field until a day is chosen

- **WHEN** a person opens the form on a place carrying no day
- **THEN** one date field is shown
- **AND** no second date field is shown, and nothing offers one

#### Scenario: A run of days is asked for

- **WHEN** a person chooses a day and then takes the offer to extend the place to a run of
  days
- **THEN** a second date field appears within the same form, naming the last day
- **AND** no panel is raised over the form
- **AND** everything already entered is preserved

#### Scenario: The wording does not name a kind of place

- **WHEN** a person opens the form on a place of any type and chooses a day
- **THEN** the offer reads `More than one day`
- **AND** neither it nor the second field names accommodation or any other kind of place

#### Scenario: A run of days on a place that is not somewhere you sleep

- **WHEN** a person gives a run of days to a rail pass, a festival or a place they are
  going back to
- **THEN** it is offered and worded exactly as it is for a hotel
- **AND** the count reads in days

#### Scenario: A place is saved with a run of days

- **WHEN** a person gives a place a day of the 3rd and a last day of the 6th and saves
- **THEN** the place is stored planned for the 3rd through the 6th
- **AND** it is stored once, as one place

#### Scenario: The second field is put away

- **WHEN** a person clears the last day
- **THEN** the second date field is no longer shown
- **AND** the place is planned for the one day still in the first field

#### Scenario: Clearing the day clears the run

- **WHEN** a person clears the day on a place carrying a run of days
- **THEN** the place carries no day at all
- **AND** it appears among the places waiting for a day

#### Scenario: Editing a place that already spans days

- **WHEN** a person opens the form on a place carrying a run of days
- **THEN** both date fields are shown, filled with the days stored
- **AND** the offer to extend the place is not presented again

#### Scenario: A last day before the day

- **WHEN** a person gives a last day falling before the day and saves
- **THEN** the submission is refused
- **AND** the refusal names the offending field
- **AND** everything else entered is preserved

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

Places SHALL be presented in an order the system defines consistently. This specification
does not fix an order within a day, because a day is a set of places rather than a
sequence — but the same day SHALL NOT be presented in a different order each time it is
read. A place appearing on several days SHALL be ordered on each of them by the same rule
as any other place on that day, and SHALL NOT be given a position of its own.

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
