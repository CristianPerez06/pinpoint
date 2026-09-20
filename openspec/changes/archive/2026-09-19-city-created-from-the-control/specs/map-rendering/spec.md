## MODIFIED Requirements

### Requirement: Selecting a marker shows what was recorded about it

The map SHALL allow a person to select a marker and see the information held about
that place: its name, its note, its link, its price, its type, and the city it is filed
under. Values that are absent SHALL be shown as absent rather than as empty text.

The city SHALL be shown because filing is decided by a rule rather than by hand — a city
claims a place within a stated distance of its nearest place — so a place can be filed
somewhere nobody chose. A surface that shows everything recorded about a place and omits
the one field the product decided on its own leaves that decision unreadable.

A place filed under no city SHALL read `Unassigned`, and SHALL NOT use the `No … yet`
shape the other empty fields take. Those fields say "yet" because they are waiting to be
filled in; being filed under no city is a state a place may rest in, and it is the word
the place form and the trip's own grouping of markers already use. Every application
SHALL use that one word, read from one shared definition, as it does for the others.

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

A link SHALL be shown on one line. A link longer than the room available SHALL be cut
short at the end with an ellipsis rather than wrap or extend past the presentation.
Every application SHALL let a person follow the link from the presentation, and
following it SHALL open the full address. Where the platform has a pointer, the full
address SHALL be shown when the pointer rests on the link.

Rationale: a link copied from a map, a booking site or a social network routinely runs to
hundreds of characters of tracking parameters. Shown in full it takes over the card and
pushes the fields below it out of view, while its tail tells the reader nothing. The start
of the address is kept rather than just the site's name, because two links to the same
site are told apart by what follows it.

#### Scenario: Selecting a marker

- **WHEN** a person selects a marker on either platform
- **THEN** they see the name, note, link, price, type, and city recorded for that place
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

#### Scenario: A link longer than the room available

- **WHEN** a person selects a marker whose link is several hundred characters long
- **THEN** the link takes one line and ends in an ellipsis
- **AND** nothing extends past the presentation's edge
- **AND** following the link opens the full address

#### Scenario: Following a link on the phone

- **WHEN** a person taps the link on a selected marker on the phone
- **THEN** the full address opens in the browser

#### Scenario: A link short enough to fit

- **WHEN** a person selects a marker whose link fits in the room available
- **THEN** the link is shown in full, with no ellipsis

#### Scenario: Reading a long link in full on the laptop

- **WHEN** a person rests the pointer on a link cut short on the laptop
- **THEN** the full address is shown

#### Scenario: A place filed under a city

- **WHEN** a person selects a marker filed under a city
- **THEN** that city is named among the fields
- **AND** it reads the same on the laptop and on the phone

#### Scenario: A place filed under no city

- **WHEN** a person selects a marker filed under no city
- **THEN** the city field reads `Unassigned`
- **AND** it does not read `No city yet` or any other `No … yet` wording
- **AND** it does not read as information that is missing

#### Scenario: The city a place was filed under by the rule

- **WHEN** a place was filed under a city by the claiming rule rather than by hand
- **THEN** selecting it names that city
- **AND** the person can tell where it was filed without opening the form
