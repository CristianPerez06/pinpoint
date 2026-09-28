## MODIFIED Requirements

### Requirement: The place form captures one range of hours for the days a place is open

The form that saves and edits a place SHALL offer its opening hours, on every
application. It SHALL be optional and placed after the day the place is planned for.

**The hours SHALL read as one bounded section**, carrying a single label `Hours`, with
the days, the line naming them and the times inside it. The section SHALL be drawn so
that where it begins and ends is visible without reading its contents, and SHALL NOT rely
on a background fill to do so — a fill that is indistinguishable from the surface behind
it on either ground says nothing. Its fields SHALL keep the same appearance they have
elsewhere in the form.

**Days.** The form SHALL offer the seven days of the week as a row of letters in week
order, starting on Monday (`M T W T F S S`), each of which can be turned on and off.
Beneath the row the form SHALL name the days turned on in words, for example `Open Tue to
Sat`, `Open every day`, or `Open Mon, Wed, Fri`. While no day is on, it SHALL say instead
that the hours can be left empty if they are not known.

**Every day.** Beside the line naming the days, the form SHALL offer one control,
`Every day`, that turns all seven days on in a single action. While all seven are on it
SHALL show as on, and using it then SHALL turn every day off, with the same effect as
turning each day off by hand.

Rationale for the words: two letters in the row repeat, so the row alone cannot say which
Tuesday-or-Thursday was meant.

**Time fields appear with the first day.** While no day is on, the form SHALL show no
time fields and no `24 hours` switch. Saving with no day on SHALL record the place as having no hours, whatever
times had been entered before the days were turned off.

**One range.** The form SHALL offer one opening time and one closing time, which apply to
every day turned on. It SHALL NOT offer a second range, nor a way to give some days hours
of their own.

**Times** SHALL be entered and shown on a 24-hour clock.

**24 hours.** Beside the time fields, the form SHALL offer a switch, `24 hours`, that
marks the place open all day on every day turned on. While it is on, the form SHALL show
`Open all day` in place of the two time fields, and saving SHALL record the place as open
all day. Turning it off SHALL give back the times the fields held before it was turned
on; if they held none, or held two equal times, the fields SHALL be empty. The switch
SHALL NOT turn itself on while times are being typed: two equal times typed by hand keep
meaning open all day, and the form says so as a hint.

Rationale: "the same time twice" is how open all day is stored, but nobody would guess
to type it (#221).

**Hints while typing.** Where the closing time is earlier than the opening time, the form
SHALL say beneath it that the place closes at that time the next day, for example `Closes
02:00 the next day`. Where the two times are equal, it SHALL say `Open all day`.

**Refusal.** A range with only one of its two times, or a range breaking the rules for
opening hours, SHALL be refused. The refusal SHALL name the hours field and SHALL preserve
everything entered, in the hours and everywhere else in the form.

**Opening the form on a place that has hours.** The days SHALL be turned on as stored,
and the opening and closing times SHALL be those stored. A place whose opening and
closing times are equal SHALL open with `24 hours` on, whichever equal time it was saved
with. Saving without changing anything SHALL leave the hours exactly as they were.

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

#### Scenario: Every day in one tap

- **WHEN** a person with no day turned on uses `Every day`
- **THEN** all seven days are turned on
- **AND** the line beneath the days says `Open every day`
- **AND** the time fields appear

#### Scenario: Every day when some days are on

- **WHEN** Monday and Tuesday are on and a person uses `Every day`
- **THEN** all seven days are turned on

#### Scenario: Every day turned off

- **WHEN** all seven days are on and a person uses `Every day`
- **THEN** every day is turned off
- **AND** no time fields and no `24 hours` switch are shown

#### Scenario: A place open around the clock

- **WHEN** a person turns on every day, turns `24 hours` on, and saves
- **THEN** the time fields are replaced by `Open all day` while the switch is on
- **AND** the place is open all day on every day of the week

#### Scenario: Turning 24 hours off gives the times back

- **WHEN** a person enters 09:00 to 17:00, turns `24 hours` on, then turns it off
- **THEN** the times read 09:00 and 17:00

#### Scenario: Turning 24 hours off with nothing entered

- **WHEN** a person turns on a day, turns `24 hours` on without entering times, then
  turns it off
- **THEN** both time fields are empty

#### Scenario: A place saved with equal times

- **WHEN** a person opens the form on a place open Monday to Friday, 09:00–09:00
- **THEN** Monday to Friday are turned on
- **AND** `24 hours` is on
- **AND** saving without changing anything leaves its hours as 09:00–09:00

#### Scenario: Turning 24 hours off on a place saved with equal times

- **WHEN** a person opens the form on a place saved 09:00–09:00 and turns `24 hours` off
- **THEN** both time fields are empty

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

#### Scenario: The hours are labelled

- **WHEN** a person opens the place form
- **THEN** the hours section is labelled `Hours`
- **AND** the label does not say that the hours are optional
- **AND** the line beneath the days says the hours can be left empty if they are not known
