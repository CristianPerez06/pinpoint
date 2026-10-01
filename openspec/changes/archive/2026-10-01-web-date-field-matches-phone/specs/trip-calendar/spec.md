## ADDED Requirements

### Requirement: A place is given its day on the place itself, from a centred calendar

The day a place is planned for SHALL be set and changed on the place, in the same form
that captures what else is known about it, offered beside the city rather than as a
separate act.

Rationale: a city and a date are the same kind of thing — two groupings a person chooses
for a place, neither inside the other. Changing a place's day should therefore work the
way changing its city already works, so that there is nothing new to learn and only one
place to look.

The control SHALL be a field within that form, showing the day it holds in the numeric
form, or `No day yet` when it holds none, with a calendar icon at its far end. Pressing it
SHALL open a calendar **centred on the screen**, over a dimmed backdrop, drawn in the
product's colours on whichever ground is being shown. Choosing a day SHALL close the
calendar and put that day in the field. Pressing outside the calendar, or Escape where
there is a keyboard, SHALL close it and leave the field as it was. Moving between months
SHALL NOT close it.

The calendar SHALL open on the month of the day the field holds, or on today's month when
the field holds none — never on a day remembered from an earlier use, because a date
nobody chose should not be the one a control offers next.

The calendar SHALL be the only thing a date field raises over the form, and it SHALL be
raised only while a day is being chosen. Nothing else about choosing a date — no second
panel, no menu, no confirmation — SHALL stand over the form.

The calendar SHALL be usable by keyboard alone: moving between days and months, and
choosing a day, without a pointer. The day being moved to SHALL be announced to a screen
reader, with its weekday, date, month and year.

Everything said here SHALL hold for every date field either application offers — a
place's day and its last day, a trip's start and end dates, and the day the calendar
screen is reading — so that choosing a date works one way wherever it is done. The two
applications SHALL draw the field and the calendar each in its own way and SHALL NOT share
rendered markup, as with everything else this specification describes.

Rationale for a centred calendar rather than none: the earlier rule raised nothing over
the form, because the form is already raised over what the person was reading, and the
browser's own control was accepted in exchange. That control opened its calendar wherever
the browser chose — on a narrow window, away from the field it belonged to — and in the
browser's colours rather than the product's. The phone met the same failure with the
operating system's control and replaced it with a calendar centred on the screen, which is
what this states for both. A centred calendar opened for one choice and closed by making
it does not bury the form the way a standing panel does: it is gone the moment its one
question is answered, and the form is exactly as it was left.

Clearing the date SHALL be possible from the same field, and SHALL return the place to
having no day rather than to any particular one. It SHALL be offered as `Clear`, beside the
field, shown only while the field holds a day: a `Clear` beside an empty field is a control
that can do nothing. The same SHALL hold for a trip's dates. The day the calendar screen is
reading SHALL offer no `Clear`, because there is no "no day" for that screen to be on.

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
- Revealing the second field SHALL NOT raise a panel over the form, and SHALL NOT discard
  or disturb anything already entered. The second field's calendar SHALL open on the month
  of the first day when the second field holds none, because the last day of a run is
  almost always near its first.
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

#### Scenario: Choosing a day in the centred calendar

- **WHEN** a person presses a date field, on a wide or a narrow screen, on either ground
- **THEN** a calendar opens centred on the screen, drawn in the product's colours
- **AND** choosing a day closes it and puts that day in the field
- **AND** everything already entered in the form is as it was

#### Scenario: Closing the calendar without choosing

- **WHEN** a person opens the calendar and presses outside it, or presses Escape
- **THEN** the calendar closes
- **AND** the field holds what it held before

#### Scenario: The calendar opens on the field's month

- **WHEN** a person opens the calendar on a field holding a day
- **THEN** the month shown is that day's month, with that day marked as chosen
- **AND** on a field holding no day, the month shown is today's

#### Scenario: Choosing a day by keyboard alone

- **WHEN** a person opens the calendar from the keyboard and moves between days with the
  arrow keys
- **THEN** each day moved to is announced to a screen reader with its weekday, date, month
  and year
- **AND** a day can be chosen, and the calendar closed, without a pointer

#### Scenario: Nothing but the calendar stands over the form

- **WHEN** a date field is used
- **THEN** the centred calendar is the only thing raised over the form
- **AND** it is gone once a day is chosen or the choice is abandoned

#### Scenario: The same field wherever a date is chosen

- **WHEN** a person chooses a trip's start or end date, in the trip's menu or while
  creating it, or the day the calendar screen is reading
- **THEN** the field and its calendar look and behave as a place's day field does

#### Scenario: Until opens near the first day

- **WHEN** a person reveals `Until` on a place planned for a day in another month and
  opens its calendar
- **THEN** the calendar shows the month of the place's first day

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

## MODIFIED Requirements

### Requirement: A day is worded the same way wherever the product writes it

Both applications SHALL word a calendar day identically, from one shared definition per
language, in every place the product writes a day itself: the calendar's day headings and
its spoken step controls, a place's card, the filter, and wherever a trip's dates are
shown.

The forms SHALL be, in English:

- A day named while it is being looked at SHALL read as its weekday, its date and its
  month, for example `Friday 3 April`.
- The same day where there is less room SHALL read as their abbreviations, for example
  `Fri 3 Apr`.
- A day carrying no weekday SHALL read as its date and month, for example `3 Apr`.
- A day named in full — for a control that SHALL say where it leads without being looked
  at — SHALL read as the first form followed by the year, for example
  `Friday 3 April 2026`. It SHALL NOT differ from the first form in any way other than
  carrying the year: in English, in particular, it SHALL carry no comma.
- A day in a numeric field SHALL read as day, month and year separated by slashes, for
  example `03/04/2026`.

