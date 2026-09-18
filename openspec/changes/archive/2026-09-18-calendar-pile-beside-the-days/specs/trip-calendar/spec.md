## MODIFIED Requirements

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
