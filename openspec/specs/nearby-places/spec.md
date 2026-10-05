# nearby-places Specification

## Purpose

Lets a person on the trip see which of the trip's places are nearest, as a list ordered
by distance, on the phone and on the laptop. This capability covers the Nearby sheet:
what it lists, the point its order is measured from, how location is offered inside it,
what each row shows, how the order behaves while the person moves, and what choosing a
row does.

## Requirements

### Requirement: Nearby lists the trip's places, nearest first

Each application SHALL offer a tool named **Nearby** that opens a sheet listing the
current trip's places in order of distance from a reference point, nearest first. On a
phone-shaped screen the sheet SHALL rise over the map; on a laptop-shaped screen it SHALL
open as a panel beside the control that opened it, as *A panel opens beside the control
that opened it* requires.

The sheet SHALL list exactly the places the map is showing under the current filter, as
*A filter applies to every view of the trip at once* requires, and SHALL say in its
heading how many places it lists. Where the filter is narrowing the trip, the heading
SHALL say so beside the count.

The sheet SHALL be usable as soon as it opens. It SHALL NOT wait on a position, and
SHALL NOT be replaced by a loading state, an error or an empty screen while one is being
found: with no position, it is already ordered from the map (see *The heading says what
the order is measured from*).

Rationale: the person asking *what of ours is near me* is standing in a street. A list
that waits for a GPS fix, or that disappears when one is refused, answers nothing at the
moment it is wanted.

#### Scenario: Opening Nearby on the phone

- **WHEN** a person presses Nearby on the phone
- **THEN** a sheet rises over the map listing the trip's places, nearest first
- **AND** its heading states how many places it lists

#### Scenario: Opening Nearby on the laptop

- **WHEN** a person presses Nearby on the laptop
- **THEN** a panel opens beside the control listing the trip's places, nearest first

#### Scenario: A filter is applied

- **WHEN** the trip is narrowed to the places two people both want, and Nearby is opened
- **THEN** the sheet lists only those places
- **AND** its heading says the trip is filtered and how many places it lists

#### Scenario: No position yet

- **WHEN** Nearby is opened and no position is known
- **THEN** the list is shown at once, already ordered
- **AND** no spinner, error or empty screen stands in its place

### Requirement: The heading says what the order is measured from

The order SHALL be measured from the person's position when one is known, and from the
middle of the part of the map that is not covered otherwise. The sheet's heading SHALL
say which: *Nearest to you*, or *Nearest to the middle of the map*.

The order SHALL switch from the map to the person when a position becomes known, and the
heading with it.

No mark SHALL be drawn on the map for the middle of the map. The heading is the
statement.

Rationale: a list ordered from *somewhere* is always useful — a person who refuses
location can still pan the map to where they are standing and read the list — but a
distance with no stated origin is a number that cannot be trusted. Rationale for no
mark: the crosshair is the glyph of "where am I" (`device-location`), and a second
crosshair on the map would read as the person's position.

#### Scenario: Position known

- **WHEN** Nearby is open and the person's position is known
- **THEN** the heading reads *Nearest to you*
- **AND** the distances are measured from the person

#### Scenario: No position

- **WHEN** Nearby is open and no position is known
- **THEN** the heading reads *Nearest to the middle of the map*
- **AND** the distances are measured from the middle of the uncovered part of the map

#### Scenario: A position arrives

- **WHEN** a position is found while the sheet is ordered from the map
- **THEN** the sheet re-orders from the person
- **AND** the heading changes to *Nearest to you*

### Requirement: Location is offered inside the sheet

When the person has never answered the location question, the sheet SHALL show a line
above the list offering to order it from where they are, with a control named
*Use my location*. Pressing it SHALL ask through the platform's own prompt, as pressing
"where am I" does (`device-location`), and SHALL NOT move the map.

When location has already been allowed, opening Nearby SHALL find the person's position
without a press, including after the application was closed and opened again. This
SHALL NOT move the map.

While a position is being found, the line SHALL say so in a quiet form and the list SHALL
stay usable beneath it. The attempt SHALL end after the same bounded wait "where am I"
uses.