The same five forms SHALL be, in Spanish:

- The day named while it is being looked at, for example `viernes, 3 de abril`.
- The same day where there is less room, for example `vie, 3 abr`.
- A day carrying no weekday, for example `3 abr`.
- A day named in full, for example `viernes, 3 de abril de 2026`. It SHALL NOT differ from
  the first form in any way other than carrying the year.
- A day in a numeric field, for example `03/04/2026`. The order SHALL be day, month, year
  in both languages.

Weekday and month names SHALL be written as the language writes them: capitalised in
English, and in lower case in Spanish, where they are not proper nouns.

The rule about the comma SHALL be read as being about the two forms agreeing with each
other, not about the punctuation itself. English writes these forms without a comma and
Spanish writes them with one; what SHALL hold in both is that the form named in full is
the on-screen form plus its year and differs in nothing else.

A stretch of days SHALL read from that same shared definition, as one wording rather than
one per surface:

- A stretch SHALL name its first day and its last, joined by a dash, and SHALL end with
  the year, for example `28 Sept – 3 Oct 2027`, and in Spanish `28 sept – 3 oct 2027`.
- Where both days fall in one month, the month SHALL be written once, for example
  `9–26 Oct 2026`, and in Spanish `9–26 oct 2026`.
- Where the days fall in different years, each SHALL carry its own year, for example
  `28 Dec 2026 – 3 Jan 2027`, and in Spanish `28 dic 2026 – 3 ene 2027`.
- A stretch of one day SHALL read as that day with its year, for example `14 Nov 2026`,
  and in Spanish `14 nov 2026`.
- The year SHALL always be present. A trip is commonly planned a year ahead, and a
  stretch written without one reads correctly until the year it means stops being
  obvious.

The wording SHALL NOT be taken from the language the device or the browser is set to. It
SHALL be taken from the language the product is being read in, and SHALL be stated once
for each language, so that the same stored day produces the same string on a laptop and on
a phone reading the same language, and so that a day written where a screen is drawn
cannot disagree with the same day written anywhere else.

Rationale for stating this rather than leaving it to each surface: a day written one way
in a heading and another in the control beside it reads as two different days. This has
already been the cause of a failure that looked like something else entirely — a day
worded in the runtime's own language on one side and the product's on the other left a
screen drawn, correct, and attached to nothing.

Rationale for writing each language's forms out rather than deriving them: the difference
between `Friday 3 April` and `viernes, 3 de abril` is not a substitution of words. It is a
preposition English does not have, a capital letter Spanish does not use, a comma English
omits here and Spanish does not, and a full form that carries `de` before its year. None
of that can be arrived at from the English; all of it has to be stated, and stating it is
what lets a reviewer tell a wording decision from a runtime's default.

A calendar the product draws itself for choosing a day SHALL word its month and its
weekdays from the same definition:

- Its month SHALL read as the month's name and the year, for example `August 2027`, and in
  Spanish `agosto de 2027`.
- Each weekday column SHALL be headed by the weekday's abbreviation, for example `Mon`,
  and in Spanish `lun`.
- Its weeks SHALL start on Monday in both languages, matching the day-first order of the
  numeric form.

**A date control supplied by the platform is the one exception, and it is accepted rather
than overlooked.** Where a person is choosing a date in a control the operating system
draws — its calendar grid, its month and weekday names — that control words the date in
its own way and cannot be told otherwise. This applies to the phone, whose calendars are
the operating system's. The laptop's calendar is the product's own and is not covered by
this exception. The product SHALL NOT be read as requiring otherwise of a platform's
control, and SHALL word the field's own value itself, so that what is shown before and
after the control is opened follows the definition above.

#### Scenario: One day across two applications

- **WHEN** the same stored day is shown on the laptop and on the phone
- **AND** both are being read in the same language
- **THEN** it reads identically on both

#### Scenario: A day heard rather than seen

- **WHEN** a step control naming a day is read by a screen reader
- **THEN** the day is announced as the on-screen wording followed by the year
- **AND** it carries no punctuation the on-screen wording does not carry

#### Scenario: A stretch of days within one month

- **WHEN** a stretch of days beginning and ending in the same month is written
- **THEN** the month appears once
- **AND** the year appears once, at the end

#### Scenario: A stretch of days crossing a year

- **WHEN** a stretch of days beginning in one year and ending in the next is written
- **THEN** each end carries its own year

#### Scenario: A device set to another language

- **WHEN** a person uses either application on a device set to a language other than the
  one the product is being read in
- **THEN** every day the product writes itself reads in the language the product is being
  read in

#### Scenario: The same day in the other language

- **WHEN** the language is changed while a day is on screen
- **THEN** that day is rewritten in the other language's form
- **AND** it names the same stored day

#### Scenario: A date chosen in the platform's own control

- **WHEN** a person opens a date control drawn by the phone's operating system
- **THEN** that control wording the date its own way is not a failure
- **AND** the value shown in the field it belongs to follows the product's wording

#### Scenario: The laptop's calendar in Spanish

- **WHEN** the laptop is being read in Spanish and a person opens a date field's calendar
- **THEN** its month reads like `agosto de 2027`
- **AND** its weekday columns read `lun` to `dom`, starting on Monday
- **AND** this holds whatever language the browser is set to


## REMOVED Requirements

### Requirement: A place is given its day on the place itself

**Reason**: It forbade raising anything over the form, which the phone's calendar already breaks and which this change replaces with a calendar centred on the screen. A changed requirement cannot drop a scenario, so the rule returns under a new name with the same content apart from the date field itself.

**Migration**: Replaced by *A place is given its day on the place itself, from a centred calendar*, which keeps every other sentence and scenario of this one.
