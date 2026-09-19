## REMOVED Requirements

### Requirement: The place form captures the hours a place is open

**Reason**: Its `Different on some days`, second range and mixed-hours rules are removed
(#190), and its scenarios for them cannot be carried into a rewrite of the same block.

**Migration**: Replaced by *The place form captures one range of hours for the days a
place is open*, below, which carries forward everything else this requirement said.

## ADDED Requirements

### Requirement: The place form captures one range of hours for the days a place is open

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

**One range.** The form SHALL offer one opening time and one closing time, which apply to
every day turned on. It SHALL NOT offer a second range, nor a way to give some days hours
of their own.

**Times** SHALL be entered and shown on a 24-hour clock.

**Hints while typing.** Where the closing time is earlier than the opening time, the form
SHALL say beneath it that the place closes at that time the next day, for example `Closes
02:00 the next day`. Where the two times are equal, it SHALL say `Open all day`.

**Refusal.** A range with only one of its two times, or a range breaking the rules for
opening hours, SHALL be refused. The refusal SHALL name the hours field and SHALL preserve
everything entered, in the hours and everywhere else in the form.

**Opening the form on a place that has hours.** The days SHALL be turned on as stored,
and the opening and closing times SHALL be those stored. Saving without changing
anything SHALL leave the hours exactly as they were.

Changing a place's hours SHALL be governed by the same rules as any other change to a
place, including the refusal of a save based on a stale read.

#### Scenario: Saving a place with hours

- **WHEN** a person turns on Monday to Friday, enters 09:00 to 17:00, and saves
- **THEN** the place is open Monday to Friday, 09:00–17:00
- **AND** it is closed on Saturday and Sunday

#### Scenario: The form offers one range only

- **WHEN** a person turns on any day
- **THEN** the form shows one opening time and one closing time
- **AND** it offers no way to add a second range
- **AND** it offers no way to give one day different hours

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

#### Scenario: A range missing a time

- **WHEN** a person enters an opening time with no closing time and saves
- **THEN** the save is refused
- **AND** the refusal names the hours field
- **AND** everything else they entered is preserved

#### Scenario: Editing a place with hours

- **WHEN** a person opens the form on a place open Monday, Wednesday and Friday,
  09:00–17:00
- **THEN** Monday, Wednesday and Friday are turned on
- **AND** the times read 09:00 and 17:00

#### Scenario: Saving an edit that did not touch the hours

- **WHEN** a person opens the form on a place with hours, changes only its note, and saves
- **THEN** the place's hours are unchanged