When location cannot be used, the line SHALL say why, in the same situations and with
the same meaning as the notes "where am I" shows over the map, in words from the
product's named sentences:

- **Refused**, on the phone: location is off for the application, with a control that
  opens the application's page in the device's settings. On the laptop: the browser is
  blocking location for the site, and it can be allowed from the address bar.
- **Not found** within the wait: the position could not be found, with a control that
  tries again.

Granting location in the device's settings after refusing it SHALL take effect when the
person returns to the application, without reinstalling it.

While the sheet is open and carrying one of these lines, the same note SHALL NOT also be
shown over the map.

Rationale: the line is the explanation the platform's prompt needs — the person has just
opened a list of distances and been asked whether to measure them from where they stand.
It is offered rather than demanded so that refusing costs nothing but the ordering.

#### Scenario: Never asked

- **WHEN** a person who has never answered the location question opens Nearby
- **THEN** a line offers *Use my location* above a list ordered from the map
- **AND** no platform prompt has been shown

#### Scenario: Pressing Use my location

- **WHEN** the person presses *Use my location*
- **THEN** the platform's own location prompt is shown
- **AND** the map does not move

#### Scenario: Already allowed, after a relaunch

- **WHEN** location was allowed in an earlier session and the person opens Nearby
- **THEN** the position is found without a further press
- **AND** the map does not move

#### Scenario: Still finding

- **WHEN** a position is being found
- **THEN** a quiet line says the position is being found
- **AND** the list beneath it can be scrolled and its rows pressed

#### Scenario: Refused on the phone

- **WHEN** the person has refused location on the phone and opens Nearby
- **THEN** the list is ordered from the map
- **AND** a line says location is off, with a control that opens the device's settings

#### Scenario: Refused on the laptop

- **WHEN** the browser is blocking location and the person opens Nearby
- **THEN** the list is ordered from the map
- **AND** a line says the browser is blocking location and to allow it from the address bar

#### Scenario: Not found

- **WHEN** no position arrives before the wait ends
- **THEN** the list stays ordered from the map
- **AND** a line says the position could not be found, with a control that tries again

#### Scenario: Allowed later in Settings

- **WHEN** a person who refused allows location in the device's settings and returns
- **THEN** opening Nearby finds the position and orders the list from the person

#### Scenario: Spanish

- **WHEN** the application is in Spanish
- **THEN** the sheet's heading, lines and controls are in Spanish

### Requirement: A rough position says it is rough

When the person's position is known but reported as uncertain by more than 200 metres,
the sheet SHALL say so in a line above the list, stating the uncertainty in the same
units as the distances, and SHALL say the distances are approximate. The list SHALL
still be ordered from the person.

Rationale: a laptop locating itself by Wi-Fi, or a phone with precise location turned
off, may know only the neighbourhood. A row reading *350 m* from a position known to
1.5 km claims a precision the device does not have; the map already shows the
uncertainty as a shaded circle (`device-location`), and the list, which shows no map,
has to say it in words.

#### Scenario: Precise location off

- **WHEN** the position is reported as uncertain to about 1.5 kilometres
- **THEN** a line says the position is only known to about 1.5 km
- **AND** the list is ordered from the person

#### Scenario: A precise position

- **WHEN** the position is reported as uncertain to 20 metres
- **THEN** no such line is shown

### Requirement: Each row says what the place is and how far

Each row SHALL show the place's type as its icon in the type's colour, the place's name,
and beneath the name the city it is filed under — and *✓ Visited* when it has been
visited. A place filed under no city SHALL say so in the city's place. The row SHALL
show the distance at its end, aligned with the distances of the other rows.

The distance SHALL be measured in a straight line. Under 1 kilometre it SHALL be written
in metres, rounded to the nearest 10; from 1 kilometre it SHALL be written in kilometres,
with one decimal under 10 and none from 10. It SHALL be written in the application's
language.

A visited place SHALL keep its position in the order and SHALL be drawn with its name
dimmed. A place more than 50 kilometres away SHALL have its distance drawn dimmed.

A name too long for the row SHALL be cut short on one line rather than wrapping. The
distance SHALL NOT be cut.

