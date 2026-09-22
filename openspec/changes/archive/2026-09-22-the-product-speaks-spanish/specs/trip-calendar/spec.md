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

**A date control supplied by the platform is the one exception, and it is accepted rather
than overlooked.** Where a person is choosing a date in a control the operating system or
the browser draws — its calendar grid, its month and weekday names — that control words
the date in its own way and cannot be told otherwise. The product SHALL NOT be read as
requiring otherwise, and SHALL word the field's own value itself, so that what is shown
before and after the control is opened follows the definition above.

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

- **WHEN** a person opens a date control drawn by the operating system or the browser
- **THEN** that control wording the date its own way is not a failure
- **AND** the value shown in the field it belongs to follows the product's wording
