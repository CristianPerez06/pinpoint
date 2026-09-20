## ADDED Requirements

### Requirement: A day is worded the same way wherever the product writes it

Both applications SHALL word a calendar day identically, from one shared definition, in
every place the product writes a day itself: the calendar's day headings and its spoken
step controls, a place's card, the filter, and wherever a trip's dates are shown.

The forms SHALL be:

- A day named while it is being looked at SHALL read as its weekday, its date and its
  month, for example `Friday 3 April`.
- The same day where there is less room SHALL read as their abbreviations, for example
  `Fri 3 Apr`.
- A day carrying no weekday SHALL read as its date and month, for example `3 Apr`.
- A day named in full — for a control that SHALL say where it leads without being looked
  at — SHALL read as the first form followed by the year, for example
  `Friday 3 April 2026`. It SHALL NOT differ from the first form in any way other than
  the year: in particular it SHALL carry no comma.
- A day in a numeric field SHALL read as day, month and year separated by slashes, for
  example `03/04/2026`.

A stretch of days SHALL read from that same shared definition, as one wording rather than
one per surface:

- A stretch SHALL name its first day and its last, joined by a dash, and SHALL end with
  the year, for example `28 Sept – 3 Oct 2027`.
- Where both days fall in one month, the month SHALL be written once, for example
  `9–26 Oct 2026`.
- Where the days fall in different years, each SHALL carry its own year, for example
  `28 Dec 2026 – 3 Jan 2027`.
- A stretch of one day SHALL read as that day with its year, for example `14 Nov 2026`.
- The year SHALL always be present. A trip is commonly planned a year ahead, and a
  stretch written without one reads correctly until the year it means stops being
  obvious.

The wording SHALL NOT be taken from the language the device or the browser is set to. It
SHALL be stated once, so that the same stored day produces the same string on a laptop
and on a phone, and so that a day written where a screen is drawn cannot disagree with
the same day written anywhere else.

Rationale for stating this rather than leaving it to each surface: a day written one way
in a heading and another in the control beside it reads as two different days. This has
already been the cause of a failure that looked like something else entirely — a day
worded in the runtime's own language on one side and the product's on the other left a
screen drawn, correct, and attached to nothing.

**A date control supplied by the platform is the one exception, and it is accepted rather
than overlooked.** Where a person is choosing a date in a control the operating system or
the browser draws — its calendar grid, its month and weekday names — that control words
the date in its own way and cannot be told otherwise. The product SHALL NOT be read as
requiring otherwise, and SHALL word the field's own value itself, so that what is shown
before and after the control is opened follows the definition above.

#### Scenario: One day across two applications

- **WHEN** the same stored day is shown on the laptop and on the phone
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
  product's
- **THEN** every day the product writes itself reads in the product's wording

#### Scenario: A date chosen in the platform's own control

- **WHEN** a person opens a date control drawn by the operating system or the browser
- **THEN** that control wording the date its own way is not a failure
- **AND** the value shown in the field it belongs to follows the product's wording

## MODIFIED Requirements

### Requirement: A trip's places can be read one day at a time

The system SHALL provide a screen showing a single day of a trip and the places dated to
that day, with each place named and identifiable as the place it is.

A day holding no places SHALL say so rather than appearing as an error or as a blank
region. An empty day is the ordinary state of most days on most trips and is information
in its own right.

The screen SHALL open on the day most likely to be wanted, determined as follows: today,
where the trip carries dates and today falls within them; otherwise the trip's start
date, where it carries one; otherwise today.

**Today SHALL mean today where the reader is standing**, and the screen SHALL NOT be
drawn showing a today worked out anywhere else — including, where an application draws
part of a screen before it reaches the reader, a today belonging to whatever prepared it.

Where the day depends on which clock is asked, whatever prepares the screen SHALL draw it
as waiting for its day rather than committing to one, and the reader's own device SHALL
supply it. No day other than the reader's SHALL be shown, even briefly, and no day already
shown SHALL be replaced by a different one.

Where the day does not depend on which clock is asked — a trip whose start date is the
answer whichever of the three possible todays is used — it SHALL be drawn straight away,
so that waiting is confined to the case that needs it.

Rationale: a trip is read while travelling, which is exactly when the reader's day and a
server's day differ. A calendar that opens on yesterday is not obviously wrong to look at
— it is a real day, correctly drawn, holding whatever that day holds — so nothing on
screen invites the reader to doubt it.

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

#### Scenario: Opening away from where the screen was prepared

- **WHEN** a person in one timezone opens the screen for a trip carrying no dates, and
  the part of the screen prepared before it reached them was prepared where the date
  differs
- **THEN** the screen is drawn waiting for its day rather than carrying one
- **AND** the day it settles on is the reader's own today
- **AND** no other day is shown first

#### Scenario: A trip whose opening day no clock can disagree about

- **WHEN** a person opens the screen for a trip whose start date is the answer wherever
  the screen is prepared
- **THEN** that day is drawn without waiting for the reader's own device

#### Scenario: Arriving by changing trip

- **WHEN** the trip being read changes
- **THEN** the day shown is the one this rule gives for the trip arrived at
- **AND** it is the same day a fresh arrival at that trip would have been given

#### Scenario: The same day read twice

- **WHEN** a person reads one day, leaves, and reads it again
- **THEN** its places are presented in the same order
