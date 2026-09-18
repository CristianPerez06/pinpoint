## MODIFIED Requirements

### Requirement: Selecting a marker shows what was recorded about it

The map SHALL allow a person to select a marker and see the information held about
that place: its name, its note, its link, its price, and its type. Values that are
absent SHALL be shown as absent rather than as empty text.

The information SHALL be reachable from the map without navigating away from it.

Selection SHALL be dismissible, returning to the unobstructed map.

The presentation MAY differ between platforms. Each application SHALL choose the form
native to it rather than sharing rendered markup.

A field that can be empty — the day, the note, the link — SHALL say in words which value
is missing, in the shape `No day yet`, `No note yet`, `No link yet`. Every application
SHALL use the same words, read from one shared definition, and SHALL NOT stand a symbol
such as a dash in for them. A price that is absent SHALL be shown by leaving out the pill
that would carry it.

Rationale: the laptop drew a dash and the phone said `Not recorded`, two answers to one
question that somebody using both notices. A dash says nothing to a screen reader, and a
catch-all phrase under a heading repeats nothing the heading did not. `No day yet` was the
one wording the two cards already shared, and it says what is missing and that it can
still be filled in.

A note SHALL be shown with the line breaks it was written with, blank lines included. A
line longer than the room available SHALL wrap within the presentation rather than
extend past it.

Rationale: a note is where the practical detail of a place lives — book ahead, closed on
Mondays, ask for the terrace — and it is written as a list far more often than as a
paragraph. Joining its lines into one run of text turns that list into a sentence that
does not parse, and the person who wrote it cannot fix it from the form, where it still
looks right.

#### Scenario: Selecting a marker

- **WHEN** a person selects a marker on either platform
- **THEN** they see the name, note, link, price, and type recorded for that place
- **AND** the map is still on screen

#### Scenario: A marker with only a name

- **WHEN** a marker has no note, link, or price
- **THEN** those fields are shown as absent
- **AND** no empty field is presented as though it held a value

#### Scenario: Dismissing the selection

- **WHEN** a person dismisses the selected marker
- **THEN** the map returns to its unobstructed state
- **AND** the camera is not moved by the dismissal

#### Scenario: A note written on several lines

- **WHEN** a person selects a marker whose note was written on several lines, with a
  blank line between two of them
- **THEN** each line is shown on its own line
- **AND** the blank line is shown as a blank line

#### Scenario: A note with a line too long to fit

- **WHEN** a person selects a marker whose note holds a line longer than the room
  available
- **THEN** that line wraps within the presentation
- **AND** nothing extends past its edge

#### Scenario: Empty fields read the same on both applications

- **WHEN** a person selects a marker with no day, no note and no link, on the laptop and
  on the phone
- **THEN** both read `No day yet`, `No note yet` and `No link yet`
- **AND** a screen reader announces those words rather than a symbol or nothing
