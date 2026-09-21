## MODIFIED Requirements

### Requirement: A marker may carry the date it is planned for

A marker SHALL support an optional date, naming the day the place is planned for. It
SHALL be a calendar date and SHALL NOT carry a time of day.

A marker MAY additionally carry a **last day**. Where it does, the place SHALL be planned
for every day from its date through that last day, both included. The last day SHALL also
be a calendar date and SHALL NOT carry a time of day.

A last day SHALL NOT be storable without a date, and SHALL NOT fall before it. A
submission breaking either rule SHALL be refused, and the refusal SHALL name the offending
field. A last day equal to the date SHALL be recorded as absent: a place planned for one
day carries one date, and the same day SHALL NOT have two ways of being recorded.

Clearing a marker's date SHALL clear its last day with it. A last day left behind would
describe a run with no beginning, which the paragraph above forbids storing.

A run of days SHALL NOT be longer than a year. A last day falling more than 365 days after
the date SHALL be refused, and the refusal SHALL name the offending field.

Rationale for the bound: these dates are typed by hand, and a slipped year turns a
three-night stay into a run of some thirty-six thousand days — one place claiming every
day of a century, which no calendar can draw and which would make the day being read take
as long to work out as the trip itself. Nothing anybody plans on a trip runs longer than a
year, so the bound refuses typos and nothing else. It is stated here, as a refusal that
names its field, rather than left to each application to guard quietly: a run silently
shortened to fit would put the place on some of its days and not others, with nothing on
screen to say why.

A marker with no date SHALL be valid, SHALL remain visible and addressable, and SHALL be
distinguishable from one whose date has been chosen — the absence of a date means the
decision has not been made, which is not the same as any particular day.

A marker's dates SHALL be independent of the trip's dates, and SHALL be able to fall
outside them, wholly or in part. The store SHALL NOT reject them on those grounds, SHALL
NOT adjust them, and SHALL NOT truncate a run to the trip's own dates.

A marker's dates SHALL be independent of the city it is filed under. Neither SHALL
constrain, derive, or default the other.

Rationale for the last part: a city and a date are two groupings of one set of places,
sitting beside each other rather than one inside the other. A date that had to agree
with a city would make the day a level underneath the city, which is the arrangement
this product has decided against — a place can be "Kyōto" and "Thursday", and a day trip
that crosses a city boundary is an ordinary thing to plan.

Rationale for a run of days rather than an arbitrary set of them: the case this exists for
is somewhere you sleep, which is continuous by its nature — a booking has a first night
and a last one and no gaps. Days that are not next to each other remain two markers, as
they are today. A run is a set of days that happen to be adjacent, so nothing here forecloses
widening it later; the reverse would have been a control that can hold any number of days,
built for a case nobody has yet had.

#### Scenario: A marker is created without a date

- **WHEN** a marker is created with no date
- **THEN** it is valid
- **AND** the date is recorded as absent rather than as a placeholder value

#### Scenario: A marker is given a run of days

- **WHEN** a marker is given a date of the 3rd and a last day of the 6th
- **THEN** it is planned for the 3rd, 4th, 5th and 6th
- **AND** it remains one marker with one position

#### Scenario: A last day before the date

- **WHEN** a marker is given a last day falling before its date
- **THEN** the submission is refused
- **AND** the refusal names the offending field

#### Scenario: A last day with no date

- **WHEN** a marker is given a last day and no date
- **THEN** the submission is refused
- **AND** the refusal names the offending field

#### Scenario: A run longer than a year

- **WHEN** a marker is given a last day falling more than 365 days after its date
- **THEN** the submission is refused
- **AND** the refusal names the offending field
- **AND** the run is not shortened to fit

#### Scenario: A last day equal to the date

- **WHEN** a marker is given a date and a last day that are the same day
- **THEN** it is planned for that one day
- **AND** its last day is recorded as absent

#### Scenario: Clearing the date clears the last day

- **WHEN** a marker carrying a run of days has its date cleared
- **THEN** it carries no date and no last day
- **AND** it is a place whose day has not been decided

#### Scenario: A date outside the trip's dates

- **WHEN** a marker is given a date falling before a trip's start date or after its end date
- **THEN** it is stored as given
- **AND** it is neither rejected nor adjusted

#### Scenario: A run reaching past the trip's dates

- **WHEN** a marker is given a run of days beginning within the trip's dates and ending
  after its end date
- **THEN** it is stored as given
- **AND** it is neither refused nor shortened to the trip's end date

#### Scenario: A date on a trip that has none

- **WHEN** a marker on a trip carrying no dates of its own is given a date
- **THEN** it is stored
- **AND** the trip is not required to have dates first

#### Scenario: A date and a city do not constrain each other

- **WHEN** a marker is given a date, and is filed under a city whose other markers carry
  different dates
- **THEN** both the date and the city are stored as given
- **AND** neither is changed on account of the other

#### Scenario: Markers saved before a run of days could be recorded

- **WHEN** a marker saved with only a date is read or edited
- **THEN** it has no last day and is planned for that one day
- **AND** saving it without adding one succeeds and leaves it with none
