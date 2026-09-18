## ADDED Requirements

### Requirement: The calendar is drawn before its data arrives

Every application SHALL draw the calendar screen before the data it shows has been read:
the header, the controls for stepping and choosing a day, the days, and the places
waiting for a day, each where it will stand once the data arrives and in the shape the
screen will take — three days beside the places waiting where the screen is wide, one day
with the control switching views where it is not.

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

The placeholders SHALL be still. They SHALL NOT shimmer, pulse, or otherwise move.

Every control on the screen SHALL be inert until the act it begins is able to complete,
as `workspace-chrome` requires of the map's chrome: present in the tab order, reported as
unavailable, and doing nothing when activated.

The waiting screen SHALL tell assistive technology that the calendar is loading.

Rationale: this is the rule `workspace-chrome` already applies to the map, carried to the
other screen a trip is read on. The calendar's arrangement is known before any trip is
read, so withholding it makes the first thing shown say nothing about the second. An
empty day is worse than a blank screen, because it is a claim — that nothing is planned —
and it is false for as long as the places are still being read. A fixed number of rows
says only that places go here; a number that followed the trip would be a count, and a
count is the thing not yet known.

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

### Requirement: The waiting calendar and the loaded calendar are one definition

The calendar drawn before its data and the calendar drawn after it SHALL be produced by a
single definition within each application, which draws both states. A second rendering of
the same screen SHALL NOT be maintained for the waiting state.

Nothing on the screen SHALL change position or size when the data arrives. What changes
is that the placeholders are replaced where they stand, the drawn rows are replaced by
the places, and the controls cease to be inert.

Rationale: two renderings that merely look alike disagree the moment either one is
edited, and the moment they are exchanged is exactly the moment the transition was
supposed to feel settled. This is the rule `workspace-chrome` states for the map's
chrome, and it is stated here because the calendar's screen is not that chrome.

#### Scenario: The data arrives

- **WHEN** the calendar's data arrives while the waiting calendar is shown
- **THEN** the header, the day controls, the days and the places waiting stand where they
  stood
- **AND** none of them changes size
- **AND** the placeholders are replaced by what they stood for
