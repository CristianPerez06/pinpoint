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

The system SHALL show, on the same screen as the days, the places on the trip carrying no
date. Where the days are shown several at once, the places waiting SHALL be shown beside
them, open, without any act to reveal them. Where one day is shown alone, they SHALL be
one press away, in a view of their own beside the day's, as set out in the requirement on
the calendar's shape.

The places waiting SHALL be grouped by the city each is filed under, and each group SHALL
state how many places it holds. The groups SHALL be ordered by the city's name, with the
places filed under no city last, in a group of their own. Within a group, places SHALL be
presented in an order the system defines consistently, so the same list is not presented
in a different order each time it is read.

How many places are waiting in total SHALL be legible without anything being opened,
switched to, or scrolled to.

The places waiting SHALL remain present when there are none, stating that nothing is
waiting, rather than being removed from the screen.

Where there is not room for every place waiting, the places waiting SHALL scroll by
themselves, and SHALL NOT push the days out of view.

Rationale for its presence: these are the places a person came to this screen to deal
with, and on the map a place with no day is indistinguishable from one that has a day.
Without this, filling in a trip means opening places at random hoping to find undated
ones.

Rationale for showing them beside the days where there is room: the work of this screen is
taking a place from the waiting ones and putting it on a day. With both in view, a person
sees the place leave one and arrive on the other. Behind a further act, a place dated from
there simply disappears, and whether it landed where it was meant to is a second trip to
find out. Where there is room for only one day, there is not room for both, and a view of
their own one press away costs less than a region that opens over the day and pushes it
down.

Rationale for grouping by city: a trip's waiting places are commonly counted in tens, and a
day is commonly spent in one city, so the city is the first thing a person looks for when
choosing what to put on it.

Rationale for keeping it when empty: a region that appears and disappears moves everything
beside it, so the screen rearranges itself at the moment the last place is dated — which
is the moment a person is most likely to be still reading it. This repeats a decision
already in force for the control that declares a filter, for the same reason.

A place SHALL move out of this group as soon as it is given a date, and back into it as
soon as its date is cleared, without the screen having to be read again.

#### Scenario: Places are waiting

- **WHEN** a trip holds places carrying no date
- **THEN** they are reachable from the screen showing the days
- **AND** how many there are is stated without anything having to be opened

#### Scenario: Waiting places are grouped by city

- **WHEN** the places waiting are filed under more than one city, and some under none
- **THEN** they are shown in one group per city, each stating how many it holds
- **AND** the groups are ordered by the city's name
- **AND** the places filed under no city are shown last, in a group of their own

#### Scenario: Many places are waiting

- **WHEN** more places are waiting than there is room to show
- **THEN** the rest are reached by scrolling the places waiting
- **AND** the days are not pushed out of view to make room for them

#### Scenario: Nothing is waiting

- **WHEN** every place on the trip carries a date
- **THEN** the places waiting are still present
- **AND** they state that nothing is waiting

#### Scenario: A place is given a day

- **WHEN** a place carrying no date is given one
- **THEN** it leaves the places waiting for a day
- **AND** it appears on the day it was given

#### Scenario: A place's day is cleared

- **WHEN** a place's date is cleared
- **THEN** it rejoins the places waiting for a day, in the group of its city
- **AND** the stated counts reflect it

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

### Requirement: A place opened from the calendar can be looked at on the map, and the calendar is returned to where it was left

A place opened from this screen SHALL offer a way to show it on the map. Doing so SHALL
show the trip's map with that place's details open and the place itself in view — not
beneath the details, whichever shape the screen has.

It SHALL be shown whatever the map is narrowed to. Where the filter set on the workspace
is not drawing the place, it SHALL be opened as a place addressed by identity is opened
(`marker-filtering`): drawn under its details, said to be hidden, and the filter left as
it was.

For as long as those details stay open, they SHALL offer a way **back to the calendar**,
labelled as such rather than by the day it leads to. Using it SHALL return to this screen
on **the day that was being read** when the place was shown on the map, with no place
open. Where the calendar has its phone shape and the person had been reading the places
waiting for a day rather than the days, it SHALL return to that view.

Closing those details SHALL end the detour: the way back to the calendar SHALL go with
them, and the map SHALL be left as an ordinary arrival at it would find it. Saving an edit
to the place, or removing it, closes its details on the map (`marker-capture`), and so
ends the detour too. Details opened
on the map in any other way SHALL NOT offer a way back to the calendar.

While the way back to the calendar is offered, it SHALL be the only way back those details
offer. Where the place shares its point with others, the details SHALL NOT also offer to
return to the choice between them; the others stay reachable by selecting that point on
the map, as any coincident place is (`map-rendering`).

Details opened on the map SHALL NOT offer to show the place on the map; the offer belongs
to this screen, which does not show where anything is.

Returning SHALL show the trip as it now stands: a change made to the place while its
details stayed open on the map — recording interest in it, marking it visited — SHALL be
reflected without the calendar being read again by hand.

