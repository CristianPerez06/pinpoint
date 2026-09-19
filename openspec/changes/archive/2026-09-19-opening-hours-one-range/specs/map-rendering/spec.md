## MODIFIED Requirements

### Requirement: A place's card shows the hours it is open

The card showing a selected place SHALL show its opening hours in a field headed `Hours`,
placed after the day and before the note, on every application and wherever that card
appears, including the calendar.

Both applications SHALL word the hours identically, from one shared definition:

- The open days SHALL share one line, followed by the range they are open. The days SHALL
  follow week order, starting on Monday, and SHALL be separated by commas. Days next to
  each other in that order SHALL be named as a span, for example `Tue–Thu`. Days SHALL be
  named by their three-letter English abbreviations. For example `Mon, Wed, Fri
  09:00–17:00` or `Mon–Wed, Fri 09:00–17:00`.
- Where all seven days are open, the line SHALL be named `Every day`.
- The range SHALL read as its two times on a 24-hour clock joined by a dash, for example
  `09:00–18:00`. A range closing the next morning SHALL read as entered, for example
  `19:00–02:00`.
- A place open all day SHALL read `24 hours`.
- Where any day is closed, the closed days SHALL share one last line reading `Closed`
  followed by those days in week order, for example `Closed Mon, Sun`. That line SHALL be
  drawn so it reads as secondary to the open days.
- A place with no hours SHALL read `No hours yet`, taken from the same shared definition
  as the other empty fields and drawn the same way they are.

The hours SHALL NOT take more than two lines, not counting wrapping. A line longer than
the room available SHALL wrap within the card, and SHALL NOT break the range across two
lines.

Rationale: the card is read in a hurry, often standing outside the place. With one range
for every open day, the days can always share one line, whether or not they are next to
each other (#190). Listing the closed days, instead of leaving them out, means a closed
day is something the card says, not something the reader has to work out from a gap.

#### Scenario: The same hours every day

- **WHEN** a person selects a place open every day 09:00–18:00
- **THEN** its hours read `Every day 09:00–18:00`

#### Scenario: Weekdays only

- **WHEN** a person selects a place open Monday to Friday 09:00–17:00
- **THEN** its hours read `Mon–Fri 09:00–17:00` and then `Closed Sat, Sun`

#### Scenario: Days that are not next to each other

- **WHEN** a person selects a place open Monday, Wednesday and Friday 09:00–17:00
- **THEN** its hours read `Mon, Wed, Fri 09:00–17:00` and then `Closed Tue, Thu, Sat, Sun`

#### Scenario: The worst case

- **WHEN** a person selects a place open Monday, Wednesday, Friday and Sunday, 19:00–02:00
- **THEN** its hours read, line by line, `Mon, Wed, Fri, Sun 19:00–02:00` and
  `Closed Tue, Thu, Sat`

#### Scenario: Open all day

- **WHEN** a person selects a place open all day every day
- **THEN** its hours read `Every day 24 hours`

#### Scenario: No hours entered

- **WHEN** a person selects a place with no hours, on the laptop and on the phone
- **THEN** both read `No hours yet`
- **AND** nothing on the card says the place is closed

#### Scenario: The same place on both applications

- **WHEN** a person selects the same place with hours on the laptop and on the phone
- **THEN** the hours read identically on both, line for line
