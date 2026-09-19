## ADDED Requirements

### Requirement: The place form captures the hours a place is open

The form that saves and edits a place SHALL offer its opening hours, on every
application. It SHALL be optional, labelled as optional, and placed after the day the
place is planned for.

**Days.** The form SHALL offer the seven days of the week as a row of letters in week
order, starting on Monday (`M T W T F S S`), each of which can be turned on and off.
Beneath the row the form SHALL name the days turned on in words, for example `Open Tue to
Sat`, `Open every day`, or `Open Mon, Wed, Fri`. While no day is on, it SHALL say instead
that the hours can be left empty if they are not known.

Rationale for the words: two letters in the row repeat, so the row alone cannot say which
Tuesday-or-Thursday was meant.

**Time fields appear with the first day.** While no day is on, the form SHALL show no
time fields. Saving with no day on SHALL record the place as having no hours, whatever
times had been entered before the days were turned off.

**Usual hours.** The form SHALL offer one set of hours, headed `Usual hours`, that applies
to every day turned on.

**Different on some days.** The form SHALL offer `Different on some days`, which sets one
of the days turned on apart with hours of its own. Only a day that is turned on SHALL be
offered. Any number of such days SHALL be allowed, and each SHALL be removable, returning
that day to the usual hours. Turning a day off SHALL discard any hours set apart for it.

**A second range.** The usual hours and each day set apart SHALL each allow a second
range, reached through `Add a second range` and removable again. The form SHALL NOT offer
a third.

**Times** SHALL be entered and shown on a 24-hour clock.

**Hints while typing.** Where a range's closing time is earlier than its opening time,
the form SHALL say beneath it that the place closes at that time the next day, for
example `Closes 02:00 the next day`. Where the two times are equal, it SHALL say `Open all
day`.

**Refusal.** A range with only one of its two times, or ranges breaking the rules for
opening hours, SHALL be refused. The refusal SHALL name the hours field and SHALL preserve
everything entered, in the hours and everywhere else in the form.

**Opening the form on a place that has hours.** The days SHALL be turned on as stored.
The usual hours SHALL be the hours shared by the most open days. Where two sets of hours
are shared by equally many days, the one on the earliest day of the week SHALL be the
usual hours. Every other open day SHALL appear set apart with its own hours. Saving
without changing anything SHALL leave the hours exactly as they were.

Changing a place's hours SHALL be governed by the same rules as any other change to a
place, including the refusal of a save based on a stale read.

#### Scenario: Saving a place with the same hours every open day

- **WHEN** a person turns on Monday to Friday, enters 09:00 to 17:00 as the usual hours,
  and saves
- **THEN** the place is open Monday to Friday, 09:00–17:00
- **AND** it is closed on Saturday and Sunday

#### Scenario: A day with different hours

- **WHEN** a person turns on Tuesday to Saturday with usual hours 12:00–15:00 and
  19:00–23:00, sets Saturday apart with 10:00–14:00, and saves
- **THEN** Tuesday to Friday carry the usual hours
- **AND** Saturday carries 10:00–14:00 only

#### Scenario: The form opens with nothing to fill in

- **WHEN** a person opens the form on a place with no hours
- **THEN** no day is turned on
- **AND** no time fields are shown

#### Scenario: Turning every day off

- **WHEN** a person has entered times, turns every day off, and saves
- **THEN** the place is recorded as having no hours

#### Scenario: A late closing time

- **WHEN** a person enters 19:00 to 02:00
- **THEN** the form says `Closes 02:00 the next day`

#### Scenario: Open all day

- **WHEN** a person enters 00:00 to 00:00
- **THEN** the form says `Open all day`

#### Scenario: No third range

- **WHEN** a day already has two ranges
- **THEN** the form offers no way to add a third

#### Scenario: A range missing a time

- **WHEN** a person enters an opening time with no closing time and saves
- **THEN** the save is refused
- **AND** the refusal names the hours field
- **AND** everything else they entered is preserved

#### Scenario: Editing a place with mixed hours

- **WHEN** a person opens the form on a place open Tuesday to Friday 12:00–15:00 and
  19:00–23:00, and Saturday 10:00–14:00
- **THEN** the usual hours are 12:00–15:00 and 19:00–23:00
- **AND** Saturday appears set apart with 10:00–14:00

#### Scenario: Saving an edit that did not touch the hours

- **WHEN** a person opens the form on a place with hours, changes only its note, and saves
- **THEN** the place's hours are unchanged