The calendar's own way back to the map SHALL be unchanged by this.

Rationale: whether a place belongs on a given day depends mostly on where it is, and this
screen does not show where anything is. The map is looked at to answer that one question,
in the middle of arranging days, so it is a detour rather than a departure — and a detour
that returns somebody to the day the trip opens on, instead of the day they were reading,
makes them find their place again every time they check one. The way back is named for
the screen rather than the day because it leads to one screen, and the day is restored
without having to be named. It does not reopen the place: the person has seen where it is,
and the day they were reading is what they return to act on.

#### Scenario: A place is shown on the map from the calendar

- **WHEN** a person opens a place on this screen and asks to see it on the map
- **THEN** the trip's map is shown with that place's details open
- **AND** the place is in view and not covered by its details

#### Scenario: A place the filter is hiding is shown on the map

- **WHEN** a person asks to see on the map a place the workspace's filter is not drawing
- **THEN** that place's details are open and it is drawn under them
- **AND** it is stated that the filter is hiding it
- **AND** the filter is unchanged

#### Scenario: Returning to the day being read

- **WHEN** a person reading a day that is not the one this screen opens on shows a place on the map and then goes back to the calendar
- **THEN** that same day is the one being read
- **AND** no place is open

#### Scenario: Returning to the places waiting for a day on a phone-shaped screen

- **WHEN** a person reading the places waiting for a day on a phone-shaped screen shows one of them on the map and then goes back to the calendar
- **THEN** the places waiting for a day are what is shown

#### Scenario: Closing the place ends the detour

- **WHEN** a place shown on the map from this screen has its details closed
- **THEN** no way back to the calendar is offered
- **AND** the map is shown as it would be to any arrival at it

#### Scenario: A place opened on the map in the ordinary way

- **WHEN** a person opens a place from the map itself, or from a search
- **THEN** its details offer no way back to the calendar

#### Scenario: A place sharing its point with others

- **WHEN** a place shown on the map from this screen shares its point with other places
- **THEN** its details offer the way back to the calendar
- **AND** they do not offer a way back to the other places at that point
- **AND** selecting that point on the map still offers every place there

#### Scenario: Editing the place on the map ends the detour

- **WHEN** a person shows a place on the map and saves an edit to it there
- **THEN** its details close as they do for any edit on the map
- **AND** no way back to the calendar is offered

#### Scenario: A change made on the map is reflected on return

- **WHEN** a person shows a place on the map, marks it visited there, and goes back to the calendar
- **THEN** the place is shown as visited
- **AND** the calendar was not read again by hand

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
visible while a day is being filled in. The places waiting for a day SHALL be shown once,
beside those days, as a column of their own.

Where it is not, the system SHALL show the day being read alone, and SHALL offer two views
of the screen, switched between by a control directly beneath the header: **Days**, showing
the controls for choosing and stepping and the day being read; and **No day yet**, showing
the places waiting for a day. The control that switches to the places waiting SHALL state
how many there are, so that the count is legible from either view. The controls for
choosing and stepping SHALL be shown in the Days view only, because they change nothing
about the places waiting.

The screen SHALL open on the Days view, every time it is arrived at — including by
changing the trip being read, which is arriving at that trip. It SHALL NOT remember the
view last used. The day is what this screen is most often opened to read, and a screen
that opens differently from one visit to the next has to be read before it can be used.

Switching between the two views SHALL NOT change the day being read.

The controls for choosing and stepping SHALL sit beneath the header and SHALL NOT sit
within it. They belong to the screen rather than to the product: the header says which
trip and who is reading it, and neither changes as the day does. Where the screen is
wide, they SHALL be the first thing below the header. Where it is not, the control
switching between the two views comes first, and they SHALL be the first thing below that.

The controls for choosing and stepping SHALL be reachable without scrolling wherever they
are shown, because they are how the screen is navigated and a screen whose navigation
scrolls away strands whoever is at the bottom of a long day. Placing them below the
header does not relax this: they are pinned above whatever scrolls rather than carried
along by it. The same holds for the control switching between the two views.

Rationale: this follows the rule already in force that chrome follows the shape of the
screen rather than the platform, so it binds any application whose screen takes that
shape rather than one particular application.

#### Scenario: A wide screen

- **WHEN** this screen is read on a screen wide enough for it
- **THEN** the previous day, the day being read, and the next day are shown together
- **AND** which of them is the day being read is apparent
- **AND** the places waiting for a day are shown beside them, without any act to reveal
  them

#### Scenario: A narrow screen

- **WHEN** this screen is read on a screen that is not wide enough
- **THEN** the day being read is shown alone
- **AND** a control directly beneath the header switches between Days and No day yet
- **AND** that control states how many places are waiting

#### Scenario: The narrow screen opens on the day

- **WHEN** this screen is arrived at on a screen that is not wide enough
- **THEN** the Days view is shown
- **AND** this holds whichever view was shown when the screen was last left