Rationale for a straight line: a distance along the streets needs a routing service, and
the free one the product uses (`place-route`) asks for at most one request a second — a
list of sixty places would take a minute to fill and would ask again whenever the person
moved. A straight line is instant, works with no connection, and keeps the order honest;
the route to any one place is a press away from its details. Rationale for metres: on
foot, *0.3 km* is read as a calculation and *300 m* as a distance. Rationale for keeping visited places in order: a
person standing beside a place they visited yesterday still wants to know it is there,
and moving it would make the order lie about what is nearest.

#### Scenario: A row near the person

- **WHEN** a temple 350 metres away, in Kyoto, not yet visited, is listed
- **THEN** its row shows the temple icon, its name, *Kyoto*, and *350 m*

#### Scenario: A visited place

- **WHEN** a visited place is listed
- **THEN** its row says *✓ Visited* beside its city
- **AND** its name is dimmed
- **AND** it stays in its distance order

#### Scenario: A day trip away

- **WHEN** a place 34 kilometres away is listed
- **THEN** its distance reads *34 km*
- **AND** it is not dimmed
- **AND** a place 120 kilometres away has its distance dimmed

#### Scenario: A long name

- **WHEN** a place's name is longer than the row
- **THEN** the name is cut short on one line
- **AND** the distance is shown in full

### Requirement: The order holds while the person moves

While the sheet is open, the distances SHALL follow the reference point as it moves —
the person walking, or the map being panned when the order is from the map — but the
order of the rows SHALL NOT change on its own.

When the distances no longer agree with the order, the sheet SHALL show a control named
*Re-sort* in its heading. Pressing it SHALL re-order the rows by the current distances.
Disagreements smaller than the device's own uncertainty SHALL NOT count.

Opening the sheet SHALL always order it fresh.

Rationale: a list that re-orders itself under a moving thumb makes a person press the
row that slid into the place of the one they aimed at. Freezing the distances as well
would show numbers that are wrong a block later. Rationale for the threshold: a position
wanders by a few metres while standing still, and a *Re-sort* that appears and vanishes
with that noise is a control nobody can trust.

#### Scenario: Walking with the sheet open

- **WHEN** the person walks and two places change which is nearer
- **THEN** both distances update
- **AND** the rows keep their places
- **AND** *Re-sort* appears in the heading

#### Scenario: Pressing Re-sort

- **WHEN** the person presses *Re-sort*
- **THEN** the rows are ordered by their current distances
- **AND** *Re-sort* disappears

#### Scenario: Standing still

- **WHEN** the reported position wanders by a few metres while the person stands still
- **THEN** *Re-sort* does not appear

#### Scenario: Reopening

- **WHEN** the sheet is closed and opened again
- **THEN** it is ordered by the current distances

### Requirement: Nearby is drawn from the product's tokens on both grounds

The sheet, its lines, its rows and the Nearby tool SHALL take every colour from the
product's tokens, and SHALL be checked on the light ground and the dark ground in both
applications. Text drawn on a filled control SHALL use the ink meant for that fill.

#### Scenario: Both grounds

- **WHEN** the sheet is shown on the dark ground
- **THEN** every line, row, distance and control is legible against what it is drawn on

### Requirement: Choosing a row opens the place

Pressing a row SHALL close the sheet, open that place as selecting it on the map does,
and move the map to it (`map-rendering`). Closing the place SHALL leave the map, with
the place still on screen where the map moved to, and SHALL NOT reopen the Nearby
sheet. Opening Nearby again SHALL order it fresh, as every opening does.

Rationale: a row is pressed to find out where a place is. Once the place is shown, the
map is the answer; putting the list back over it on close covers the one thing the
person went to look at. *Only one thing opens at a time* still holds: the sheet is closed
while the place is open, not drawn behind it.

#### Scenario: Opening a place from the list

- **WHEN** a person presses a row in Nearby
- **THEN** the sheet closes, the place opens, and the map moves to it

#### Scenario: Closing the place

- **WHEN** the person closes a place opened from Nearby
- **THEN** the map is shown with the place on it
- **AND** the Nearby sheet does not open again

#### Scenario: Back to the list by hand

- **WHEN** the person presses Nearby again after closing the place
- **THEN** the sheet opens ordered by the current distances
