## MODIFIED Requirements

### Requirement: A marker may carry the hours it is open

A marker SHALL support optional opening hours: which days of the week the place is open,
and the one time range it is open on each of those days.

A marker with no hours SHALL be valid. The absence of hours SHALL mean that they have not
been entered, and SHALL NOT mean that the place is closed. Hours naming no open day at all
SHALL NOT be storable; such hours SHALL be recorded as absent.

Where a marker has hours, every day of the week they name SHALL be a day the place is
open, and every day they do not name SHALL be a day it is closed.

Each open day SHALL carry exactly one time range, and every open day SHALL carry the same
one. A range SHALL have an opening time and a closing time, each a time of day to the
minute.

- A closing time earlier than the opening time SHALL mean the next morning. The range
  SHALL belong to the day it opens.
- An opening time equal to the closing time SHALL mean open all day.

A submission breaking any of these rules SHALL be refused, and the refusal SHALL name the
hours field.

Hours SHALL be in the place's own local time. The system SHALL NOT convert them for the
time zone of the person reading them, of their device, or of the trip.

Rationale: hours are how a place describes itself, and a sign on a door is read as
written. The absence of hours means "not filled in" rather than "closed" for the reason a
blank price means "not entered yet" rather than free: the two states need to look
different, and only one of them is something somebody decided. "Closed all week" is not a
state anybody needs to record about a place they want to go to. One range, the same every
open day, is what people actually record (#190): a second range and different hours on
some days were offered and never used, and they made the form much busier.

#### Scenario: A marker is created without hours

- **WHEN** a marker is created with no hours
- **THEN** it is valid
- **AND** its hours are recorded as absent, not as closed on every day

#### Scenario: Markers saved before hours existed

- **WHEN** a marker saved before this requirement is read or edited
- **THEN** it has no hours
- **AND** saving it without adding hours succeeds and leaves it with none

#### Scenario: A place closed on some days

- **WHEN** a marker is given hours naming Tuesday to Saturday
- **THEN** it is open on those five days
- **AND** it is closed on Monday and Sunday

#### Scenario: A place open past midnight

- **WHEN** a marker is given hours naming Friday, opening at 20:00 and closing at 02:00
- **THEN** it is stored as given
- **AND** the range belongs to Friday

#### Scenario: A place open all day

- **WHEN** a marker is given a range opening and closing at 00:00
- **THEN** it is stored as open all day on every day it names

#### Scenario: Two ranges in one day

- **WHEN** a marker is given a day with ranges 12:00–15:00 and 19:00–23:00
- **THEN** the submission is refused
- **AND** the refusal names the hours field

#### Scenario: Two ranges that overlap

- **WHEN** a marker is given a day with ranges 12:00–16:00 and 15:00–23:00
- **THEN** the submission is refused
- **AND** the refusal names the hours field

#### Scenario: Different hours on different days

- **WHEN** a marker is given Monday 09:00–17:00 and Tuesday 10:00–18:00
- **THEN** the submission is refused
- **AND** the refusal names the hours field

#### Scenario: Hours are not converted

- **WHEN** a marker's hours are read on a device set to a different time zone from the
  one they were entered on
- **THEN** they read exactly as entered