#### Scenario: Changing trip on a narrow screen

- **WHEN** the trip being read is changed while the No day yet view is shown
- **THEN** the calendar of the trip arrived at opens on the Days view

#### Scenario: Switching view keeps the day

- **WHEN** a person switches to No day yet and back to Days
- **THEN** the day being read is the one that was being read before

#### Scenario: The day controls are below the header

- **WHEN** this screen is shown
- **THEN** the controls for stepping and for choosing a day are beneath the header
- **AND** they are not among the header's own controls

#### Scenario: The day controls belong to the Days view

- **WHEN** the No day yet view is shown on a screen that is not wide enough
- **THEN** the controls for stepping and for choosing a day are not shown

#### Scenario: The navigation stays put

- **WHEN** a person scrolls to the end of a day holding many places
- **THEN** the controls for stepping and for choosing a day are still reachable
- **AND** where the screen is not wide enough, so is the control switching between the
  two views

#### Scenario: The waiting places are not repeated

- **WHEN** more than one day is shown at once
- **THEN** the places waiting for a day are shown once
- **AND** not beneath or beside each day

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

### Requirement: The calendar is drawn before its data arrives

Every application SHALL draw the calendar screen before the data it shows has been read:
the header, the controls for stepping and choosing a day, the days, and the places
waiting for a day, each where it will stand once the data arrives and in the shape the
screen will take — three days beside the places waiting where the screen is wide, one day
with the control switching views where it is not. The calendar meets every requirement of
`waiting-screens`; what follows is particular to it.

A loading state SHALL NOT be shown in place of the calendar, and the calendar SHALL NOT
be preceded by another screen's waiting state.

Where the screen names something it has not yet read — the trip, the person signed in,
the day in the control for choosing one, the name of each day shown, the name of each
city, or the number of places waiting — it SHALL stand a drawn placeholder in that
name's place, and SHALL NOT write text there.

Where the screen will list places it has not yet read, it SHALL stand drawn rows the
shape of a place in their place: three in each day shown, and under the places waiting,
two groups of three and two with a drawn placeholder for each city's name. That number
SHALL NOT depend on the trip. Until a trip's places have been read, no day SHALL be shown
as having nothing planned, and no count of places waiting SHALL be shown.

Text that is true before anything has been read — the names of the two views, the label
of the control for choosing a day, the heading of the places waiting, and the way back to
the map — SHALL be written as it will be once the data arrives.

When the data arrives, the header, the day controls, the days and the places waiting SHALL
stand where they stood, and the drawn rows SHALL be replaced by the places.

Rationale: this is the rule `waiting-screens` states for every screen, applied to the
calendar's parts. An empty day is worse than a blank screen, because it is a claim — that
nothing is planned — and it is false for as long as the places are still being read. A
fixed number of rows says only that places go here; a number that followed the trip would
be a count, and a count is the thing not yet known.

#### Scenario: The calendar is opened on a wide screen

- **WHEN** the calendar is shown on a wide screen before the trip's data has arrived
- **THEN** the header, the day controls, three days and the places waiting are drawn
- **AND** each day holds three drawn rows
- **AND** the places waiting hold two groups of three and two drawn rows
- **AND** no loading state and no other screen is shown in place of it

#### Scenario: The calendar is opened on a narrow screen

- **WHEN** the calendar is shown on a narrow screen before the trip's data has arrived
- **THEN** the header, the control switching views, the day controls, and one day are
  drawn
- **AND** the Days view is the one shown
- **AND** the control switching to the places waiting stands a drawn placeholder where
  the count will be

#### Scenario: A name has not arrived

- **WHEN** the calendar is drawn before the trip's data has arrived
- **THEN** a drawn placeholder stands where the trip's name, the person's name, the day
  in the day control, each day's name and each city's name will be
- **AND** no text stands in place of any of them

#### Scenario: The trip is known and its places are not

- **WHEN** the trip has been read and its places have not
- **THEN** each day shown holds drawn rows
- **AND** no day is shown as having nothing planned
- **AND** no count of places waiting is shown

#### Scenario: The placeholders are still

- **WHEN** the calendar is drawn before its data has arrived
- **THEN** no placeholder moves, shimmers or pulses

#### Scenario: A control is reached before its data

- **WHEN** a control on the calendar is reached, by pointer, keyboard or screen reader,
  before the data its act needs has arrived
- **THEN** it is present in the tab order
- **AND** it is reported as unavailable
- **AND** activating it does nothing

#### Scenario: The calendar is loading for a screen reader

- **WHEN** the calendar is drawn before its data has arrived
- **THEN** assistive technology is told that the calendar is loading
- **AND** the drawn placeholders are not read out

#### Scenario: The data arrives

- **WHEN** the calendar's data arrives while the waiting calendar is shown
- **THEN** the header, the day controls, the days and the places waiting stand where they
  stood
- **AND** none of them changes size
- **AND** the placeholders are replaced by what they stood for
